# Fix - Close carried-forward audit findings (F-04, F-08, F-10, F-13, F-14)

**Type:** Fix
**Status:** verified
**Branch:** `fix/close-carried-audit-findings`
**Completed:** 2026-09-02
**Fixes:** F-04, F-08, F-10, F-13, F-14

## The problem

Five findings carried forward from the last two audits and still sat `open` in
`blueprint/context/findings.md`. None blocked a merge on their own, but two were
live P2 security/correctness issues and the rest were quality/test-gate debt in
files the platform-authorization fix had touched.

| ID | Sev | File | Problem |
|---|---|---|---|
| F-14 | P2 | `src/app/actions/auth.ts` | `login()` called `logAuthEvent(email, 'auth.login_failed', ...)` on every bad-password attempt, before any session - inserting into `platform_audit_logs` with the service-role client and attacker-controlled `email` as `actor_email` / `target_id` / `target_name`. An anonymous caller could loop the login action to bloat the "immutable" audit table, bury real events, and plant realistic-looking rows in `/platform/audit-logs`. |
| F-04 | P2 | `src/app/actions/dashboard.ts` | The RPC-error branch only logged; execution continued with `(metricsData \|\| {})`, so `current_sales` etc. were `undefined` and `current_sales - previous_sales` was `NaN`, rendered directly as dashboard KPI values. |
| F-10 | P2 | `src/app/actions/batch-notifications.ts`, `src/app/actions/customers.ts` | Pure, assertable logic with no coverage while the test gate is ON: a local `normalizePhone` (a weaker duplicate of the tested `normalizeGhanaPhone`), and the customer attribution/percentage reducer inside `getCustomerAttributionBreakdownAction`. |
| F-13 | P3 | `src/app/actions/platform-audit.ts` | The F-05 repair removed `'use server'`, but the only thing stopping a future accidental client import of this admin-client module was a header comment. No compile-time guard. |
| F-08 | P3 | `src/app/dashboard/orders/components/OrdersHeader.tsx` | `handleExport` stub + a commented-out export `<button>` block left in with a `TODO`, plus an orphaned divider `<div>`. `coding-standards.md`: "No commented-out code." |

## What shipped

Six small steps, one per finding (F-10 split):

1. **F-14** - removed the `auth.login_failed` audit write from `login()` entirely
   (grep confirms zero `login_failed` references remain in `src/`). The two
   success-path `logAuthEvent` calls now pass `user.email` (the authenticated
   address) instead of the submitted form value, so `actor_email` / `target_id`
   are server-derived.
2. **F-04** - `dashboard.ts` spread-merges the RPC result over a
   `DEFAULT_DASHBOARD_METRICS` constant (all numerics `0`, arrays `[]`) and
   ignores a non-object/array result. `get_dashboard_metrics` returns a single
   `jsonb` object, so the guard is correct; KPIs read `0` on RPC failure, not
   `NaN`.
3. **F-13** - added the `server-only` dependency and `import 'server-only';` to
   `platform-audit.ts` and `src/lib/supabase/admin.ts` (the latter guards every
   admin-client importer at once). Verified: a scratch `'use client'` component
   importing `createAdminClient` fails `yarn build`.
4. **F-10a** - deleted the duplicate local `normalizePhone`; added
   `toWhatsAppMsisdn` to `src/utils/phone.ts` (+2 test cases) and switched the
   batch broadcast builder to it, skipping recipients whose number won't
   normalize instead of emitting a broken `wa.me/` link.
5. **F-10b** - extracted the attribution tally/ranking into a pure
   `computeCustomerAttribution` in `src/utils/customer-attribution.ts` with 5
   tests; the server action now just fetches and delegates. The types moved to
   the util and are re-exported from `customers.ts` so consumers are unchanged.
   Incidental improvement: `topChannel` now defaults to `Direct Storefront` at
   zero customers instead of `Instagram`.
6. **F-08** - removed the `handleExport` comment stub, the commented-out export
   `<button>` block, and the orphaned divider `<div>`.

## Verification

- `yarn test` - 177 pass (25 files; +7: 2 `phone`, 5 `customer-attribution`)
- `yarn lint` - clean
- `yarn check` - clean (after clearing a stale `.next` scratch-route artifact)
- `yarn build` - compiled successfully
- `server-only` guard - scratch `'use client'` import of `createAdminClient`
  fails the build with "'server-only' cannot be imported from a Client Component
  module"
- `/audit current` (all lenses) - re-reviewed all five repairs, no new findings,
  moved F-04/F-08/F-10/F-13/F-14 to `closed`

## Behaviour changes / residual risk

- Batch-broadcast recipients with an unparseable phone number are now omitted
  from the list (previously included with a broken `wa.me` link). No UI signal
  that some were skipped.
