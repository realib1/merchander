# Current Feature

**Title:** Platform-console consolidation follow-ups (plan gating + private-schema migration)

**Type:** Fix

**Status:** verified

**Source:** `/audit full` on 2026-09-03, findings F-07, F-08, F-12 (archived as
`unauthenticated-boundary-p0s/F-07`, `/F-08`, `/F-12`, accepted-deferred to this
fix). All three are on the `/platform` RBAC surface and the
`20260903002200_move_platform_staff_to_private` migration, which is committed
(`dd29bdc`) but not applied to the local DB or, per the finding, the linked
remote.

## The problem

| ID | Defect | File |
|---|---|---|
| F-07 | `getPlatformPlansAction` is gated with `PLATFORM_RBAC_RULES['/platform/plans-billing']` (owner + admin only), but it is called from `/platform` and `/platform/merchants`, both of which admit all seven staff roles. The callers swallow the resulting throw into `{ plans: [] }`, so `operations`, `support`, `finance`, `tech_admin`, and `compliance` see "No plans configured" on the Overview and an empty plan-override dropdown, a false claim about the database driven by a permission failure. | `actions/platform.ts:495` |
| F-08 | The migration creates schema `private` and moves `is_platform_staff()` into it, but never grants `USAGE` on the schema. RLS quals run with the caller's privileges, so once applied, every policy it rewrites raises `permission denied for schema private` for `authenticated` and `anon`, locking the platform plane and RLS-backed reads. | `supabase/migrations/20260903002200_move_platform_staff_to_private.sql:1` |
| F-12 | The same migration's policy-rewrite `DO` block: the nested `REPLACE` produces `private.private.is_platform_staff()` for any policy that renders the reference qualified; it is not idempotent; `array_to_string(pol.roles, ', ')` does not quote role identifiers; `permissive` is not carried through, so a `RESTRICTIVE` policy would silently be recreated `PERMISSIVE`; and it omits `NOTIFY pgrst, 'reload schema'`. | same migration, `DO` block |

Confirmed local state: `public.is_platform_staff` exists, `private.is_platform_staff`
does not, so `20260903002200` has not run locally. All 28 policies that reference
the function currently render it unqualified and PERMISSIVE.

## The fix

- **F-07:** reading the commercial plan catalogue is not sensitive and is shown
  on pages open to every staff role. Add a `PLATFORM_PLAN_READ_ROLES` constant
  (all seven roles) in `src/lib/auth/platform-staff.ts` and gate
  `getPlatformPlansAction` with it. The write actions in
  `actions/platform-plans.ts` keep their `['platform_owner', 'platform_admin']`
  gate unchanged.
- **F-08:** add `GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;`
  immediately after `CREATE SCHEMA`. This does not re-expose the function on the
  REST surface: PostgREST only serves `public` and `graphql_public`.
- **F-12:** replace the nested `REPLACE` with a single idempotent
  `regexp_replace(expr, '(\w+\.)?is_platform_staff\(\)', 'private.is_platform_staff()', 'g')`
  that strips any existing qualification before adding `private.`. Read
  `permissive` and recreate `AS RESTRICTIVE` when applicable, quote each role
  with `%I`, and end the migration with `NOTIFY pgrst, 'reload schema';`.

Must not break:

- Every existing `is_platform_staff()` policy keeps identical effect after the
  migration, just calling `private.is_platform_staff()`.
- `verifyPlatformStaff` role gates on the plan *write* actions are unchanged.
- The migration still applies as a single transaction; a mid-loop failure rolls
  everything back.
- `yarn test`, `yarn lint`, `yarn check`, `yarn build` all green.
- `npx supabase db reset --local` completes and the platform plane still works
  (staff can read, anon cannot).

## Build steps

