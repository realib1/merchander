# Platform control-plane authorization + seed hardening

**Type:** Fix

**Status:** verified

**Completed:** 2026-09-02

**Landed in:** the combined `feat(platform)` work commit (the superadmin -> platform
console rebuild and this hardening were interwoven in the same uncommitted files
and shipped as one unit).

**Fixes:** F-01, F-02, F-03, F-05, F-06, F-07, F-09, F-11, F-12

## The problem

The `superadmin` -> `platform` rebuild landed a set of `'use server'` actions and
seed migrations that skip the authorization boundary the rest of the platform code
already enforces with `verifyPlatformStaff()`.

| Finding | Where | Risk |
|---|---|---|
| F-02 (P0) | `src/app/actions/platform-support.ts` - `getPlatformSupportTicketsAction`, `updateSupportTicketStatusAction` | No auth check + service-role client. Any caller reads every tenant's support tickets (emails, message bodies, internal notes) and tampers with any ticket. |
| F-12 (P0) | `src/app/actions/support.ts` - `getPlatformSupportInbox`, `updatePlatformTicket` | Same class as F-02, different file. `getAdminOrUserClient()` returns service role. |
| F-03 (P1) | `src/app/actions/platform-comms.ts` - `getPlatformBroadcastsAction`, `createPlatformBroadcastAction`, `toggleBroadcastStatusAction` | No auth check. Any authenticated user can publish or toggle a platform-wide dashboard announcement (phishing via `action_url`), or read draft announcements. |
| F-07 (P3) | `src/app/actions/platform.ts` - `getPlatformPlansAction` | Alone among its siblings, no `verifyPlatformStaff()`; leaks inactive plans + entitlements. |
| F-05 (P2) | `src/app/actions/platform-audit.ts` - `logPlatformAuditAction` | Exported `'use server'` writer gated only by "is logged in"; caller controls every field, so the "immutable" audit trail can be poisoned. |
| F-06 (P2) | `auth.ts`, `dashboard/layout.tsx`, `lib/supabase/proxy.ts`, `platform/layout.tsx`, `platform.ts` | The active-platform-staff lookup is reimplemented five times with inconsistent `is_active` handling. |
| F-09 (P3) | `supabase/migrations/20260901120000_create_support_access_grants.sql` + `support-grant.ts` | RLS `FOR ALL` lets any tenant member write grant rows (bypasses the app owner/admin check); `verifyActiveSupportGrant` is an ungated action that returns the raw grant `token`. |
| F-01 (P0) | `supabase/migrations/20260901090000_seed_superadmin_user.sql`, `20260902070000_seed_platform_staff_and_merchants.sql` | Migrations insert `auth.users` rows with hardcoded passwords (`admin@merchander.com` / `admin123` as `platform_owner`; `merchant123`). `20260901090000` is **already applied to the linked remote**; `20260902070000` is **not yet applied**. |
| F-11 (P3) | same seed migrations | Overlapping admin seeds with conflicting metadata; a stale `"is_superadmin": true` JWT claim re-added after the bypass function was purged. |

## The fix

Bring every platform server action behind the existing `verifyPlatformStaff()`
gate, collapse the duplicated staff lookup into one helper, take the audit-log
writer off the public action surface, harden the support-grant RLS and token
handling, and stop seeding auth users / passwords from migrations.

Constraints - must not break:

- `verifyPlatformStaff()` is defined in `src/app/actions/platform.ts`; keep it the
  single source of role logic. The new low-level helper is the boolean check it
  and the layouts/middleware share, not a replacement for it.
- `lib/supabase/proxy.ts` runs in Next middleware (edge runtime). The shared
  helper must be a plain Supabase query with no Node-only imports.
- `logPlatformAuditAction` has legitimate non-staff callers (`support-grant.ts`
  and `auth.ts` log events for merchants), so it must **not** itself require
  platform staff. The fix is to remove it from the callable action surface, not
  to gate it.
- The `/platform` area must remain reachable: platform staff are identified by a
  row in `platform_staff_users`. Seeding that row is fine; creating the auth user
  and its password in a migration is not.
