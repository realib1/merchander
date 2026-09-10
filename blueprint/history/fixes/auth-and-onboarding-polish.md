# Fix: Auth & Onboarding Polish (Issues 1, 8, 9, 10)

## Overview
- **Type:** Fix
- **Status:** verified
- **Scope:** Auth, Staff Invitations, Logout UX, and Merchant Owner Identity
- **Completed:** 2026-09-10

## The Problem
1. **Issue 1 (Signout Toast Stuck):** Clicking "Sign Out" in `Sidebar.tsx` or `PlatformNav.tsx` creates a persistent `toast.loading('Signing out...')` that remains on screen indefinitely after client-side redirect (`router.push`) to the landing or login page, requiring a manual page refresh.
2. **Issue 8 (Staff Invites Redirect to Vercel):** When inviting staff in `src/app/actions/staff.ts`, `supabaseAdmin.auth.admin.inviteUserByEmail` previously defaulted or linked to `${appUrl}/login`, which does not exchange the auth code for a session, leaving users unauthenticated with raw URL parameters.
3. **Issue 9 (Google Button):** Confirmed already cleaned up and removed from `LoginForm.tsx` to prevent non-functional clicks.
4. **Issue 10 (Owner Defaults to "Team Member"):** During self-service signup (`signup.ts`) and administrative provisioning (`platform.ts`), `user_metadata` was assigned `name` without `full_name`. Consequently, display resolvers checking `meta.full_name` fell back to `'Team Member'`. In `staff.ts`, `getStaffMembers` also lacked an intelligent email prefix fallback.

## The Fix
1. **Logout Clean Navigation & Toast Dismissal:**
   - In `Sidebar.tsx` and `PlatformNav.tsx`, dismiss all toasts (`toast.dismiss()`), navigate via `router.replace('/login')`, and refresh client cache with `router.refresh()` upon signout. This flushes client caches, unloads persistent Sonner toast instances, and ensures a clean authentication check.
2. **Staff Invite Callback Routing:**
   - In `src/app/actions/staff.ts`, configure `redirectTo: \`${appUrl}/auth/callback?next=/dashboard\`` in `inviteUserByEmail` so invited staff are routed through the session-exchange callback.
3. **Dual Name Metadata & Intelligent Fallback:**
   - In `src/app/actions/signup.ts`, include both `full_name` and `name` in `user_metadata` for `createUser`.
   - In `src/app/actions/platform.ts`, include both `full_name` and `name` in `user_metadata` for `provisionMerchantTenantAction`.
   - In `src/app/actions/staff.ts`, expand display name resolution to check `meta.full_name || meta.name`, first/last names, and fall back to email username before falling back to `'Team Member'`.
4. **Unit Tests:**
   - Added unit test coverage in `src/app/actions/staff.test.ts` and updated `src/app/actions/signup.test.ts` asserting metadata naming and invite redirect parameters.

## Build Steps
- [x] **Step 1: Fix Signout UX, Staff Invite Redirect, and Owner Metadata**
- Modify `src/app/dashboard/components/Sidebar.tsx` and `src/app/platform/components/PlatformNav.tsx` for clean toast dismissal and logout redirect.
- Update `src/app/actions/staff.ts` to redirect invites to `/auth/callback?next=/dashboard` and resolve display names with email prefix fallback.
- Update `src/app/actions/signup.ts` and `src/app/actions/platform.ts` to persist both `full_name` and `name` in `user_metadata`.
- Add test suites in `src/app/actions/staff.test.ts` and update `src/app/actions/signup.test.ts`.
- **Done when:** `yarn test` passes all tests (including new staff tests), `yarn check` and `yarn lint` report 0 errors, and signing out flushes all toasts cleanly.

## Verify
- `yarn test`: 66/66 test files passed, 592/592 unit tests passing.
- `yarn check`: TypeScript typecheck completed with 0 errors.
- `yarn lint`: ESLint completed with 0 errors and 0 warnings.
- `yarn build`: Production build compiled all 58 routes successfully.