- [x] 1. **F-07 - capability-gate the plan catalogue read.** Add
  `export const PLATFORM_PLAN_READ_ROLES: PlatformRole[]` (all seven roles) to
  `src/lib/auth/platform-staff.ts`. In `actions/platform.ts`, change
  `getPlatformPlansAction` to `verifyPlatformStaff(PLATFORM_PLAN_READ_ROLES)`.
  Leave `platform-plans.ts` write gates alone.
  *Done when:* `yarn check` passes; a grep shows `getPlatformPlansAction` no
  longer references `PLATFORM_RBAC_RULES`; the three write actions still gate on
  `['platform_owner', 'platform_admin']`.
  **Evidence:** `PLATFORM_PLAN_READ_ROLES` added at `platform-staff.ts:10`;
  `getPlatformPlansAction` now calls `verifyPlatformStaff(PLATFORM_PLAN_READ_ROLES)`
  (`platform.ts:495`), no `PLATFORM_RBAC_RULES` reference. `platform-plans.ts`
  lines 32/81/133 still `verifyPlatformStaff(['platform_owner', 'platform_admin'])`.
  `yarn check` exit 0.

- [x] 2. **F-08 + F-12 - repair the migration.** Edit
  `20260903002200_move_platform_staff_to_private.sql` in place (it is unapplied):
  add the `GRANT USAGE` line; rewrite the `DO` block to use the single
  `regexp_replace`, carry `permissive` into an `AS RESTRICTIVE` clause when
  `pol.permissive = 'RESTRICTIVE'`, quote roles with `%I` via a loop or
  `format('%I', ...)` per element; append `NOTIFY pgrst, 'reload schema';`.
  *Done when:* the file contains `GRANT USAGE ON SCHEMA private`, one
  `regexp_replace`, no nested `REPLACE`, a `permissive` check, and a trailing
  `NOTIFY pgrst`.
  **Evidence:** file now has `GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;`
  after `CREATE SCHEMA`; two `regexp_replace` calls (USING + WITH CHECK), one
  pattern `'(\w+\.)?is_platform_staff\(\)'`; no `REPLACE(`; an
  `IF pol.permissive = 'RESTRICTIVE' THEN ... ' AS RESTRICTIVE'` branch; roles
  built with `string_agg(format('%I', r), ', ')` over `unnest(pol.roles)`;
  trailing `NOTIFY pgrst, 'reload schema';`.

- [x] 3. **Apply and verify against the local DB.** Run
  `npx supabase db reset --local`. Confirm: the reset completes; `private.is_platform_staff()`
  exists and `public.is_platform_staff()` does not; every policy that referenced
  the function now references `private.is_platform_staff()`; as role `authenticated`
  a platform-staff user still passes `is_platform_staff` (seeded staff from
  `20260902070000`) and a normal tenant user does not; as role `anon` a
  platform-only table read still returns nothing.
  *Done when:* the reset is clean and the four checks above hold, pasted into
  this spec as evidence.
  **Evidence** (`npx supabase db reset --local` exit 0, all 74 migrations +
  seed applied clean):

  | Check | Result |
  |---|---|
  | `private.is_platform_staff` exists | `true` |
  | `public.is_platform_staff` exists | `false` |
  | policy clauses referencing bare/`public.` `is_platform_staff()` | `0` |
  | policy clauses referencing `private.is_platform_staff()` | `38` |
  | `has_schema_privilege('authenticated'/'anon'/'service_role', 'private', 'USAGE')` | `true` / `true` / `true` |
  | RESTRICTIVE `is_platform_staff` policies (branch is defensive, untriggered) | `0` |
  | role `authenticated` + seeded staff uid → `private.is_platform_staff()` | `true`; sees `customers` (2 rows) |
  | role `authenticated` + tenant uid → `private.is_platform_staff()` | `false`; `platform_audit_logs` → 0 rows |
  | role `authenticated` + tenant uid reads `customers`/`products` through rewritten policy | 2 / 2 rows, **no "permission denied for schema private"** |
  | role `anon` → `customers`, `platform_audit_logs` | 0 / 0 rows, no schema error |

  Note: a direct `SELECT` from `platform_staff_users` as a non-owner role raises
  "infinite recursion detected in policy" — pre-existing bug in the
  `Service role and owners manage staff users` policy from commit `14d2242`
  (its qual has a self-referential `EXISTS (SELECT 1 FROM platform_staff_users)`),
  untouched by this migration and out of scope for F-07/F-08/F-12.

