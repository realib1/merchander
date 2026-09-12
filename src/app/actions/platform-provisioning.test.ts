
import { createMerchanderAction } from './platform';
import { CreateMerchanderPayload } from '@/types/platform';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/auth/platform-staff', () => ({
  getPlatformStaffRecord: vi.fn(),
  PLATFORM_RBAC_RULES: {
    '/platform': ['platform_owner', 'platform_admin', 'operations'],
  },
  PLATFORM_PLAN_READ_ROLES: ['platform_owner', 'platform_admin'],
}));

vi.mock('./platform-audit', () => ({
  logPlatformAuditAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlatformStaffRecord } from '@/lib/auth/platform-staff';
import { logPlatformAuditAction } from './platform-audit';
import { revalidatePath } from 'next/cache';

interface MockChain {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
}

function buildMockChain(overrides: Partial<MockChain> = {}): MockChain {
  const chain: MockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'new-tenant-uuid' }, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  return chain;
}

describe('createMerchanderAction', () => {
  const mockStaffUser = { id: 'staff-user-123', email: 'admin@merchander.app' };
  let mockServerClient: {
    auth: { getUser: ReturnType<typeof vi.fn> };
  };
  let mockAdminClient: {
    from: ReturnType<typeof vi.fn>;
    auth: {
      admin: {
        createUser: ReturnType<typeof vi.fn>;
        listUsers: ReturnType<typeof vi.fn>;
      };
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockServerClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockStaffUser },
        }),
      },
    };
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockServerClient);

    (getPlatformStaffRecord as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'staff-rec-1',
      user_id: mockStaffUser.id,
      email: mockStaffUser.email,
      role: 'platform_owner',
      is_active: true,
    });

    mockAdminClient = {
      from: vi.fn((table: string) => {
        return buildMockChain({
          maybeSingle: vi.fn().mockImplementation(() => {
            if (table === 'platform_plans') {
              return Promise.resolve({ data: { price_ghs: 350 }, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          }),
        });
      }),
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'auth-user-999', email: 'merchant@test.com' } },
            error: null,
          }),
          listUsers: vi.fn().mockResolvedValue({
            data: { users: [] },
            error: null,
          }),
        },
      },
    };
    (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);
  });

  const validPayload: CreateMerchanderPayload = {
    name: 'Accra Mart',
    slug: 'accra-mart',
    ownerEmail: 'owner@accramart.com',
    ownerName: 'Kwame Mensah',
    ownerPhone: '+233241234567',
    tier: 'growth',
    businessType: 'grocery',
    city: 'Accra',
  };

  it('rejects unauthenticated caller', async () => {
    mockServerClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

    const res = await createMerchanderAction(validPayload);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Unauthorized/);
  });

  it('rejects unauthorized staff role (support role lacks provisioning access)', async () => {
    (getPlatformStaffRecord as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'staff-rec-2',
      user_id: mockStaffUser.id,
      role: 'support',
      is_active: true,
    });

    const res = await createMerchanderAction(validPayload);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Forbidden/);
  });

  it('rejects deactivated staff account', async () => {
    (getPlatformStaffRecord as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'staff-rec-3',
      user_id: mockStaffUser.id,
      role: 'platform_admin',
      is_active: false,
    });

    const res = await createMerchanderAction(validPayload);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/deactivated/);
  });

  it('validates store name presence', async () => {
    const res = await createMerchanderAction({ ...validPayload, name: '   ' });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Store name is required/);
  });

  it('validates owner email format', async () => {
    const res = await createMerchanderAction({ ...validPayload, ownerEmail: 'not-an-email' });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/valid email/);
  });

  it('enforces strict role separation: rejects owner email that belongs to platform staff', async () => {
    mockAdminClient.from = vi.fn((table: string) => {
      return buildMockChain({
        maybeSingle: vi.fn().mockImplementation(() => {
          if (table === 'platform_staff_users') {
            return Promise.resolve({
              data: { id: 'staff-1', email: 'owner@accramart.com', is_active: true },
              error: null,
            });
          }
          return Promise.resolve({ data: null, error: null });
        }),
      });
    });

    const res = await createMerchanderAction(validPayload);
    expect(res.success).toBe(false);
    expect(res.error).toBe('Cannot provision a merchant using an active platform staff email.');
  });

  it('rejects invalid or reserved subdomain slug', async () => {
    const res = await createMerchanderAction({ ...validPayload, slug: 'admin' });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/reserved/);
  });

  it('rejects slug collision when slug already exists in storefront_settings', async () => {
    mockAdminClient.from = vi.fn((table: string) => {
      return buildMockChain({
        maybeSingle: vi.fn().mockImplementation(() => {
          if (table === 'storefront_settings') {
            return Promise.resolve({ data: { id: 'existing-storefront' }, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        }),
      });
    });

    const res = await createMerchanderAction(validPayload);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/already taken/);
  });

  it('successfully provisions merchant workspace and all related entities', async () => {
    const tablesInserted: Record<string, unknown[]> = {};
    mockAdminClient.from = vi.fn((table: string) => {
      const chain = buildMockChain({
        insert: vi.fn().mockImplementation((val: unknown) => {
          tablesInserted[table] = tablesInserted[table] || [];
          tablesInserted[table].push(val);
          return chain;
        }),
        single: vi.fn().mockImplementation(() => {
          if (table === 'tenants') {
            return Promise.resolve({ data: { id: 'tenant-accra-mart-123' }, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        }),
        maybeSingle: vi.fn().mockImplementation(() => {
          if (table === 'platform_plans') {
            return Promise.resolve({ data: { price_ghs: 350 }, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        }),
      });
      return chain;
    });

    const res = await createMerchanderAction({
      ...validPayload,
      password: 'CustomPassword123!',
    });

    expect(res.success).toBe(true);
    expect(res.tenantId).toBe('tenant-accra-mart-123');
    expect(res.credentials).toBeDefined();
    expect(res.credentials?.storeName).toBe('Accra Mart');
    expect(res.credentials?.slug).toBe('accra-mart');
    expect(res.credentials?.temporaryPassword).toBe('CustomPassword123!');
    expect(res.credentials?.ownerEmail).toBe('owner@accramart.com');
    expect(res.credentials?.subdomainUrl).toBe('https://accra-mart.merchander.app');

    expect(tablesInserted['tenants']).toBeDefined();
    expect(tablesInserted['tenant_users']).toBeDefined();
    expect(tablesInserted['stores']).toBeDefined();
    expect(tablesInserted['tenant_settings']).toBeDefined();
    expect(tablesInserted['storefront_settings']).toBeDefined();
    expect(tablesInserted['tenant_subscriptions']).toBeDefined();

    expect(tablesInserted['tenant_users'][0]).toEqual({
      tenant_id: 'tenant-accra-mart-123',
      user_id: 'auth-user-999',
      role: 'owner',
    });

    expect(tablesInserted['stores'][0]).toMatchObject({
      tenant_id: 'tenant-accra-mart-123',
      city: 'Accra',
      is_primary: true,
    });

    expect(logPlatformAuditAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PROVISION_MERCHANT',
        target_type: 'tenant',
        target_id: 'tenant-accra-mart-123',
        target_name: 'Accra Mart',
      })
    );

    expect(revalidatePath).toHaveBeenCalledWith('/platform');
    expect(revalidatePath).toHaveBeenCalledWith('/platform/merchants');
  });

  it('handles existing auth user by searching and linking gracefully', async () => {
    mockAdminClient.auth.admin.createUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'User already registered', status: 422 },
    });

    mockAdminClient.auth.admin.listUsers.mockResolvedValueOnce({
      data: {
        users: [
          { id: 'existing-auth-user', email: 'owner@accramart.com' },
        ],
      },
      error: null,
    });

    const res = await createMerchanderAction(validPayload);
    expect(res.success).toBe(true);
    expect(res.credentials?.temporaryPassword).toBeDefined();
  });
});
