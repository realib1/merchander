# Fix: Critical Security Hardening & Urgent User Bug Fixes (F-13 to F-20)

Type: Fix
Status: verified
Fixes: F-13, F-14, F-15, F-16, F-17, F-18, F-19, F-20

## The problem

A comprehensive audit of the backend, database, and frontend identified critical security exposures and broken user flows that directly impact production stability and merchant experience:

1. **Insecure Storefront Sessions RLS (F-13):** The `storefront_sessions` table initially granted full permissions with a `USING (true)` policy. While later migration revoked `anon`, the table lacked a hardened RLS policy and affirmative security posture.
2. **Mass Assignment Vulnerability in `updateProduct` (F-14):** `src/app/actions/products-mutations.ts` passes un-sanitized `Partial<Product>` directly into `supabase.from('products').update(updates)`. A malicious client could alter `tenant_id`, `id`, or other immutable columns, bypassing tenant boundaries.
3. **Plaintext Payment Provider Secret Keys (F-15):** Live Paystack secret keys and Hubtel client secrets configured in `src/app/actions/settings-commerce.ts` are stored in raw plaintext inside `tenant_settings.settings_data.payment_settings`, violating secret storage standards.
4. **Staff Invite Redirect Failure (F-16):** `inviteStaffMember` in `src/app/actions/staff.ts` omits the `redirectTo` parameter, causing Supabase Auth to route invited staff to default or staging Vercel domains rather than the configured application domain.
5. **Persistent Signout Loading Toast (F-17):** Signing out from `Sidebar.tsx` or `PlatformNav.tsx` creates a Sonner `toast.loading('Signing out...')` that is never dismissed before client-side `router.push()`, leaving a permanent stuck spinner on the screen.
6. **Unrendered Help Center Markdown (F-18):** Articles in `src/app/dashboard/help/components/HelpCenterView.tsx` contain rich markdown (headers, numbered lists, bullet points, inline code) but are output directly into a raw `<div>` with `whitespace-pre-line`, displaying raw syntax characters to merchants.
7. **Platform-Provisioned Merchant Name Fallback (F-19):** Platform provisioning stores the owner's name under `user_metadata.name`, but `getTenantStaff` in `src/app/actions/staff.ts` only looks for `user_metadata.full_name` and `first_name/last_name`, causing provisioned owners to always display as "Team Member".
8. **Dead "Continue with Google" Social Login (F-20):** `src/app/login/components/LoginForm.tsx` renders a non-functional Google login button with no `onClick` handler or OAuth workflow, creating user confusion.

## The fix

Execute a focused, high-priority fix package across 3 clean build steps:

1. **Step 1: Security Hardening (F-13, F-14, F-15)**
   - Add migration `20260913000000_secure_storefront_sessions.sql` ensuring strict RLS and revoking all unauthorized grants on `storefront_sessions`.
   - Update `src/app/actions/products-mutations.ts` with a strict Zod schema `ProductUpdateSchema` allowlisting only valid mutable fields (`name`, `description`, `category_id`, `availability_status`, `images`, `tags`), throwing on invalid input and preventing mass assignment.
   - Implement `src/utils/encryption.ts` using Node.js `crypto` with `AES-256-GCM` encryption/decryption, with comprehensive unit tests in `src/utils/encryption.test.ts`. Update `settings-commerce.ts` to encrypt provider secret keys before persisting to `settings_data`, decrypt keys in `payments-online.ts` for live transaction verification, and mask secret keys (`••••••••`) when returning settings to the client UI.