- Do not edit `20260901090000_*` or `20260901100000_*` (already applied to the
  remote). Only `20260901120000` onward are unapplied and safe to edit; anything
  affecting already-applied state goes in a new forward migration.
- Keep the `{ success, data/error }` return shape and existing `revalidatePath`
  calls in every touched action.

Out of scope for this fix (needs a user decision, tracked separately):

- Rotating or deleting the live `admin@merchander.com` account that
  `20260901090000` already created on the remote project. Recorded as a manual
  follow-up; not performed.

## Build steps

- [x] **1. Shared platform-staff helper (F-06).** `src/lib/auth/platform-staff.ts`
  exports `getPlatformStaffRecord(client, userId)` and
  `isActivePlatformStaff(client, userId)` (active = `is_active === true`). The
  inline copies in `auth.ts`, `dashboard/layout.tsx`, `lib/supabase/proxy.ts`,
  `platform/layout.tsx`, and `verifyPlatformStaff` in `platform.ts` delegate to
  it. `rg platform_staff_users src/` shows the table queried only in the helper,
  the `platform-staff.ts` CRUD actions, and the `platform-audit.ts` role lookup.
- [x] **2. Gate the support-inbox actions (F-02, F-12).**
  `verifyPlatformStaff(SUPPORT_INBOX_ROLES)` is the first `try` statement in
  `getPlatformSupportTicketsAction` / `updateSupportTicketStatusAction`
  (`platform-support.ts`) and `getPlatformSupportInbox` / `updatePlatformTicket`
  (`support.ts`); admin client created after the guard.
- [x] **3. Gate the broadcast actions (F-03) and plans reader (F-07).** All three
  `platform-comms.ts` actions call `verifyPlatformStaff(BROADCAST_ROLES)` first
  (`createPlatformBroadcastAction` takes `user` from the result);
  `getPlatformPlansAction` calls `verifyPlatformStaff()`.
- [x] **3b. Regression check.** Matrix: every exported action in
  `platform*.ts` / `support-grant.ts` either calls `verifyPlatformStaff` or is a
  merchant/self action scoped by `auth.getUser()` + `tenant_users`. No additional
  guards were needed beyond steps 4 and 5.
- [x] **4. Take the audit-log writer off the action surface (F-05).** `'use
  server'` removed from `platform-audit.ts` with an explanatory header; the module
  is now internal (`logPlatformAuditAction`) plus a guarded reader
  (`getPlatformAuditLogsAction`). `import 'server-only'` was NOT added (package not
  a dependency) - tracked as F-13.
- [x] **5. Harden support-access grants (F-09).** New migration
  `20260902200000_harden_support_grant_rls.sql` splits the RLS: member `FOR
  SELECT`, owner/admin `FOR ALL` (USING + WITH CHECK), platform-staff SELECT
  preserved. `verifyActiveSupportGrant` calls `verifyPlatformStaff([...])` first
  and no longer returns `token`; `getMerchantContextAction`'s `activeGrant` drops
  `token`; `SupportAccessGrant.token` is now optional.
- [x] **6. Stop seeding auth users and passwords from migrations (F-01, F-11).**
  `20260901090000_*` and `20260902070000_*` gutted to `SELECT 1;` no-ops (kept,
  not deleted, so remote/local migration history stays aligned). Demo credentials
  moved to `supabase/seed.sql` (local `db reset` only), which seeds
  `admin@merchander.com` / `admin123` (no `is_superadmin` claim) plus its
  `platform_staff_users` row.
  **Manual follow-up (not performed):** in the Supabase dashboard for project
  `jzwrfeclfnzxwmodwlfs`, rotate or remove the `admin@merchander.com` account the
  already-applied `20260901090000` created, and clear its `is_superadmin`
  app_metadata.

## Verify (evidence at completion)

- `npx tsc --noEmit` - pass
- `npx eslint src` - pass
- `npx vitest run` - 170 pass (24 files)
- `npx next build` - compiled successfully
- `npx supabase db reset --local` - all migrations + `seed.sql` apply clean; local
  DB shows exactly the three intended grant RLS policies and one `platform_owner`
  staff row with an empty `is_superadmin` claim
