import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { isActivePlatformStaff } from '@/lib/auth/platform-staff';

interface MaintenanceCache {
  active: boolean;
  timestamp: number;
}

let maintenanceCache: MaintenanceCache | null = null;
const MAINTENANCE_CACHE_TTL_MS = 5000;

let testServiceClient: ReturnType<typeof createClient> | null = null;

export function clearMaintenanceCache(): void {
  maintenanceCache = null;
}

export function setServiceRoleClientForTesting(client: ReturnType<typeof createClient> | null): void {
  testServiceClient = client;
}

function getServiceRoleClient() {
  if (testServiceClient) return testServiceClient;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function isMaintenanceModeActive(forceRefresh: boolean = false): Promise<boolean> {
  const now = Date.now();
  if (!forceRefresh && maintenanceCache && now - maintenanceCache.timestamp < MAINTENANCE_CACHE_TTL_MS) {
    return maintenanceCache.active;
  }

  try {
    const admin = getServiceRoleClient();
    if (!admin) {
      return maintenanceCache ? maintenanceCache.active : false;
    }

    const { data, error } = await admin
      .from('platform_settings')
      .select('maintenance_mode')
      .eq('id', 1)
      .maybeSingle();

    if (!error && data) {
      maintenanceCache = {
        active: data.maintenance_mode === true,
        timestamp: now,
      };
      return maintenanceCache.active;
    }
  } catch (err) {
    console.error('Error checking maintenance mode in proxy:', err);
  }

  return maintenanceCache ? maintenanceCache.active : false;
}

export function isMaintenanceExemptPath(pathname: string): boolean {
  return (
    pathname === '/maintenance' ||
    pathname.startsWith('/platform') ||
    pathname === '/login' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/health')
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
          },
        },
      }
    );

    // Refresh the auth token safely
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Maintenance Mode Enforcement:
    // If maintenance mode is active, only active platform staff can access non-exempt paths.
    // All other requests are redirected to /maintenance.
    if (!isMaintenanceExemptPath(pathname)) {
      const maintenanceActive = await isMaintenanceModeActive();
      if (maintenanceActive) {
        const isStaff = user ? await isActivePlatformStaff(supabase, user.id) : false;
        if (!isStaff) {
          const url = request.nextUrl.clone();
          url.pathname = '/maintenance';
          const redirectResponse = NextResponse.redirect(url);
          supabaseResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
          return redirectResponse;
        }
      }
    }

    const isProtectedPath =
      pathname.startsWith('/dashboard') || pathname.startsWith('/platform');

    // Route protection: redirect to /login if unauthenticated and accessing protected routes
    if (!user && isProtectedPath) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
      return redirectResponse;
    }

    // 2FA Enforcement: If user is authenticated at AAL1 but requires AAL2, redirect to /login
    if (user && isProtectedPath) {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData && aalData.currentLevel === 'aal1' && aalData.nextLevel === 'aal2') {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('mfa', 'required');
        const redirectResponse = NextResponse.redirect(url);
        supabaseResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
        return redirectResponse;
      }
    }

    // If fully authenticated user visits /login via direct GET navigation without error parameters, redirect to appropriate portal
    const isServerAction = request.headers.has('next-action');
    const hasLoginError = request.nextUrl.searchParams.has('error');
    if (user && pathname === '/login' && request.method === 'GET' && !isServerAction && !hasLoginError) {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const needsMfa = aalData && aalData.currentLevel === 'aal1' && aalData.nextLevel === 'aal2';
      if (!needsMfa) {
        const isStaff = await isActivePlatformStaff(supabase, user.id);
        const maintenanceActive = await isMaintenanceModeActive();
        let destination = isStaff ? '/platform' : '/dashboard';
        if (!isStaff && maintenanceActive) {
          destination = '/maintenance';
        }
        const url = request.nextUrl.clone();
        url.pathname = destination;
        const redirectResponse = NextResponse.redirect(url);
        supabaseResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
        return redirectResponse;
      }
    }
  } catch (err) {
    console.error('Session update error in proxy:', err);
  }

  return supabaseResponse;
}

