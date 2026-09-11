# Feature 31a: Password Recovery & Reset Flow

**From build-plan:** 31a
**Branch:** feature/auth-password-recovery
**Status:** completed
**Completed Date:** 2026-09-11

## Goal

Provide a complete, secure self-service password recovery flow for Merchander users. Replace the placeholder `#` "Forgot password?" link on `/login` with an end-to-end recovery pipeline:
1. `/forgot-password` request page where users can submit their email.
2. `requestPasswordReset` server action calling Supabase `resetPasswordForEmail` with anti-enumeration response messaging.
3. Recovery auth callback exchange via `/auth/callback?next=/reset-password`.
4. Dedicated `/reset-password` page with session verification, password confirmation, real-time match validation, and fallback for expired or invalid tokens.
5. `updateUserPassword` server action that updates the user credentials in Supabase Auth, flushes the temporary recovery session, and routes to `/login?reset=success` with an accessible confirmation banner.

## What Changed

1. **Server Actions (`src/app/actions/auth.ts`)**:
   - `requestPasswordReset`: extracts and trims email, validates format, constructs dynamic origin redirect URL (`/auth/callback?next=/reset-password`), and calls `supabase.auth.resetPasswordForEmail`. Returns uniform success message to protect against user enumeration, and handles rate limiting (429).
   - `updateUserPassword`: validates password length (>= 8 characters) and strict confirmation match, verifies active session with `supabase.auth.getUser()`, updates credentials via `supabase.auth.updateUser`, cleanly terminates the recovery session via `supabase.auth.signOut()`, and redirects to `/login?reset=success`.
2. **Forgot Password Route (`src/app/forgot-password/`)**:
   - `page.tsx`: split layout with desktop hero photography matching Merchander auth design tokens (`font-display`, `brand-primary`, `bg-background`).
   - `ForgotPasswordForm.tsx`: accessible email input with icon, pending state, error banner, and "Check your inbox" confirmation card.
3. **Login Wire-up & Success Feedback**:
   - `src/app/login/components/LoginForm.tsx`: updated placeholder `#` "Forgot password?" link to point to `/forgot-password`.
   - `src/app/login/page.tsx`: added emerald success confirmation banner when `reset=success`.
   - `src/lib/supabase/proxy.ts`: updated session proxy to allow viewing `/login?reset=success` without redirect loop.
4. **Reset Password Route (`src/app/reset-password/`)**:
   - `page.tsx`: verifies user session via Supabase; renders an "Invalid or Expired Link" fallback with quick link back to `/forgot-password` if accessed without an active recovery session.
   - `ResetPasswordForm.tsx`: new password and confirm password inputs, show/hide eye toggles, real-time live validation checklist (>= 8 chars, match), and loading state.
5. **Automated Tests**:
   - `src/app/actions/auth.test.ts`: 8 unit tests verifying password reset request, rate limits, anti-enumeration copy, validation rules, session expiration, and redirect behavior.
   - `src/lib/supabase/proxy.test.ts`: unit test verifying `?reset=success` prevents premature redirects on `/login`.

## Verification

- `yarn check`: TypeScript typecheck passed with 0 errors.
- `yarn lint`: ESLint passed with 0 errors and 0 warnings.
- `yarn test`: 82 test files passed, 728/728 tests green.
- `yarn build`: Turbopack production build compiled cleanly, all 62 static and dynamic routes generated.