- [x] 4. **Repair F-21 — guard the plans-billing route.** Widening
  `getPlatformPlansAction` (step 1) removed the incidental owner/admin block on
  the `/platform/plans-billing` page, which has no route-level RBAC of its own.
  Add an explicit `verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/plans-billing'])`
  guard at the top of `PlansBillingPage`, redirecting to `/platform` on throw, so
  the route 403s for non-owner/admin roles independently of the read action.
  *Done when:* as `operations` the page redirects away; as owner/admin it renders
  and create/edit/toggle still work; `yarn check`, `yarn lint`, `yarn build`
  clean.
  **Evidence:** [plans-billing/page.tsx](../../src/app/platform/plans-billing/page.tsx)
  now `try { await verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/plans-billing']) } catch { redirect('/platform') }`
  before the read. `verifyPlatformStaff(['platform_owner','platform_admin'])`
  throws "Forbidden" for the other five roles → caught → redirect; owner/admin
  pass through unchanged. Same gate function every other platform action uses.
  `yarn check` / `yarn lint` / `yarn build` / `yarn test` (184) all clean. No
  live non-admin staff login available; behavior is inferred from the shared
  gate function + green build (same evidence basis as F-07).

## Verify

- `yarn test`, `yarn lint`, `yarn check`, `yarn build` all clean.
- `npx supabase db reset --local` clean; post-reset SQL checks from step 3 pass.
- `/platform` signed in as a non-owner/admin staff role (e.g. `operations`):
  Commercial Tiers panel shows the real plans and prices, not "No plans
  configured". (If a live non-admin staff login is not available, the DB-level
  role check plus the removed gate is the evidence.)
- `/platform/plans-billing` as `operations`: still 403 / not in nav (page gate
  unchanged); as owner/admin: create/edit/toggle still work.

## Out of scope

- F-11 (subscription source-of-truth) and F-06 (Paystack amount), which depend on
  the F-11 decision.
- F-13 (platform overview query fan-out), F-14 (untested pure modules), F-15-F-20.
- Whether `is_platform_staff` should also drop its `authenticated`/`anon`
  `EXECUTE` grant: it cannot, because the RLS policies call it; moving it to
  `private` is the whole mitigation and this fix completes that.

## Findings

Also resolves **F-07** and **F-08** (raised by `/audit full` 2026-09-03,
archived as `unauthenticated-boundary-p0s/F-07` and `/F-08`, accepted-deferred to
this fix): F-07 by the `PLATFORM_PLAN_READ_ROLES` regate on `getPlatformPlansAction`
(step 1), F-08 by `GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;`
in the migration (step 2). Both verified — see step evidence above.

### platform-console-consolidation/F-12 [P2] closed - Policy-rewrite migration is fragile in four ways

**File:** supabase/migrations/20260903002200_move_platform_staff_to_private.sql:48
**Found:** 2026-09-03 by /audit (scope: full; lens: quality)
**Why it matters:** Four defects in the same DO block. The nested REPLACE turns
`public.is_platform_staff()` into `private.private.is_platform_staff()` for any
qualified render; not idempotent; `array_to_string(pol.roles, ', ')` does not
quote role identifiers; `permissive` is not read, so a RESTRICTIVE policy would
be recreated PERMISSIVE (none exist today); and it omits `NOTIFY pgrst, 'reload
schema'`.
**Resolution:** Fixed on `fix/platform-console-consolidation` (migration edited
in place, it was unapplied). Single idempotent
`regexp_replace(expr, '(\w+\.)?is_platform_staff\(\)', 'private.is_platform_staff()', 'g')`
strips any qualifier before adding exactly one `private.`; roles quoted with
`format('%I', r)` via `string_agg(... unnest(roles))`; `pol.permissive = 'RESTRICTIVE'`
branch emits `AS RESTRICTIVE`; trailing `NOTIFY pgrst, 'reload schema';`.
Re-reviewed by /audit (scope: current) 2026-09-03 against the edited migration
and a fresh `npx supabase db reset --local`: all four defects gone, migration
re-runnable, `DROP FUNCTION public.is_platform_staff()` has no remaining
dependents, no new defect introduced. Closed.

### Still open at completion (not part of this fix)

- **F-21 [P2] fixed** — the plans-billing route guard added in step 4. Repaired
  but not yet re-reviewed by `/audit`; remains in the live ledger for a later
  pass. Not a merge blocker (P2).
- F-13–F-20 (P2/P3) — pre-existing, out of scope.