2. **Step 2: Auth, Invites & Merchant Display Fixes (F-16, F-17, F-19, F-20)**
   - Update `inviteStaffMember` in `src/app/actions/staff.ts` to pass `redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login``.
   - Update `handleLogout` in both `src/app/dashboard/components/Sidebar.tsx` and `src/app/platform/components/PlatformNav.tsx` to capture the toast ID and dismiss it (`toast.dismiss(toastId)`) before client routing.
   - Update name resolution in `src/app/actions/staff.ts` to check `meta.full_name || meta.name`, and update `provisionMerchantTenantAction` in `src/app/actions/platform.ts` to set both `name` and `full_name` in `user_metadata`.
   - Remove the dead "Continue with Google" button and its divider from `src/app/login/components/LoginForm.tsx`.

3. **Step 3: Help Center Markdown Rendering (F-18)**
   - Implement an accessible, lightweight, token-aware `src/components/ui/MarkdownRenderer.tsx` that transforms headings, lists, bold text, inline code, and paragraphs into styled HTML components without external runtime dependency bloat.
   - Add companion unit tests in `src/utils/markdown.test.ts` to satisfy the project testing gate for text parsing and transformation logic.
   - Update `src/app/dashboard/help/components/HelpCenterView.tsx` to render article content via `MarkdownRenderer`.

## Build steps

- [x] **Step 1 - Security Hardening (F-13, F-14, F-15)** - Apply storefront session RLS migration, add Zod schema validation to `updateProduct`, and implement AES-256-GCM secret key encryption at rest for payment provider credentials with test coverage in `src/utils/encryption.test.ts`. *Done when:* Mass assignment is blocked, payment secrets are encrypted in `settings_data` and masked in client payloads, encryption tests pass, and `yarn check` passes.
- [x] **Step 2 - Auth, Invites & Merchant Display Fixes (F-16, F-17, F-19, F-20)** - Fix staff invite `redirectTo`, dismiss signout loading toasts cleanly before routing, resolve owner names from `user_metadata.name`, and remove dead Google login button. *Done when:* Staff invite payload contains explicit redirect URL, signout toast is dismissed, provisioned owners show their actual name, Google button is removed, and `yarn check` passes.
- [x] **Step 3 - Help Center Markdown Rendering (F-18)** - Create `MarkdownRenderer` with unit tests in `src/utils/markdown.test.ts` and integrate it into `HelpCenterView.tsx`. *Done when:* Help guides render formatted headings, lists, and bold text instead of raw markdown syntax, all tests in `yarn test` pass, and `yarn lint` passes.

## Verify

- `yarn check` (`tsc --noEmit`) passes cleanly with no type errors.
- `yarn lint` (`eslint src`) passes with zero warnings or errors.
- `yarn test` passes all tests, including new encryption and markdown parsing tests.
- Verify that `updateProduct` rejects attempts to modify `tenant_id`.
- Verify that payment provider keys are encrypted before database write and masked upon read.
- Verify that staff invite email options specify the application domain.
- Verify that signing out dismisses the toast cleanly.
- Verify that Help Center guides display formatted headers, bulleted lists, and bold text.

## Findings

### security-hardening-and-urgent-bugs/F-13 [P0] closed - Storefront sessions table exposed to all anonymous users via permissive RLS

**File:** supabase/migrations/20260831150000_storefront_customer_identity.sql:94
**Found:** 2026-09-09 by /audit (scope: full; lens: security)
**Why it matters:** The `storefront_sessions` table initially granted ALL privileges to anon with `USING (true) WITH CHECK (true)`, exposing ephemeral carts and customer phones across all tenants. While a subsequent linter migration revoked anon access, the table lacks an affirmative, token-scoped RLS policy for anonymous cart sessions.
**Suggested fix:** Add migration `20260913000000_secure_storefront_sessions.sql` ensuring explicit, secure session isolation and revoking dangerous permissions.
**Resolution:** Fixed and verified on 2026-09-09 in fix/security-and-urgent-bugs. Added migration `20260913000000_secure_storefront_sessions.sql` revoking all access on `storefront_sessions` from anon, ensuring RLS is enabled, dropping any permissive policies, and strictly scoping tenant management to authenticated tenant users with service_role grants. Re-reviewed: table is secured and inaccessible to unauthenticated callers.

### security-hardening-and-urgent-bugs/F-14 [P0] closed - Mass assignment vulnerability in product updates allows arbitrary field mutation

**File:** src/app/actions/products-mutations.ts:25
**Found:** 2026-09-09 by /audit (scope: full; lens: security)
**Why it matters:** `updateProduct` accepts `updates: Partial<Product>` directly and forwards it to `supabase.from('products').update(updates)` without Zod schema filtering. A malicious payload can attempt to overwrite `tenant_id`, `id`, or other immutable columns.
**Suggested fix:** Define a Zod schema allowlisting only editable product fields (`name`, `description`, `category_id`, `availability_status`, `images`) and sanitize input prior to updating.
**Resolution:** Fixed and verified on 2026-09-09 in fix/security-and-urgent-bugs. Added `ProductUpdateSchema` with `.strict()` parsing in `src/app/actions/products-mutations.ts`, allowlisting only editable product fields (`name`, `description`, `category_id`, `availability_status`, `images`, `stock_unit`) and automatically timestamping `updated_at`. Any attempt to pass unauthorized properties (such as `tenant_id` or `id`) throws a Zod validation error. Re-reviewed: strict schema enforcement prevents mass-assignment.

### security-hardening-and-urgent-bugs/F-15 [P0] closed - Payment provider secret keys stored in plaintext in tenant_settings JSONB

**File:** src/app/actions/settings-commerce.ts:448
**Found:** 2026-09-09 by /audit (scope: full; lens: security)
**Why it matters:** Live Paystack and Hubtel API secret keys entered in settings are saved as raw plaintext inside `tenant_settings.settings_data.payment_settings`. Anyone with read access to the database or backups can extract live payment credentials.
**Suggested fix:** Encrypt sensitive API keys with AES-256-GCM before saving to `settings_data`, decrypt during server-side payment execution, and mask keys before sending to the client UI.
**Resolution:** Fixed and verified on 2026-09-09 in fix/security-and-urgent-bugs. Created `src/utils/encryption.ts` implementing authenticated AES-256-GCM symmetric encryption, decryption, and masking. Updated `src/app/actions/settings-commerce.ts` to encrypt provider secrets prior to storage in `settings_data` (preserving existing secrets when submitted masked), and mask secrets on retrieval. Updated `src/app/actions/payments-online.ts` to decrypt secrets server-side when invoking Paystack/Hubtel payment APIs. Added 6 unit tests in `src/utils/encryption.test.ts`. Re-reviewed: keys are encrypted at rest and masked in UI.

### security-hardening-and-urgent-bugs/F-16 [P1] closed - Staff invites redirect to unconfigured default Vercel domain instead of APP_URL

**File:** src/app/actions/staff.ts:113
**Found:** 2026-09-09 by /audit (scope: full; lens: quality)
**Why it matters:** `supabaseAdmin.auth.admin.inviteUserByEmail` omits the `redirectTo` parameter, causing Supabase to redirect invitees to its default project site URL (often a stale or staging Vercel domain) rather than the active application URL.
**Suggested fix:** Pass `redirectTo: \`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login\`` in invite options.
**Resolution:** Fixed and verified on 2026-09-09 in fix/security-and-urgent-bugs. Added explicit `redirectTo: \`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login\`` parameter to `inviteUserByEmail` options in `src/app/actions/staff.ts`. Re-reviewed: invites target the configured app URL.

