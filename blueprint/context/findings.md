# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-13 [P2] open - Platform overview fetches whole tables on every page load

**File:** src/app/actions/platform.ts:88
**Found:** 2026-09-03 by /audit (scope: full; lens: performance)
**Why it matters:** `getPlatformOverviewData` selects every row of `orders`,
`products`, `tenant_users`, `channel_connections`, `tenant_subscriptions`, and
`tenant_settings` including the full `settings_data` jsonb, then joins in memory.
It runs on `/platform`, `/platform/merchants`, and again inside
`getPlatformRevenueMetricsAction`, all `force-dynamic`, so nothing is cached.
`auth.admin.listUsers({ perPage: 1000 })` is a hard cap: past 1000 users, tenant
owner emails silently go missing. `coding-standards.md` calls for an RPC or view
once an aggregation fans out this far.
**Suggested fix:** Move the counts and sums into a Postgres RPC returning one
aggregate row, and page or drop `listUsers` in favour of a targeted lookup.
**Resolution:**

### F-14 [P2] open - Pure logic modules ship with no tests despite the declared test gate

**File:** src/utils/analyticsMath.ts:1
**Found:** 2026-09-03 by /audit (scope: full; lens: tests)
**Why it matters:** The test gate is declared on in `AGENTS.md` and
`coding-standards.md` scopes it to pure logic in `src/utils/`. Five such modules
have no test file: `analyticsMath.ts` (487 lines), `insightRules.ts` (226),
`profitabilityExport.ts` (274), `conversationsMath.ts` (105), and
`backup-codes.ts` (51). `backup-codes.ts` generates and verifies MFA backup
codes, so it is the one where an untested edge case has a security consequence.
The 25 existing suites all pass and the gate is real; it is being applied
unevenly.
**Suggested fix:** Add focused tests for `backup-codes.ts` first, then
`analyticsMath.ts` and `insightRules.ts`. Run `/tests` if the scope needs
normalising rather than adding files ad hoc.
**Resolution:**

### F-26 [P3] open - /platform/support route guard and data action disagree on which roles are allowed

**File:** src/app/platform/support/page.tsx:9
**Found:** 2026-09-03 by /audit (scope: current; lens: security)
**Why it matters:** The F-25 fix added
`await requirePlatformRoute('/platform/support')`, which enforces
`PLATFORM_RBAC_RULES['/platform/support']` =
`['platform_owner','platform_admin','support','operations','tech_admin']`. But
`getPlatformSupportTicketsAction` (and every support write action) gates on
`SUPPORT_INBOX_ROLES` =
`['platform_owner','platform_admin','operations','support','compliance']`. The
two sets disagree on two roles:
- `tech_admin` passes the route guard but the data action denies, so the page
  still renders `<SupportClient initialTickets={[]} />` — the exact F-25
  dead-shell symptom, now only for this one role.
- `compliance` is in `SUPPORT_INBOX_ROLES` (the action would authorize it) but
  not in the RBAC rule, so the guard redirects it away from a page its own data
  action considers in-scope. `PlatformNav` also hides the link from
  `compliance`, so this role can currently reach support tickets nowhere.
No data is exposed (the action still denies `tech_admin`) and writes stay gated,
so P3, same class as F-25. `/platform/communications` does not have this problem
(`BROADCAST_ROLES` equals its RBAC rule).
**Suggested fix:** Pick the intended support-triage role set and make
`SUPPORT_INBOX_ROLES` and `PLATFORM_RBAC_RULES['/platform/support']` identical
(decide `tech_admin` vs `compliance` deliberately). Reconciling the constant
with the RBAC table — the documented source of truth used by `PlatformNav` — is
the smaller change; audit-logs/security already use `compliance`, which hints
`compliance` belongs and `tech_admin` was the stray.
**Resolution:**
