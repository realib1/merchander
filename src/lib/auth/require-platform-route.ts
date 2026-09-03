import 'server-only';
import { redirect } from 'next/navigation';
import { verifyPlatformStaff } from '@/app/actions/platform';
import { PLATFORM_RBAC_RULES } from './platform-staff';

/**
 * Route-level RBAC guard for a `/platform` page component.
 *
 * `platform/layout.tsx` only checks that the caller is active platform staff;
 * per-route role enforcement otherwise lives only in `PlatformNav` link
 * visibility and in each page's data action. Call this at the top of a page so
 * a role outside `PLATFORM_RBAC_RULES[route]` is redirected to `/platform`
 * instead of reaching the page. Returns `{ user, role }` for the page to reuse.
 */
export async function requirePlatformRoute(route: keyof typeof PLATFORM_RBAC_RULES) {
  const allowed = PLATFORM_RBAC_RULES[route];
  if (!allowed) {
    // Unknown route key: fail closed rather than degrade to "any active staff".
    redirect('/platform');
  }

  try {
    return await verifyPlatformStaff(allowed);
  } catch {
    redirect('/platform');
  }
}
