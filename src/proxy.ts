import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID;

  if (
    process.env.VERCEL_SKEW_PROTECTION_ENABLED === '1' &&
    deploymentId &&
    !request.cookies.has('__vdpl')
  ) {
    response.cookies.set('__vdpl', deploymentId, {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
