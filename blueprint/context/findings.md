# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

> F-01, F-02, F-03, F-05, F-06, F-07, F-09, F-11, F-12 were `closed` and archived
> with `blueprint/history/fixes/platform-authorization-seed-hardening.md` (see its
> `## Findings` section, IDs prefixed `platform-authorization-seed-hardening/`).
> The entries below were not part of that fix and carry forward.

### F-04 [P2] open - Dashboard metrics RPC failure now yields NaN instead of an error

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
**Resolution:**

### F-08 [P3] open - Commented-out code left in OrdersHeader

**File:** src/app/dashboard/orders/components/OrdersHeader.tsx:39
**Found:** 2026-09-02 by /audit (scope: changed; lens: quality)
**Why it matters:** `handleExport` and its button markup were commented out rather
than removed, with a `TODO`. `coding-standards.md` says "No commented-out code" and
lists comment discipline explicitly. Dead JSX in a comment rots and confuses diffs.
**Suggested fix:** Delete the commented block and the `handleExport` stub; track the
CSV export work in the build plan or an issue.
**Resolution:**

### F-10 [P2] open - New aggregation and formatting logic shipped without tests

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
**Resolution:**

### F-13 [P3] open - platform-audit.ts has no `import 'server-only'` guard

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
**Resolution:**

### F-14 [P2] open - Failed-login audit writes are unauthenticated and caller-shaped

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
**Resolution:**