- Failed platform-staff logins now have no audit or telemetry anywhere -
  accepted trade-off of dropping the write.
- F-14 / F-04 runtime done-whens were confirmed by code inspection, not a live
  dev-server + DB run (the check gate is `manual` and the diffs - a deleted call
  and a defaulted spread - are conclusive on inspection).

## Follow-ups (not this fix)

- `verifyPlatformStaff` role-match logic is still untested - it is not pure
  (constructs the admin client). Revisit if that predicate is extracted later.
- Non-code: rotate the remote `admin@merchander.com` account; `supabase db push`
  the new migrations.

## Findings

### close-carried-audit-findings/F-04 [P2] closed - Dashboard metrics RPC failure now yields NaN instead of an error

**File:** src/app/actions/dashboard.ts:98
**Found:** 2026-09-02 by /audit (scope: changed; lens: quality)
**Why it matters:** The change removed `throw new Error('Failed to load dashboard
metrics')` on `metricsError` and only logs. Execution continues with
`(metricsData || {})`, so every destructured field (`current_sales`, etc.) is
`undefined` and downstream arithmetic (`current_sales - previous_sales`) produces
`NaN`, which is then rendered as dashboard KPI values. A hard failure was replaced
by silently wrong numbers.
**Suggested fix:** Either restore a thrown error, or coerce the RPC result to a
zeroed `DashboardMetricsRpcResult` default (all numeric fields `0`, arrays `[]`) so
the fallbacks are meaningful, and surface a non-blocking "metrics unavailable" flag
to the UI.
**Resolution:** fixed in `fix/close-carried-audit-findings` step 2 -
`dashboard.ts` now spread-merges the RPC result over a `DEFAULT_DASHBOARD_METRICS`
constant (all numerics `0`, arrays `[]`), and ignores a non-object/array result,
so every downstream field is a number and KPIs read `0` on RPC failure, not
`NaN`. The "metrics unavailable" UI flag was not added (kept minimal). `yarn build`
passes.
Re-reviewed 2026-09-02 by /audit (scope: current): confirmed `get_dashboard_metrics`
returns a single `jsonb` object (not an array), so the `!Array.isArray` guard is
correct and the RPC-error path (`data` null) now resolves to all-zero fields.
Downstream arithmetic verified NaN-free. `closed`.

### close-carried-audit-findings/F-08 [P3] closed - Commented-out code left in OrdersHeader

**File:** src/app/dashboard/orders/components/OrdersHeader.tsx:39
**Found:** 2026-09-02 by /audit (scope: changed; lens: quality)
**Why it matters:** `handleExport` and its button markup were commented out rather
than removed, with a `TODO`. `coding-standards.md` says "No commented-out code" and
lists comment discipline explicitly. Dead JSX in a comment rots and confuses diffs.
**Suggested fix:** Delete the commented block and the `handleExport` stub; track the
CSV export work in the build plan or an issue.
**Resolution:** fixed in `fix/close-carried-audit-findings` step 6 - removed the
`handleExport` comment stub, the commented-out export `<button>` block, and the
divider `<div>` that only separated it from the view toggles. `yarn lint` +
`yarn build` pass. CSV export remains unbuilt and untracked (no build-plan item);
raise one if it is wanted.
Re-reviewed 2026-09-02 by /audit (scope: current): no commented-out code remains in
the file; toolbar JSX is well-formed (build passes). `closed`.

### close-carried-audit-findings/F-10 [P2] closed - New aggregation and formatting logic shipped without tests

**File:** src/app/actions/customers.ts:362
**Found:** 2026-09-02 by /audit (scope: changed; lens: tests)
**Why it matters:** A `test` command is configured (`vitest run`), which makes tests
a gate for logic-bearing changes per `coding-standards.md`. `getCustomerAttributionBreakdownAction`
(channel normalization, percentage math, filter/sort) and `normalizePhone` in
`src/app/actions/batch-notifications.ts` (Ghana MSISDN normalization with real edge
cases: leading zero, `233` prefix, junk characters) are pure, assertable logic with
no coverage. `verifyPlatformStaff` role-gate logic is also untested.
**Suggested fix:** Add `customers.test.ts` for the attribution reducer (empty data,
unknown source fallback to `direct`, percentage rounding) and a `normalizePhone`
unit test; consider a focused test for `verifyPlatformStaff` role matching.
**Resolution:** fixed in `fix/close-carried-audit-findings` steps 4-5.
(a) The local `normalizePhone` in `batch-notifications.ts` was a weaker duplicate
of the tested `normalizeGhanaPhone`; deleted it, added `toWhatsAppMsisdn` to
`src/utils/phone.ts` (+ 2 test cases) and switched the broadcast builder to it,
skipping recipients whose number will not normalize instead of emitting a broken
`wa.me/` link. (b) Extracted the attribution tally/ranking into a pure
`computeCustomerAttribution` in `src/utils/customer-attribution.ts` with 5 tests
(empty data, unknown/null source -> `direct`, percentage rounding, GMV source
fallback, ranking); the server action now just fetches and delegates. `yarn test`
177 pass. `verifyPlatformStaff` role matching remains untested - it is not pure
(builds the admin client); tracked as a follow-up in the fix spec.
Re-reviewed 2026-09-02 by /audit (scope: current): `computeCustomerAttribution` and
`toWhatsAppMsisdn` are pure and behaviour-preserving vs the extracted code (the
one deliberate change - `topChannel` defaults to `Direct Storefront` at zero
customers instead of `Instagram` - is an improvement); tests assert the stated
edge cases with real values; recipients with unparseable phones are dropped
rather than emitting a broken `wa.me/` link; no new defect. `closed`. The
untested non-pure `verifyPlatformStaff` predicate is a separate follow-up, not a
reason to hold this finding open.