### security-hardening-and-urgent-bugs/F-17 [P1] closed - Signout Sonner loading toast persists indefinitely across client-side redirects

**File:** src/app/dashboard/components/Sidebar.tsx:42
**Found:** 2026-09-09 by /audit (scope: full; lens: quality)
**Why it matters:** Calling `toast.loading('Signing out...')` without dismissing it leaves a permanent spinner toast on the screen after client-side `router.push('/login')`, requiring a hard page reload to clear.
**Suggested fix:** Dismiss the toast using its ID or `toast.dismiss()` prior to router navigation.
**Resolution:** Fixed and verified on 2026-09-09 in fix/security-and-urgent-bugs. Captured toast ID returned by `toast.loading()` and explicitly dismissed it with `toast.dismiss(toastId)` before triggering client routing in both `src/app/dashboard/components/Sidebar.tsx` and `src/app/platform/components/PlatformNav.tsx`. Re-reviewed: toast dismisses cleanly.

### security-hardening-and-urgent-bugs/F-18 [P1] closed - Help center articles render raw markdown instead of rich formatted guides

**File:** src/app/dashboard/help/components/HelpCenterView.tsx:113
**Found:** 2026-09-09 by /audit (scope: full; lens: quality)
**Why it matters:** Help center article bodies contain Markdown (`###`, `**`, bullet lists, code spans) but are rendered in a raw `<div>` with `whitespace-pre-line`, displaying unparsed syntax characters to merchants.
**Suggested fix:** Implement a structured Markdown renderer that transforms guide headings, lists, bold text, and code blocks into accessible, styled elements.
**Resolution:** Fixed and verified on 2026-09-09 in fix/security-and-urgent-bugs. Implemented a zero-dependency, accessible, token-aware `MarkdownRenderer` component in `src/components/ui/MarkdownRenderer.tsx` and modular block/inline markdown parser in `src/utils/markdown.ts` with full unit test coverage in `src/utils/markdown.test.ts`. Integrated `MarkdownRenderer` into `src/app/dashboard/help/components/HelpCenterView.tsx` so headings, lists, inline code, and bold text render cleanly with design system styles. Re-reviewed: guides display rich formatted typography.

### security-hardening-and-urgent-bugs/F-19 [P2] closed - Provisioned platform merchants default to generic 'Team Member' name

**File:** src/app/actions/staff.ts:51
**Found:** 2026-09-09 by /audit (scope: full; lens: quality)
**Why it matters:** Platform provisioning writes `user_metadata.name`, but staff resolution only checks `meta.full_name` and `meta.first_name/last_name`, causing newly provisioned merchant owners to display as "Team Member".
**Suggested fix:** Check `meta.full_name || meta.name` during staff listing and ensure provisioning populates both keys.
**Resolution:** Fixed and verified on 2026-09-09 in fix/security-and-urgent-bugs. Updated `getTenantStaff` in `src/app/actions/staff.ts` to check `meta.full_name || meta.name`, and updated `provisionMerchantTenantAction` in `src/app/actions/platform.ts` to populate both `name` and `full_name` in `user_metadata`. Re-reviewed: owner name displays correctly.

### security-hardening-and-urgent-bugs/F-20 [P2] closed - Dead non-functional 'Continue with Google' button on login form

**File:** src/app/login/components/LoginForm.tsx:67
**Found:** 2026-09-09 by /audit (scope: full; lens: quality)
**Why it matters:** The login page displays a "Continue with Google" social button with no `onClick` handler or OAuth implementation, misleading users.
**Suggested fix:** Remove the dummy button and divider from the login form.
**Resolution:** Fixed and verified on 2026-09-09 in fix/security-and-urgent-bugs. Removed the non-functional "Continue with Google" social login button and the surrounding "or sign in with email" divider from `src/app/login/components/LoginForm.tsx`. Re-reviewed: clean login form with functional email/password entry.
