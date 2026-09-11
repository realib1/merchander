import { describe, it, expect, vi, beforeEach } from 'vitest';
import { selfServiceSignupAction, SelfServiceSignupPayload } from './signup';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

describe('selfServiceSignupAction', () => {
  const validPayload: SelfServiceSignupPayload = {
    fullName: 'Ama Frimpong',
    email: 'ama@glamourhaven.store',
    password: 'SecurePassword123!',
    phone: '0241234567',
    storeName: 'Glamour Haven',
    slug: 'glamour-haven',
    currency: 'GHS',
    city: 'Accra',
    archetype: 'import_resale',
  };

  let mockAdminClient: {
    from: ReturnType<typeof vi.fn>;
    auth: {
      admin: {
        createUser: ReturnType<typeof vi.fn>;
        deleteUser: ReturnType<typeof vi.fn>;
      };
    };
  };

  let mockServerClient: {
    auth: {
      signInWithPassword: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockServerClient = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      },
    };
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockServerClient);

    mockAdminClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'platform_staff_users') {
          return buildMockChain({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          });
        }
        if (table === 'storefront_settings') {
          return buildMockChain({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          });
        }
        if (table === 'tenants') {
          return buildMockChain({
            single: vi.fn().mockResolvedValue({ data: { id: 'new-tenant-uuid' }, error: null }),
          });
        }
        return buildMockChain();
      }),
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'new-auth-uuid', email: validPayload.email } },
            error: null,
          }),
          deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    };
    (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);
  });

  it('provisions a new merchant workspace successfully on valid input', async () => {
    const res = await selfServiceSignupAction(validPayload);
    expect(res.success).toBe(true);
    expect(res.tenantId).toBe('new-tenant-uuid');

    // Verify auth user creation with dual name metadata
    expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ama@glamourhaven.store',
        password: 'SecurePassword123!',
        user_metadata: expect.objectContaining({
          name: 'Ama Frimpong',
          full_name: 'Ama Frimpong',
        }),
      })
    );

    // Verify session sign-in
    expect(mockServerClient.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'ama@glamourhaven.store',
      password: 'SecurePassword123!',
    });
  });

  it('rejects signup with missing or whitespace-only full name', async () => {
    const res = await selfServiceSignupAction({ ...validPayload, fullName: '   ' });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Full name is required');
  });

  it('rejects invalid email address', async () => {
    const res = await selfServiceSignupAction({ ...validPayload, email: 'not-an-email' });
    expect(res.success).toBe(false);
    expect(res.error).toContain('email');
  });

  it('rejects platform staff email to maintain strict role separation', async () => {
    mockAdminClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'platform_staff_users') {
        return buildMockChain({
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'staff-123' }, error: null }),
        });
      }
      return buildMockChain();
    });

    const res = await selfServiceSignupAction(validPayload);
    expect(res.success).toBe(false);
    expect(res.error).toContain('platform administrator email');
  });

  it('rejects short passwords under 8 characters', async () => {
    const res = await selfServiceSignupAction({ ...validPayload, password: 'short' });
    expect(res.success).toBe(false);
    expect(res.error).toContain('at least 8 characters');
  });

  it('rejects invalid store slug', async () => {
    const res = await selfServiceSignupAction({ ...validPayload, slug: 'inv@lid!' });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Slug');
  });

  it('rejects already taken store slug', async () => {
    mockAdminClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'platform_staff_users') {
        return buildMockChain();
      }
      if (table === 'storefront_settings') {
        return buildMockChain({
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing-store' }, error: null }),
        });
      }
      return buildMockChain();
    });

    const res = await selfServiceSignupAction(validPayload);
    expect(res.success).toBe(false);
    expect(res.error).toContain('already registered');
  });

  it('handles existing email auth conflict cleanly', async () => {
    mockAdminClient.auth.admin.createUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'A user with this email already exists', status: 422 },
    });

    const res = await selfServiceSignupAction(validPayload);
    expect(res.success).toBe(false);
    expect(res.error).toContain('An account with this email already exists');
  });

  it('rejects registration when new signups are paused by platform administrator', async () => {
    mockAdminClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'platform_settings') {
        return buildMockChain({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { disable_new_signups: true },
            error: null,
          }),
        });
      }
      return buildMockChain();
    });

    const res = await selfServiceSignupAction(validPayload);
    expect(res.success).toBe(false);
    expect(res.error).toContain('registrations are currently paused');
  });
});
