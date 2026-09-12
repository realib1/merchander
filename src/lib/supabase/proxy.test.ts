
import { NextRequest } from 'next/server';
import {
  updateSession,
  isMaintenanceModeActive,
  isMaintenanceExemptPath,
  clearMaintenanceCache,
  setServiceRoleClientForTesting,
} from './proxy';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('@/lib/auth/platform-staff', () => ({
  isActivePlatformStaff: vi.fn(),
}));

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { isActivePlatformStaff } from '@/lib/auth/platform-staff';

describe('src/lib/supabase/proxy.ts', () => {
  let mockSupabase: {
    auth: {
      getUser: ReturnType<typeof vi.fn>;
      mfa: {
        getAuthenticatorAssuranceLevel: ReturnType<typeof vi.fn>;
      };
    };
  };

  let mockAdminClient: {
    from: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearMaintenanceCache();

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        mfa: {
          getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
            data: { currentLevel: 'aal1', nextLevel: 'aal1' },
            error: null,
          }),
        },
      },
    };
    (createServerClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

    mockAdminClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { maintenance_mode: false },
              error: null,
            }),
          }),
        }),
      }),
    };
    setServiceRoleClientForTesting(mockAdminClient as unknown as ReturnType<typeof createClient>);
    (isActivePlatformStaff as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(false);
  });

  describe('isMaintenanceExemptPath', () => {
    it('identifies exempt paths correctly', () => {
      expect(isMaintenanceExemptPath('/maintenance')).toBe(true);
      expect(isMaintenanceExemptPath('/platform')).toBe(true);
      expect(isMaintenanceExemptPath('/platform/settings/controls')).toBe(true);
      expect(isMaintenanceExemptPath('/login')).toBe(true);
      expect(isMaintenanceExemptPath('/auth/callback')).toBe(true);
      expect(isMaintenanceExemptPath('/api/webhooks/paystack')).toBe(true);
      expect(isMaintenanceExemptPath('/api/health')).toBe(true);
    });

    it('identifies non-exempt paths correctly', () => {
      expect(isMaintenanceExemptPath('/dashboard')).toBe(false);
      expect(isMaintenanceExemptPath('/dashboard/orders')).toBe(false);
      expect(isMaintenanceExemptPath('/store/glamour-haven')).toBe(false);
      expect(isMaintenanceExemptPath('/signup')).toBe(false);
      expect(isMaintenanceExemptPath('/')).toBe(false);
    });
  });

  describe('isMaintenanceModeActive', () => {
    it('returns false when maintenance_mode is false', async () => {
      const active = await isMaintenanceModeActive(true);
      expect(active).toBe(false);
    });

    it('returns true when maintenance_mode is true', async () => {
      mockAdminClient.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { maintenance_mode: true },
              error: null,
            }),
          }),
        }),
      });

      const active = await isMaintenanceModeActive(true);
      expect(active).toBe(true);
    });

    it('uses in-memory cache within TTL and avoids duplicate database queries', async () => {
      mockAdminClient.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { maintenance_mode: true },
              error: null,
            }),
          }),
        }),
      });

      const first = await isMaintenanceModeActive();
      expect(first).toBe(true);
      expect(mockAdminClient.from).toHaveBeenCalledTimes(1);

      // Second call within TTL should return cached value without querying DB
      const second = await isMaintenanceModeActive();
      expect(second).toBe(true);
      expect(mockAdminClient.from).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateSession with maintenance mode', () => {
    it('redirects unauthenticated visitor to /maintenance when maintenance mode is active on non-exempt route', async () => {
      mockAdminClient.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { maintenance_mode: true },
              error: null,
            }),
          }),
        }),
      });

      const req = new NextRequest('http://localhost:3000/dashboard/orders');
      const res = await updateSession(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/maintenance');
    });

    it('redirects regular merchant user to /maintenance when maintenance mode is active', async () => {
      mockAdminClient.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { maintenance_mode: true },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: 'merchant-user-1', email: 'merchant@store.com' } },
        error: null,
      });
      (isActivePlatformStaff as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const req = new NextRequest('http://localhost:3000/dashboard');
      const res = await updateSession(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/maintenance');
    });

    it('allows active platform staff to bypass maintenance mode on non-exempt routes', async () => {
      mockAdminClient.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { maintenance_mode: true },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: 'staff-user-1', email: 'admin@merchander.com' } },
        error: null,
      });
      (isActivePlatformStaff as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const req = new NextRequest('http://localhost:3000/dashboard');
      const res = await updateSession(req);

      // Staff is not redirected to /maintenance
      expect(res.headers.get('location')).toBeNull();
    });

    it('does not redirect exempt paths like /platform or /login during maintenance', async () => {
      mockAdminClient.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { maintenance_mode: true },
              error: null,
            }),
          }),
        }),
      });

      const loginReq = new NextRequest('http://localhost:3000/login');
      const loginRes = await updateSession(loginReq);
      expect(loginRes.headers.get('location')).toBeNull();

      const maintenanceReq = new NextRequest('http://localhost:3000/maintenance');
      const maintenanceRes = await updateSession(maintenanceReq);
      expect(maintenanceRes.headers.get('location')).toBeNull();
    });

    it('redirects authenticated platform staff visiting /login to /platform', async () => {
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: 'staff-user-1', email: 'admin@merchander.com' } },
        error: null,
      });
      (isActivePlatformStaff as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const loginReq = new NextRequest('http://localhost:3000/login');
      const res = await updateSession(loginReq);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/platform');
      expect(isActivePlatformStaff).toHaveBeenCalledWith(mockAdminClient, 'staff-user-1');
    });

    it('redirects authenticated merchant visiting /login to /dashboard', async () => {
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: 'merchant-user-1', email: 'merchant@store.com' } },
        error: null,
      });
      (isActivePlatformStaff as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const loginReq = new NextRequest('http://localhost:3000/login');
      const res = await updateSession(loginReq);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
      expect(isActivePlatformStaff).toHaveBeenCalledWith(mockAdminClient, 'merchant-user-1');
    });

    it('does not redirect if /login has an error query parameter', async () => {
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: 'merchant-user-1', email: 'merchant@store.com' } },
        error: null,
      });

      const loginReq = new NextRequest('http://localhost:3000/login?error=no-tenant');
      const res = await updateSession(loginReq);

      expect(res.headers.get('location')).toBeNull();
    });

    it('does not redirect if /login has a reset query parameter', async () => {
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: 'merchant-user-1', email: 'merchant@store.com' } },
        error: null,
      });

      const loginReq = new NextRequest('http://localhost:3000/login?reset=success');
      const res = await updateSession(loginReq);

      expect(res.headers.get('location')).toBeNull();
    });
  });
});

