# Staff actions hardening - tenant scoping, targeted auth lookups, input validation

**Type:** Fix

**Status:** verified

**Fixes:** F-28, F-29, F-30

## The problem

`src/app/actions/staff.ts` (the merchant staff management surface) and one
sibling in `src/app/actions/platform.ts` carried three related gaps:

- **F-28 [P2]** - `auth.admin.listUsers()` was called with no `perPage`, so it
  returned only the first 50 users platform-wide, then each caller did an
  in-memory `.find()`:
  - `getStaffMembers` - staff past page 1 render as "Unknown Email" /
    "Team Member", no `last_sign_in_at`.
  - `sendPasswordReset` - returns "Staff member email not found"; an owner
    cannot reset a staff password once the platform passes 50 users. Functional
    break on a security-adjacent flow.
  - `provisionMerchantTenantAction` - the existing-email check
    (`userList.users.find(u => u.email === cleanEmail)`) misses an existing user
    past page 1, `createUser` then rejects the duplicate, and the whole provision
    throws.
- **F-29 [P2]** - `updateStaffMember` gated the caller (owner only) then ran
  `supabaseAdmin.from('tenant_users').update(payload).eq('id', tenantUserId)` on
  the service-role client. RLS is off and the only filter was the client-supplied
  row id. The sole thing stopping a cross-tenant write was the earlier RLS-bound
  `select('user_id').eq('id', tenantUserId).single()` returning null for a
  foreign row - implicit, and one refactor away from a cross-tenant privilege
  escalation on the permissions table.
- **F-30 [P3]** - `inviteStaffMember`, `updateStaffMember`, and
  `removeStaffMember` read `formData` / arguments directly with no Zod schema,
  against `coding-standards.md`. `role` reached a `tenant_users` insert/update as
  a free string; `email` reached `inviteUserByEmail` unvalidated.

## The fix

Worked in `src/app/actions/staff.ts` with one touch in
`src/app/actions/platform.ts`. No behaviour change for the happy path; the
observable change is that the broken-past-50 flows keep working and invalid
input is rejected before Supabase is touched.

- **F-28** - replaced each bare `listUsers()` with a targeted lookup:
  - id lookups (`getStaffMembers`, `sendPasswordReset`) use
    `supabaseAdmin.auth.admin.getUserById(userId)`. `getStaffMembers` resolves
    its rows with `Promise.all` over the tenant's `tenant_users` (a small list);
    a failed single lookup degrades that one row to the existing fallback
    strings rather than failing the whole call.
  - `provisionMerchantTenantAction` email lookup: pages through
    `listUsers({ page, perPage: 1000 })` up to 20 pages, stopping when the email
    is found or a short page ends the scan. Create-or-reuse behaviour unchanged.
- **F-29** - widened the caller lookup in `updateStaffMember` to
  `select('role, tenant_id')` and `targetRecord` to `select('user_id, tenant_id')`,
  asserted `targetRecord.tenant_id === currentUserRecord.tenant_id` (returns the
  existing "Staff member not found" on mismatch, no tenant-id disclosure), and
  added `.eq('tenant_id', currentUserRecord.tenant_id)` to the admin `update`.
  The `updateUserById` metadata write stays keyed off the verified
  `targetRecord.user_id`. The same `tenant_id` assertion was added to
  `removeStaffMember` and `sendPasswordReset` (defence in depth).
- **F-30** - added `inviteStaffSchema`, `updateStaffSchema`, and a shared
  `tenantUserIdSchema` (uuid). `email` is `z.string().trim().email()`, `role` is
  `z.enum(['owner', 'admin', 'member'])`, `role_id` is
  `z.string().uuid().nullable().optional()`, `full_name` is
  `z.string().trim().min(1).max(120)`. Each mutation `safeParse`s and returns
  `validation.error.errors[0].message` before any Supabase call, matching the
  pattern in `categories.ts`.

## Build steps

- [x] **Step 1 - F-30 input validation.** Zod schemas on `inviteStaffMember`,
  `updateStaffMember`, `removeStaffMember`; reject invalid input before Supabase.
- [x] **Step 2 - F-29 tenant scoping.** `tenant_id` on both lookups in
  `updateStaffMember`, assert match, scope the admin `tenant_users` update by
  `tenant_id`; same target-tenant assertion on `removeStaffMember` and
  `sendPasswordReset`.
- [x] **Step 3 - F-28 targeted auth lookups.** `getUserById` in
  `getStaffMembers` (per-row, `Promise.all`, graceful fallback) and
  `sendPasswordReset`; bounded paginated scan in `provisionMerchantTenantAction`.

