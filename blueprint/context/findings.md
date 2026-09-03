# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-13 [P2] fixed - Platform overview fetches whole tables on every page load

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
**Resolution:** Fixed in fix/platform-overview-aggregate. New migration
`20260903190000_create_platform_overview_snapshot.sql` adds
`public.get_platform_overview_snapshot()` (`sql` / `security invoker` /
`REVOKE ... FROM PUBLIC, anon, authenticated` + `GRANT EXECUTE TO service_role`)
returning `{ tenant_stats: [{tenant_id, order_count, gmv, product_count}], totals }`.
`getPlatformOverviewData` drops the unfiltered `orders` and `products` selects
for this one RPC call and sources the per-tenant maps + the three KPI totals
from it (GMV filter `paid|completed|delivered` preserved in SQL; values proven
equal to the old JS aggregation against the local DB). `listUsers({ perPage: 1000 })`
is replaced by `listAllPlatformAuthUsers`, a bounded page loop (stop on a short
page or 50 pages). The `tenant_settings` full-`settings_data` select named in
this finding was left untouched: it references `store_name`/`slug` (columns of
`storefront_settings`, not `tenant_settings`) so it already errors and returns
nothing - a separate pre-existing bug, out of scope here, to be raised as its
own finding. `lint`/`check`/`build`/`test` all green.
