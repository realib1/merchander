import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isActivePlatformStaff } from '@/lib/auth/platform-staff';

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

    const isProtectedPath =
      request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/platform');

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
    if (user && request.nextUrl.pathname === '/login' && request.method === 'GET' && !isServerAction && !hasLoginError) {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const needsMfa = aalData && aalData.currentLevel === 'aal1' && aalData.nextLevel === 'aal2';
      if (!needsMfa) {
        const destination = (await isActivePlatformStaff(supabase, user.id)) ? '/platform' : '/dashboard';
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
