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

### F-19 [P3] open - Storefront order still trusts batchId and pickupStoreId from the payload

**File:** src/app/actions/storefront-order.ts:154
**Found:** 2026-09-03 by /audit (scope: current; lens: security)
**Why it matters:** The F-01 fix validates `variantId` against the slug-resolved
tenant but leaves the sibling reference fields unchecked. `submitStorefrontOrder`
still reads `val.batchId`, per-item `item.batchId`, and `val.pickupStoreId` from
the payload and writes them into `orders.batch_id`, `order_items.batch_id`, and
`orders.store_id` with no tenant check. This action now runs on the admin client
(F-04), so RLS no longer filters these writes. A crafted payload can attach a
tenant's own order to another tenant's `preorder_batch` or `store`. Impact is
contained: the order's `tenant_id` is still server-resolved, so other tenants'
batch and store views (RLS-scoped) exclude the poisoned row, and the damage is
mostly the attacker corrupting the batch/store reference on their own order.
Hence P3, but it is the same hygiene gap F-01 named for `variantId`.
**Suggested fix:** After resolving the tenant, verify any supplied `batchId` and
`pickupStoreId` belong to it (and, ideally, that each item's `batchId` matches a
`product_preorder_batches` row for its variant). Reject the order otherwise, the
same way an unresolved `variantId` is rejected.
**Resolution:**

### F-25 [P3] open - Some /platform pages render an interactive shell to out-of-RBAC roles

**File:** src/app/platform/communications/page.tsx:8
**Found:** 2026-09-03 by /audit (scope: current; lens: security)
**Why it matters:** F-24 added `requirePlatformRoute` to `security`,
`system-health`, and `plans-billing`. The remaining `/platform` pages still rely
on the action gate alone, and two of them swallow the auth error and render an
interactive client component anyway:
- `communications/page.tsx` calls `getPlatformBroadcastsAction()` (roles:
  owner/admin/operations), ignores the returned `error`, and renders
  `<CommunicationsClient initialBroadcasts={[]} />` — a `support`/`finance`/
  `tech_admin`/`compliance` user reaching the URL sees the full broadcast
  composer with create/edit controls.
- `support/page.tsx` does the same with `getPlatformSupportTicketsAction()`
  (roles: owner/admin/support/operations/tech_admin) and `<SupportClient>`, so
  `finance`/`compliance` see an empty support-inbox shell.
No data is exposed (the actions return empty arrays) and every write stays
role-gated, so this is a dead-UI disclosure, not escalation — the same class as
F-21/F-24 but lower stakes. `revenue` (early `return` on error) and `domains`/
`audit-logs` (read-only tables + visible error banner) are not affected the same
way. The spec deliberately scoped this out; recording it so it is not lost.
**Suggested fix:** Add `await requirePlatformRoute('/platform/communications')`
and `'/platform/support'` at the top of those two pages (helper already exists),
or have the pages render the error state instead of the client on `error`.
**Resolution:**