## Verify

- `yarn lint`, `yarn check`, `yarn build` clean; `yarn test` 246 passed / 30
  files.
- Manual: `/dashboard/staff` as an owner - staff table shows real emails and
  last-sign-in; edit a member's role and name (succeeds); "send password reset"
  returns success; invite with a malformed email is rejected.
- Code review: `git grep -n "listUsers" src/app/actions` shows no bare call in
  `staff.ts` / the provisioning path; the `updateStaffMember` admin update
  carries `.eq('tenant_id', ...)`.

## Findings

### staff-actions-hardening/F-28 [P2] closed - Bare auth.admin.listUsers() (default 50-row page) used as a user lookup in three actions

**File:** src/app/actions/staff.ts:26
**Found:** 2026-09-04 by /audit (scope: full; lens: performance)
**Why it matters:** `auth.admin.listUsers()` with no `perPage` returns only the
first 50 users platform-wide. `getStaffMembers` renders "Unknown Email" past
page 1; `sendPasswordReset` returns "Staff member email not found" (an owner
cannot reset a staff password); `provisionMerchantTenantAction` misses an
existing email and the provision throws on the duplicate.
**Suggested fix:** `getUserById` for the id cases, a paginated scan for the
provisioning email lookup; longer term store the email on `tenant_users`.
**Resolution:** `getStaffMembers` and `sendPasswordReset` use
`supabaseAdmin.auth.admin.getUserById(user_id)` (staff list resolves rows in
parallel with per-row fallback); `provisionMerchantTenantAction` pages through
`listUsers({ page, perPage: 1000 })` up to 20 pages, stopping on a match or a
short page. Re-reviewed 2026-09-03 by /audit (scope: current): `git grep
listUsers` shows `staff.ts` clean and the provisioning path bounded;
lint/check/build/test green. Longer-term email-on-tenant_users storage not done
(larger schema change, out of scope). Closed.

### staff-actions-hardening/F-29 [P2] closed - updateStaffMember writes tenant_users on the admin client scoped only by row id

**File:** src/app/actions/staff.ts:185
**Found:** 2026-09-04 by /audit (scope: full; lens: security)
**Why it matters:** `updateStaffMember` ran
`supabaseAdmin.from('tenant_users').update(payload).eq('id', tenantUserId)` on
the service-role client (RLS off), filtered only by the client-supplied row id.
The one thing stopping a cross-tenant write was an implicit RLS null-check on the
earlier anon-client select - one refactor away from cross-tenant privilege
escalation on the permissions table.
**Suggested fix:** Select `tenant_id` in `targetRecord`, assert it equals the
caller's tenant, and add `.eq('tenant_id', callerTenantId)` to the admin update.
**Resolution:** `updateStaffMember` selects `tenant_id` on both the caller record
and `targetRecord`, returns "Staff member not found" on a tenant mismatch (no
tenant-id disclosure), and the admin update is scoped
`.eq('id', ...).eq('tenant_id', currentUserRecord.tenant_id)`. Same assertion
added to `removeStaffMember` and `sendPasswordReset`. Re-reviewed 2026-09-03 by
/audit (scope: current): `currentUserRecord.tenant_id` is server-derived from
the authenticated `user.id`, never client input; the explicit `.eq('tenant_id',
...)` no longer depends on the RLS null-check. No new defect. Closed.

### staff-actions-hardening/F-30 [P3] closed - Staff mutation actions accept role and email with no Zod validation

**File:** src/app/actions/staff.ts:65
**Found:** 2026-09-04 by /audit (scope: full; lens: quality)
**Why it matters:** `inviteStaffMember`, `updateStaffMember`, and
`removeStaffMember` read `formData` / arguments with no schema validation. `role`
reached a `tenant_users` write as a free string; `email` reached
`inviteUserByEmail` unvalidated. Owner-gated and own-tenant, so hygiene not
breach, but the same gap the other action modules close with Zod.
**Suggested fix:** A Zod schema per action - `role` enum, `email` validated,
`full_name` bounded - rejecting before Supabase.
**Resolution:** Added `inviteStaffSchema`, `updateStaffSchema`, and a shared
`tenantUserIdSchema`. All three mutations `safeParse` and return
`validation.error.errors[0].message` before any Supabase call, matching
`categories.ts`. Re-reviewed 2026-09-03 by /audit (scope: current):
`removeStaffMember` and `sendPasswordReset` also uuid-guard the id arg;
`role: 'owner'` stays accepted by the enum (owner-promotes-member was already
possible pre-fix, narrowing it is a separate behaviour change). Closed.
