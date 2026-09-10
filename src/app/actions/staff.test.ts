import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStaffMembers, inviteStaffMember } from './staff';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

describe('staff actions', () => {
  let mockServerClient: {
    auth: {
      getUser: ReturnType<typeof vi.fn>;
    };
    from: ReturnType<typeof vi.fn>;
  };

  let mockAdminClient: {
    from: ReturnType<typeof vi.fn>;
    auth: {
      admin: {
        getUserById: ReturnType<typeof vi.fn>;
        inviteUserByEmail: ReturnType<typeof vi.fn>;
      };
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const tenantUsersData = [
      {
        id: 'tu-1',
        user_id: 'u-1',
        role: 'owner',
        role_id: null,
        created_at: '2026-09-01T00:00:00Z',
        tenant_roles: null,
      },
      {
        id: 'tu-2',
        user_id: 'u-2',
        role: 'admin',
        role_id: null,
        created_at: '2026-09-02T00:00:00Z',
        tenant_roles: null,
      },
      {
        id: 'tu-3',
        user_id: 'u-3',
        role: 'member',
        role_id: null,
        created_at: '2026-09-03T00:00:00Z',
        tenant_roles: null,
      },
    ];

    mockServerClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'owner-user-id', email: 'owner@merchander.com' } },
          error: null,
        }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'tenant_users') {
          return {
            select: vi.fn().mockImplementation(() => {
              type ChainType = Promise<{ data: typeof tenantUsersData; error: null }> & {
                eq?: ReturnType<typeof vi.fn>;
              };
              const chain = Promise.resolve({ data: tenantUsersData, error: null }) as ChainType;
              chain.eq = vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { tenant_id: 'tenant-123', role: 'owner' },
                  error: null,
                }),
              });
              return chain;
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    mockAdminClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'tenant_users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'tu-1',
                  user_id: 'u-1',
                  role: 'owner',
                  role_id: null,
                  created_at: '2026-09-01T00:00:00Z',
                  tenant_roles: null,
                },
                {
                  id: 'tu-2',
                  user_id: 'u-2',
                  role: 'admin',
                  role_id: null,
                  created_at: '2026-09-02T00:00:00Z',
                  tenant_roles: null,
                },
                {
                  id: 'tu-3',
                  user_id: 'u-3',
                  role: 'member',
                  role_id: null,
                  created_at: '2026-09-03T00:00:00Z',
                  tenant_roles: null,
                },
              ],
              error: null,
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }),
      auth: {
        admin: {
          getUserById: vi.fn().mockImplementation((userId: string) => {
            if (userId === 'u-1') {
              return Promise.resolve({
                data: {
                  user: {
                    id: 'u-1',
                    email: 'ama@store.com',
                    user_metadata: { full_name: 'Ama Serwah' },
                  },
                },
              });
            }
            if (userId === 'u-2') {
              return Promise.resolve({
                data: {
                  user: {
                    id: 'u-2',
                    email: 'kofi@store.com',
                    user_metadata: { name: 'Kofi Mensah' },
                  },
                },
              });
            }
            if (userId === 'u-3') {
              return Promise.resolve({
                data: {
                  user: {
                    id: 'u-3',
                    email: 'kwame.asante@store.com',
                    user_metadata: {},
                  },
                },
              });
            }
            return Promise.resolve({ data: { user: null } });
          }),
          inviteUserByEmail: vi.fn().mockResolvedValue({
            data: { user: { id: 'invited-user-uuid' } },
            error: null,
          }),
        },
      },
    };

    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockServerClient);
    (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);
  });

  describe('getStaffMembers', () => {
    it('correctly resolves full_name, name fallback, and email username fallback', async () => {
      const res = await getStaffMembers();
      expect(res.error).toBeNull();
      expect(res.data).toHaveLength(3);

      expect(res.data?.[0].full_name).toBe('Ama Serwah');
      expect(res.data?.[1].full_name).toBe('Kofi Mensah');
      expect(res.data?.[2].full_name).toBe('Kwame Asante');
    });
  });

  describe('inviteStaffMember', () => {
    it('sends invite with redirectTo callback and dual metadata', async () => {
      const formData = new FormData();
      formData.append('email', 'newstaff@store.com');
      formData.append('role', 'admin');
      formData.append('full_name', 'Esi Boateng');

      const res = await inviteStaffMember(formData);
      expect(res).toEqual({ success: true });

      expect(mockAdminClient.auth.admin.inviteUserByEmail).toHaveBeenCalledWith(
        'newstaff@store.com',
        expect.objectContaining({
          data: { full_name: 'Esi Boateng', name: 'Esi Boateng' },
          redirectTo: expect.stringContaining('/auth/callback?next=/dashboard'),
        })
      );
    });

    it('derives human-readable name from email prefix if full_name is omitted', async () => {
      const formData = new FormData();
      formData.append('email', 'john.doe@store.com');
      formData.append('role', 'member');

      const res = await inviteStaffMember(formData);
      expect(res).toEqual({ success: true });

      expect(mockAdminClient.auth.admin.inviteUserByEmail).toHaveBeenCalledWith(
        'john.doe@store.com',
        expect.objectContaining({
          data: { full_name: 'John Doe', name: 'John Doe' },
          redirectTo: expect.stringContaining('/auth/callback?next=/dashboard'),
        })
      );
    });

    it('rejects invite if caller is not tenant owner', async () => {
      mockServerClient.from = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { tenant_id: 'tenant-123', role: 'member' },
          error: null,
        }),
      }));

      const formData = new FormData();
      formData.append('email', 'staff@store.com');
      formData.append('role', 'member');

      const res = await inviteStaffMember(formData);
      expect(res.error).toBe('Only owners can invite staff');
      expect(mockAdminClient.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
    });
  });
});
