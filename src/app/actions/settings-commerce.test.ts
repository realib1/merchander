import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPaymentSettings, updatePaymentSettings } from './settings-commerce';
import { encryptSecret, isEncrypted, maskSecret } from '@/utils/encryption';
import { PaymentSettings } from '@/types/settings';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/queries', () => ({
  getTenantInfo: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';

function createMockPaymentSettings(overrides: Partial<PaymentSettings> = {}): PaymentSettings {
  return {
    currency: 'GHS',
    methods: {
      mobileMoney: true,
      card: true,
      cash: true,
      bankTransfer: true,
      other: false,
    },
    codMaxOrderAmount: 500,
    momoDetails: {},
    bankDetails: {},
    recording: {
      allowManualRecording: true,
      requirePaymentReference: true,
      allowPartialPayments: true,
      recordSupplierPayments: true,
    },
    supplierPayments: {
      enabled: false,
      defaultMethods: ['momo', 'bank', 'cash'],
    },
    providers: {
      paystack: {
        connected: true,
        publicKey: 'pk_live_123',
        secretKey: 'sk_live_plaintext_super_secret_key_1234',
      },
      hubtel: { connected: false },
    },
    ...overrides,
  };
}

describe('settings-commerce payment credentials & encryption actions', () => {
  let mockSupabase: {
    auth: {
      getUser: ReturnType<typeof vi.fn>;
    };
    from: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    };

    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
  });

  it('returns default payment settings when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const settings = await getPaymentSettings();
    expect(settings.currency).toBe('GHS');
    expect(settings.providers).toBeDefined();
    expect(settings.methods.cash).toBe(true);
  });

  it('masks stored secrets and initiates upgrade for legacy plaintext secrets in getPaymentSettings', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });

    (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      tenantId: 'tenant-123',
      role: 'owner',
    });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'tenant_settings') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  store_currency: 'GHS',
                  settings_data: {
                    payment_settings: {
                      currency: 'GHS',
                      providers: {
                        paystack: {
                          enabled: true,
                          publicKey: 'pk_test_1234567890',
                          secretKey: 'sk_test_legacy_plaintext_secret_9999', // legacy plaintext
                        },
                      },
                    },
                  },
                },
              }),
            }),
          }),
          update: mockUpdate,
        };
      }
      return {};
    });

    const settings = await getPaymentSettings();
    const paystackSecret = settings.providers?.paystack?.secretKey;

    // Masked for client display
    expect(paystackSecret).toBeDefined();
    expect(paystackSecret).toContain('••••');

    // Asynchronous upgrade was dispatched to encrypt legacy secret
    expect(mockUpdate).toHaveBeenCalled();
    const updateArg = mockUpdate.mock.calls[0]?.[0];
    const storedSecret = updateArg?.settings_data?.payment_settings?.providers?.paystack?.secretKey;
    expect(isEncrypted(storedSecret)).toBe(true);
  });

  it('encrypts new plaintext secret key in updatePaymentSettings', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });

    (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      tenantId: 'tenant-123',
      role: 'owner',
    });

    const mockUpsert = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { settings_data: {} },
          }),
        }),
      }),
      upsert: mockUpsert,
    });

    const payload = createMockPaymentSettings({
      providers: {
        paystack: {
          connected: true,
          publicKey: 'pk_live_123',
          secretKey: 'sk_live_plaintext_super_secret_key_1234',
        },
        hubtel: { connected: false },
      },
    });

    const res = await updatePaymentSettings(payload);
    expect(res.success).toBe(true);
    expect(mockUpsert).toHaveBeenCalled();

    const upsertArg = mockUpsert.mock.calls[0]?.[0];
    const storedSecret = upsertArg.settings_data.payment_settings.providers.paystack.secretKey;
    expect(isEncrypted(storedSecret)).toBe(true);
  });

  it('preserves existing encrypted secret when masked string is submitted', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });

    (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      tenantId: 'tenant-123',
      role: 'admin',
    });

    const existingEncrypted = encryptSecret('sk_live_already_encrypted_original_key');
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              settings_data: {
                payment_settings: {
                  providers: {
                    paystack: {
                      connected: true,
                      secretKey: existingEncrypted,
                    },
                    hubtel: { connected: false },
                  },
                },
              },
            },
          }),
        }),
      }),
      upsert: mockUpsert,
    });

    const payload = createMockPaymentSettings({
      providers: {
        paystack: {
          connected: true,
          publicKey: 'pk_live_123',
          secretKey: maskSecret(existingEncrypted), // masked value from client input
        },
        hubtel: { connected: false },
      },
    });

    const res = await updatePaymentSettings(payload);
    expect(res.success).toBe(true);

    const upsertArg = mockUpsert.mock.calls[0]?.[0];
    const storedSecret = upsertArg.settings_data.payment_settings.providers.paystack.secretKey;
    expect(storedSecret).toBe(existingEncrypted);
  });

  it('rejects updates from unauthorized roles', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-2' } },
    });

    (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      tenantId: 'tenant-123',
      role: 'cashier',
    });

    const payload = createMockPaymentSettings();

    const res = await updatePaymentSettings(payload);
    expect(res.error).toBe('Insufficient permissions');
  });
});