- `rg "crypt\(|gen_salt\(|encrypted_password" supabase/migrations/` - no matches

Manual paths (defense-in-depth; the `/platform` layout already blocks non-staff):
sign in as the dev merchant and confirm the newly gated actions return the
Forbidden shape; sign in as the dev platform admin and confirm every `/platform/*`
page still loads; as a non-owner tenant member, a direct anon-client insert into
`platform_support_access_grants` is denied by RLS.

## Findings

### platform-authorization-seed-hardening/F-01 [P0] closed - Seed migrations create auth users with hardcoded passwords

**File:** supabase/migrations/20260902070000_seed_platform_staff_and_merchants.sql:33
**Found:** 2026-09-02 by /audit (scope: changed; lens: security)
**Why it matters:** Two migrations inserted `auth.users` rows with bcrypt hashes of
hardcoded passwords (`admin@merchander.com` / `admin123` as `platform_owner`;
`merchant123`), shipping a publicly known credential for the highest-privilege
account to every environment the migration runs in. `20260901090000` was already
applied to the linked remote.
**Resolution:** Both migrations gutted to `SELECT 1;` no-ops with explanatory
headers. Demo credentials moved to `supabase/seed.sql` (local `db reset` only),
which seeds `admin@merchander.com` / `admin123` plus its `platform_staff_users`
row. `rg` for credential functions over `supabase/migrations/` returns nothing;
`supabase db reset --local` applies cleanly. Re-reviewed 2026-09-02 by /audit
(scope: current) and closed. Remote-account rotation remains a manual action
outside code review.

### platform-authorization-seed-hardening/F-02 [P0] closed - Platform support-inbox server actions have no authorization

**File:** src/app/actions/platform-support.ts:14
**Found:** 2026-09-02 by /audit (scope: changed; lens: security)
**Why it matters:** `getPlatformSupportTicketsAction` and
`updateSupportTicketStatusAction` (imported by a client component) had no auth
check and used the service-role client, so any caller could read every tenant's
support tickets and internal notes and rewrite any ticket.
**Resolution:** `verifyPlatformStaff(SUPPORT_INBOX_ROLES)` is now the first `try`
statement in both, before the admin client is created; the thrown Forbidden
propagates into the existing `catch`. Re-reviewed 2026-09-02 by /audit (scope:
current) and closed.

### platform-authorization-seed-hardening/F-03 [P1] closed - Platform broadcast server actions have no authorization

**File:** src/app/actions/platform-comms.ts:14
**Found:** 2026-09-02 by /audit (scope: changed; lens: security)
**Why it matters:** `getPlatformBroadcastsAction`, `createPlatformBroadcastAction`,
and `toggleBroadcastStatusAction` had no staff check and used the service-role
client, so any authenticated user could publish or toggle a platform-wide
dashboard announcement (phishing vector via `action_url`) or read drafts.
**Resolution:** All three call `verifyPlatformStaff(BROADCAST_ROLES)` first;
`createPlatformBroadcastAction` takes `user` from that result; unused `createClient`
import removed. Re-reviewed 2026-09-02 by /audit (scope: current) and closed.

### platform-authorization-seed-hardening/F-05 [P2] closed - Audit-log writer is an unauthenticated-role server action

**File:** src/app/actions/platform-audit.ts:13
**Found:** 2026-09-02 by /audit (scope: changed; lens: security)
**Why it matters:** `logPlatformAuditAction` was exported from a `'use server'`
file gated only by "is logged in", with all fields caller-controlled, so any
authenticated user could inject rows into the "immutable" `platform_audit_logs`.
**Resolution:** `'use server'` removed, so `logPlatformAuditAction` is no longer a
callable endpoint - it is an internal helper for the other server actions (which
have legitimate merchant callers). `getPlatformAuditLogsAction` keeps its
`verifyPlatformStaff` guard. `next build` green; no client module imports the file.
Re-reviewed 2026-09-02 by /audit (scope: current) and closed. Residual hardening
(`import 'server-only'`) tracked as F-13 in the live ledger.