### close-carried-audit-findings/F-13 [P3] closed - platform-audit.ts has no `import 'server-only'` guard

**File:** src/app/actions/platform-audit.ts:1
**Found:** 2026-09-02 by /audit (scope: current; lens: security)
**Why it matters:** The F-05 repair removed `'use server'` so `logPlatformAuditAction`
is no longer an RPC endpoint, but the module sits in `src/app/actions/` and its
only protection against a future accidental client import (or a `'use server'`
re-add) is a header comment. The fix spec called for `import 'server-only'` as the
compile-time guard; it was skipped because the `server-only` package is not a
dependency. A wrong future import would silently pull `createAdminClient` and
`next/headers` toward the client bundle.
**Suggested fix:** `yarn add server-only` and add `import 'server-only';` at the
top of `platform-audit.ts` (and any other server-only helper module in
`src/app/actions/` or `src/lib/` that touches the admin client or `next/headers`).
**Resolution:** fixed in `fix/close-carried-audit-findings` step 3 - added the
`server-only` dependency and `import 'server-only';` to `platform-audit.ts` and to
`src/lib/supabase/admin.ts` (the latter guards every admin-client importer at
once). Verified: a scratch `'use client'` component importing `createAdminClient`
fails `yarn build` with "'server-only' cannot be imported from a Client Component
module"; scratch removed.
Re-reviewed 2026-09-02 by /audit (scope: current): `import 'server-only'` sits
above all other imports in both files; `admin.ts` is imported only by server code
today (build passes); guard mechanism exercised. `closed`.

### close-carried-audit-findings/F-14 [P2] closed - Failed-login audit writes are unauthenticated and caller-shaped

**File:** src/app/actions/auth.ts:24
**Found:** 2026-09-02 by /audit (scope: current; lens: security)
**Why it matters:** `login()` calls `logAuthEvent(email, 'auth.login_failed', ...)`
on every bad-password attempt, before any session exists. `logAuthEvent` inserts
into `platform_audit_logs` with the service-role client, and the attacker controls
`email`, which becomes `actor_email`, `target_id`, and `target_name`. An
unauthenticated client can POST the login action in a loop to (a) grow the
"immutable" platform audit table without bound (storage and cost), (b) bury real
security events in noise, and (c) plant rows that read like legitimate audit
entries in the `/platform/audit-logs` console. This is the same class as F-05 but
on the pre-auth login path; it predates the fix and lives in a fix-touched file.
**Suggested fix:** Do not write to `platform_audit_logs` for anonymous failed
logins - either drop the `auth.login_failed` write, rate-limit it, route it to a
separate append-only `auth_events` table with its own retention, or record it only
after a session is established. If failed-login telemetry is wanted, keep the
actor fields server-derived, not echoed from the submitted email.
**Resolution:** fixed in `fix/close-carried-audit-findings` step 1 - removed the
`logAuthEvent(email, 'auth.login_failed', ...)` call from `login()` entirely (no
audit write on the pre-auth path). The two success-path `logAuthEvent` calls now
pass `user.email` (the authenticated address) instead of the submitted form
`email`, so `actor_email` / `target_id` are server-derived. `yarn check` + `yarn
lint` pass; behavioural check of the "no row on failed login / row on success"
done-when is pending (needs the dev server + local DB) - flagged in the packet.
Re-reviewed 2026-09-02 by /audit (scope: current): the only `auth.login_failed`
write in the codebase is gone (grep); no other pre-auth path writes to
`platform_audit_logs`; the two remaining `logAuthEvent` calls are on the
post-`getUser()` success paths with a server-derived `user.email`. Defect removed
by deletion - a live DB check can only confirm what the diff already proves.
Residual (accepted trade-off, not a defect): failed platform-staff logins now
have no audit/telemetry anywhere. `closed`.
