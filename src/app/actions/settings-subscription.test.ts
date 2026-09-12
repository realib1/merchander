
import { getSubscriptionSettings, updateSubscriptionTier } from './settings-subscription';
import { SUBSCRIPTION_TIER_CONFIG } from '@/utils/subscription';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/supabase/queries', () => ({
  getTenantInfo: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';

describe('settings-subscription actions', () => {
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

  describe('getSubscriptionSettings', () => {
    it('returns fallback settings when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const settings = await getSubscriptionSettings();

      expect(settings.tier).toBe('starter');
      expect(settings.monthlyPrice).toBe(0);
      expect(settings.annualPrice).toBe(0);
      expect(settings.status).toBe('active');
      expect(settings.usage.products.limit).toBe(100);
      expect(settings.usage.staffSeats.limit).toBe(1);
      expect(settings.usage.botMessages.limit).toBe(50);
      expect(settings.invoices).toEqual([]);
    });

    it('returns canonical starter tier pricing and quotas for a default merchant', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'usr-1' } },
      });

      (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        tenantId: 'tenant-12345',
        role: 'owner',
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 12 }),
            }),
          };
        }
        if (table === 'tenant_users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 1 }),
            }),
          };
        }
        if (table === 'messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 18 }),
              }),
            }),
          };
        }
        if (table === 'tenant_subscriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    tier: 'starter',
                    status: 'active',
                    billing_cycle: 'monthly',
                    created_at: '2026-09-01T00:00:00Z',
                  },
                }),
              }),
            }),
          };
        }
        if (table === 'tenant_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { settings_data: {} },
                }),
              }),
            }),
          };
        }
        return {};
      });

      const settings = await getSubscriptionSettings();

      expect(settings.tier).toBe('starter');
      expect(settings.monthlyPrice).toBe(0);
      expect(settings.annualPrice).toBe(0);
      expect(settings.renewalDate).toBe('Continuous Free Access');
      expect(settings.usage.products.current).toBe(12);
      expect(settings.usage.products.limit).toBe(SUBSCRIPTION_TIER_CONFIG.starter.limits.products);
      expect(settings.usage.staffSeats.limit).toBe(1);
      expect(settings.usage.botMessages.current).toBe(18);
      expect(settings.usage.botMessages.limit).toBe(50);
      expect(settings.invoices.length).toBe(1);
      expect(settings.invoices[0].invoiceNumber).toContain('INV-TR-');
    });

    it('returns canonical Pro pricing and merges paymentMethod and paid invoices from tenant_settings', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'usr-2' } },
      });

      (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        tenantId: 'tenant-growth-1',
        role: 'owner',
      });

      const mockSavedPaymentMethod = {
        type: 'card' as const,
        identifier: '•••• 8821',
        isVerified: true,
        brand: 'visa',
        last4: '8821',
        provider: 'paystack' as const,
        authorizationCode: 'AUTH_8821test',
      };

      const mockPaidInvoice = {
        id: 'inv-paid-1',
        invoiceNumber: 'INV-2026-PAY1',
        date: '2026-09-05',
        amount: 250,
        currency: 'GHS',
        status: 'paid' as const,
        planName: 'Merchander Pro (monthly)',
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 85 }),
            }),
          };
        }
        if (table === 'tenant_users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 4 }),
            }),
          };
        }
        if (table === 'messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 142 }),
              }),
            }),
          };
        }
        if (table === 'tenant_subscriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    tier: 'pro',
                    billing_cycle: 'monthly',
                    status: 'active',
                    renewal_date: '2026-10-05T00:00:00Z',
                    created_at: '2026-08-01T00:00:00Z',
                  },
                }),
              }),
            }),
          };
        }
        if (table === 'tenant_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    settings_data: {
                      subscription: {
                        tier: 'pro',
                        billingCycle: 'monthly',
                        renewalDate: '5 Oct 2026',
                        paymentMethod: mockSavedPaymentMethod,
                        invoices: [mockPaidInvoice],
                      },
                    },
                  },
                }),
              }),
            }),
          };
        }
        return {};
      });

      const settings = await getSubscriptionSettings();

      expect(settings.tier).toBe('pro');
      expect(settings.monthlyPrice).toBe(250);
      expect(settings.annualPrice).toBe(2400);
      expect(settings.paymentMethod).toEqual(mockSavedPaymentMethod);
      expect(settings.usage.products.limit).toBe(500);
      expect(settings.usage.staffSeats.limit).toBe(7);
      expect(settings.usage.botMessages.current).toBe(142);
      expect(settings.usage.botMessages.limit).toBe(1000);

      // Invoices must include BOTH the paid invoice and the generated trial invoice
      expect(settings.invoices.length).toBe(2);
      const invoiceNumbers = settings.invoices.map((i) => i.invoiceNumber);
      expect(invoiceNumbers).toContain('INV-2026-PAY1');
      expect(invoiceNumbers.some((num) => num.startsWith('INV-TR-'))).toBe(true);
      // Since paid invoice (2026-09-05) is newer than trial signup (2026-08-01), paid invoice is first
      expect(settings.invoices[0].invoiceNumber).toBe('INV-2026-PAY1');
    });

    it('purges fake or mock cards (such as 4242 or demo cards) and returns paymentMethod as null', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'usr-fake-card' } },
      });

      (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        tenantId: 'tenant-fake-1',
        role: 'owner',
      });

      const fakeCard = {
        type: 'card' as const,
        identifier: '•••• 4242',
        brand: 'visa',
        last4: '4242',
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'tenant_subscriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    tier: 'starter',
                    status: 'active',
                    payment_method: fakeCard,
                  },
                }),
              }),
            }),
          };
        }
        if (table === 'tenant_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    settings_data: {
                      subscription: {
                        paymentMethod: fakeCard,
                      },
                    },
                  },
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 0 }),
            }),
          }),
        };
      });

      const settings = await getSubscriptionSettings();
      expect(settings.paymentMethod).toBeNull();
    });

    it('preserves explicit null paymentMethod even if tenant_subscriptions contains a legacy card', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'usr-removed-card' } },
      });

      (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        tenantId: 'tenant-removed-1',
        role: 'owner',
      });

      const legacyCard = {
        type: 'card' as const,
        identifier: '•••• 9988',
        brand: 'mastercard',
        last4: '9988',
        isVerified: true,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'tenant_subscriptions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    tier: 'starter',
                    status: 'active',
                    payment_method: legacyCard,
                  },
                }),
              }),
            }),
          };
        }
        if (table === 'tenant_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    settings_data: {
                      subscription: {
                        paymentMethod: null, // User explicitly removed billing method
                      },
                    },
                  },
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 0 }),
            }),
          }),
        };
      });

      const settings = await getSubscriptionSettings();
      expect(settings.paymentMethod).toBeNull();
    });
  });

  describe('updateSubscriptionTier', () => {
    it('blocks unauthorized users from changing subscription tiers', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'usr-member' } },
      });

      (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        tenantId: 'tenant-12345',
        role: 'member',
      });

      const res = await updateSubscriptionTier('enterprise', 'annual');
      expect(res.error).toBe('Insufficient permissions');
    });

    it('synchronizes both relational and JSON store when owner updates subscription tier', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'usr-admin' } },
      });

      (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        tenantId: 'tenant-12345',
        role: 'owner',
      });

      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'tenant_subscriptions') {
          return {
            upsert: mockUpsert,
          };
        }
        if (table === 'tenant_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    settings_data: {
                      subscription: {
                        tier: 'starter',
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

      const res = await updateSubscriptionTier('enterprise', 'annual');

      expect(res.success).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 'tenant-12345',
          tier: 'enterprise',
          billing_cycle: 'annual',
          price_monthly: 750,
          status: 'active',
        }),
        { onConflict: 'tenant_id' }
      );
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          settings_data: expect.objectContaining({
            subscription: expect.objectContaining({
              tier: 'enterprise',
              billingCycle: 'annual',
              status: 'active',
            }),
          }),
        })
      );
    });
  });
});