### platform-authorization-seed-hardening/F-06 [P2] closed - Platform-staff lookup duplicated across five modules

**File:** src/app/actions/auth.ts:11
**Found:** 2026-09-02 by /audit (scope: changed; lens: quality)
**Why it matters:** The active-staff query was reimplemented in five modules with
inconsistent `is_active` handling; divergence is an authorization bug.
**Resolution:** New `src/lib/auth/platform-staff.ts`
(`getPlatformStaffRecord` / `isActivePlatformStaff`, active = `is_active === true`);
all five call sites delegate. Type-only imports keep it edge-safe for `proxy.ts`.
Behavior equivalent to the old inline checks for the NOT-NULL column. Re-reviewed
2026-09-02 by /audit (scope: current) and closed.

### platform-authorization-seed-hardening/F-07 [P3] closed - getPlatformPlansAction skips staff verification

**File:** src/app/actions/platform.ts:509
**Found:** 2026-09-02 by /audit (scope: changed; lens: security)
**Why it matters:** Alone among its siblings, `getPlatformPlansAction` used the
admin client with no `verifyPlatformStaff()` call, exposing inactive plans and
full entitlements to any caller.
**Resolution:** `await verifyPlatformStaff()` added as the first `try` statement.
Re-reviewed 2026-09-02 by /audit (scope: current) and closed.

### platform-authorization-seed-hardening/F-09 [P3] closed - Support-access grants writable by any tenant member, token unenforced

**File:** supabase/migrations/20260901120000_create_support_access_grants.sql:25
**Found:** 2026-09-02 by /audit (scope: changed; lens: security)
**Why it matters:** The `FOR ALL` member policy let any tenant member write grant
rows directly via the anon client, bypassing the app owner/admin check;
`verifyActiveSupportGrant` was an ungated action returning the raw grant `token`.
**Resolution:** New migration `20260902200000_harden_support_grant_rls.sql` splits
the policy into member `FOR SELECT` and owner/admin `FOR ALL` (USING + WITH CHECK),
platform-staff SELECT preserved. `verifyActiveSupportGrant` calls
`verifyPlatformStaff([...])` first and no longer returns `token`;
`getMerchantContextAction`'s `activeGrant` drops `token`; `SupportAccessGrant.token`
is now optional. Verified against the local DB. Re-reviewed 2026-09-02 by /audit
(scope: current) and closed.

### platform-authorization-seed-hardening/F-11 [P3] closed - Overlapping admin seeds and a stale is_superadmin claim

**File:** supabase/migrations/20260901090000_seed_superadmin_user.sql:1
**Found:** 2026-09-02 by /audit (scope: changed; lens: quality)
**Why it matters:** Two seed migrations seeded the same admin UUID with conflicting
metadata; the later one re-added `"is_superadmin": true` to the JWT app_metadata
after the bypass function had been purged, leaving a dead privilege flag.
**Resolution:** Both seed migrations are no-ops (see F-01). `supabase/seed.sql` is
the single demo admin seed - `admin@merchander.com` with `role: platform_owner`
metadata, no `is_superadmin` claim, and the matching `platform_staff_users` row.
Local DB confirms an empty `is_superadmin` claim. Re-reviewed 2026-09-02 by /audit
(scope: current) and closed. The `scratch/seed-accounts.mjs` helper (untracked,
outside `supabase/`) still sets the flag and is out of code-review scope.

### platform-authorization-seed-hardening/F-12 [P0] closed - support.ts platform ticket actions have no authorization

**File:** src/app/actions/support.ts:308
**Found:** 2026-09-02 by /fix (scope: changed; lens: security)
**Why it matters:** Same class as F-02 - the renamed `getPlatformSupportInbox` and
`updatePlatformTicket` had no auth check and used `getAdminOrUserClient()` (service
role when the key is set), so any caller could read and mutate every tenant's
tickets.
**Resolution:** Both call `verifyPlatformStaff(PLATFORM_SUPPORT_ROLES)` as the
first `try` statement, admin client created after the guard. The file's
merchant-facing support actions were not changed. Re-reviewed 2026-09-02 by /audit
(scope: current) and closed.
