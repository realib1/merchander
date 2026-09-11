# Fix: Prevent /login?error=no-tenant on User Sign Out

**Type:** Fix  
**Status:** completed  

## The Problem
When logging out from the application (via the Topbar dropdown, Sidebar, or Platform navigation), users were redirected to `/login?error=no-tenant` displaying the error:
> *"No merchant store is linked to this account. Please sign in with your merchant credentials or contact support."*

This was caused by three compounding defects:
1. **Unprivileged Platform Staff Checks in Proxy & Dashboard Layout**:
   - `src/lib/supabase/proxy.ts` (lines 119, 162) and `src/app/dashboard/layout.tsx` (line 22) queried `platform_staff_users` using the unauthenticated/anon Supabase client.
   - Because RLS on `platform_staff_users` restricts access to service role or staff auth contexts, `isActivePlatformStaff` evaluated to `false`.
   - As a result, staff users visiting `/login` or `/dashboard` were falsely routed to `/dashboard`, failed the `tenant_users` query (staff have no merchant stores), and were redirected to `/login?error=no-tenant`.
2. **Missing Cookie Deletion in `/auth/signout` Route**:
   - `src/app/auth/signout/route.ts` created a fresh `NextResponse.redirect` without explicitly deleting incoming Supabase session cookies (`sb-*-auth-token`, etc.). The browser followed the redirect to `/login` with active session cookies attached.
3. **Soft Navigation and `router.refresh()` in Client Signout Handlers**:
   - `Sidebar.tsx` and `PlatformNav.tsx` executed `router.replace('/login'); router.refresh();`, causing Next.js to re-request the current protected route's server components with in-memory session cookies before redirect completed.

## The Fix
1. **Elevate Staff Checks in Proxy & Dashboard Layout**:
   - In `src/lib/supabase/proxy.ts`, passed `getServiceRoleClient() || supabase` into `isActivePlatformStaff`.
   - In `src/app/dashboard/layout.tsx`, verified platform staff status using `createAdminClient()` (falling back safely to `supabase` if service key is unavailable).
2. **Purge Cookies in `/auth/signout`**:
   - Explicitly cleared all auth cookies (`sb-*`, `auth-token`) on the `NextResponse.redirect` response in both `POST` and `GET` handlers with `path: '/'`, `maxAge: 0`, and `expires: new Date(0)`.
3. **Clean Hard Navigation on Client Logout**:
   - In `Sidebar.tsx` and `PlatformNav.tsx`, replaced `router.replace('/login'); router.refresh();` with `window.location.replace('/login');`.
   - In `UserProfileDropdown.tsx`, added an `onSubmit` handler to sign out via client Supabase client and perform `window.location.replace('/login')`.
4. **Preserve Isolation and Stability**:
   - Never bypassed RLS for tenant-owned tables; only used admin/service-role for global platform staff role checks.
   - Maintained 100% passing tests in `yarn test` (81 files, 719 tests) and clean `yarn check`.

## Build Steps
- [x] **Step 1: Update Proxy, Dashboard Layout, Signout Route, and Client Navigation**:
  - Update `src/lib/supabase/proxy.ts` to check platform staff with `getServiceRoleClient() || supabase`.
  - Update `src/app/dashboard/layout.tsx` to check platform staff with `createAdminClient()`.
  - Update `src/app/auth/signout/route.ts` to explicitly clear auth cookies on redirect.
  - Update `Sidebar.tsx`, `PlatformNav.tsx`, and `UserProfileDropdown.tsx` to use full page navigation (`window.location.replace('/login')`).
  - Add tests in `src/app/auth/signout/route.test.ts` and `src/lib/supabase/proxy.test.ts`.
  - _Done when:_ `yarn check`, `yarn lint`, and `yarn test` pass cleanly with zero regressions.

## Verification
- `yarn check`: passed with 0 errors.
- `yarn lint`: passed with 0 errors and 0 warnings.
- `yarn test`: 81 files passed, 719 tests passed.
