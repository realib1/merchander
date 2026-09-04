# Platform console: read store identity from storefront_settings, not tenant_settings

**Type:** Fix

**Status:** verified

**Fixes:** F-31

## The problem

Three platform-console reads in `src/app/actions/platform.ts` treat `store_name`,
`slug`, and `custom_domain` as columns of `tenant_settings`. They are columns of
**`storefront_settings`** (created in `20260827150000_create_storefront_settings.sql`;
`custom_domain` added there by `20260830000000`). `tenant_settings` only has
`store_email`, `business_phone`, `business_country`, `store_currency`,
`settings_data`, and the branding columns.

- **`getPlatformOverviewData:112`** -
  `.select('tenant_id, store_name, slug, store_email, business_phone, business_country, custom_domain, settings_data')`
  fails entirely (`column tenant_settings.store_name does not exist`, verified
  against the live schema). `settingsRes.data` comes back `null`, the error is
  swallowed. Result on `/platform` and `/platform/merchants`: per-tenant `slug`
  / `customDomain` blank, `country` always `'GH'`, owner email/phone from auth
  metadata only, and **`openTicketsCount` / `urgentTicketsCount` KPIs always 0**
  because the `settings_data.support_tickets` loop over `settingsRes.data` never
  runs.
- **`getDomainInfrastructureAction:~620`** -
  `.from('tenant_settings').select('tenant_id, store_name, slug, custom_domain')`
  fails the same way, so `/platform/domains` builds its list from nothing.
- **`getMerchantContextAction:~421`** - uses `.select('*')` so it does **not**
  error, but `setting?.store_name` / `setting?.slug` / `setting?.custom_domain`
  are always `undefined`; the single-merchant view shows no slug or custom
  domain.

Pre-existing; F-13 only conflated it. Not a regression from the F-13 change.

## The fix

Point each read at the correct table. No schema change, no migration, no type
regen - only query and mapping changes in `platform.ts`.

- For each function, fetch `storefront_settings` (`tenant_id, store_name, slug, custom_domain`)
  alongside the existing `tenant_settings` read, build a
  `tenant_id -> { storeName, slug, customDomain }` map, and read those three
  fields from it.
- Keep `store_email`, `business_phone`, `business_country`, `settings_data` on
  the `tenant_settings` read (narrow the select to only real columns).
- Fallback order for the display name stays `tenant.name` first, then the
  storefront `store_name`, then (where already present) `settings_data.store_name`
  from provisioning, then the existing literal.
- Add an `if (settingsRes.error)` / `if (storefrontRes.error)` `console.error`
  in `getPlatformOverviewData` so a future column mismatch is not silent again.

### Must not break

- KPI totals from `get_platform_overview_snapshot()` are untouched.
- `platform_status` still comes from `tenant_settings.settings_data`
  (`settings_data` stays in that select and now actually returns).
- After the fix the ticket-count loop **does** run - `openTicketsCount` /
  `urgentTicketsCount` become the real counts (0 today only because the query
  errors). This is the intended behaviour F-31 calls out, not a scope change.
- `getPlatformRevenueMetricsAction` consumes `getPlatformOverviewData`'s return
  value unchanged.
- A tenant with no `storefront_settings` row (e.g. provisioned but storefront
  never set up) still renders: name from `tenant.name` / `settings_data`, slug
  `''`, customDomain `null` - same as the current degraded output.

## Build steps

- [x] **Step 1 - fix the two failing selects.** In `getPlatformOverviewData`,
  split the `tenant_settings` select to real columns only, add a
  `storefront_settings` fetch to the `Promise.all`, map its rows, source
  `storeName` / `slug` / `customDomain` from it, and add error logging for both
  results. In `getDomainInfrastructureAction`, change the one select from
  `tenant_settings` to `storefront_settings`. Done when: `yarn check` + `yarn lint`
  + `yarn build` clean, and a local script shows both selects now succeed and
  `get_platform_overview_snapshot` is still consistent.
- [x] **Step 2 - fix `getMerchantContextAction`.** Add a `storefront_settings`
  read (by `tenant_id`, `maybeSingle`) to its `Promise.all`; take `name`
  fallback, `slug`, and `customDomain` from it. Done when: `yarn build` clean
  and the single-merchant object carries a real `slug` / `customDomain` when a
  `storefront_settings` row exists.

## Verify

- `yarn lint`, `yarn check`, `yarn build`, `yarn test` all clean.
- Local DB script: the `storefront_settings` selects for all three functions
  return without error; seed a `storefront_settings` row + a `settings_data`
  with a `support_tickets` array and confirm `getPlatformOverviewData`'s
  `openTicketsCount` reflects it.
- Manual: `/platform` (tenant rows show slug / custom domain / country; ticket
  KPI cards non-zero when tickets exist), `/platform/domains` (lists subdomains
  and custom domains), `/platform/merchants/[id]` (slug + custom domain shown).
- Code review: `grep -n "from('tenant_settings')" src/app/actions/platform.ts`
  shows no select of `store_name` / `slug` / `custom_domain` from that table.

## Findings

### platform-storefront-settings-read/F-13 [P2] closed - Platform overview fetches whole tables on every page load

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
own finding (now raised as F-31). `lint`/`check`/`build`/`test` all green.
Re-reviewed 2026-09-03 by /audit (scope: the F-13 delta as it landed in commit
`aef5399`, since the fix branch/spec were absorbed into that commit by later
work). The `orders`/`products` whole-table scans are gone - replaced by
`get_platform_overview_snapshot()` whose per-tenant and total counts were
verified byte-equal to the old JS aggregation against the local DB (orders 3 /
products 2 / gmv 850); the GMV `paid|completed|delivered` filter is preserved in
SQL; anon `rpc()` is denied (42501); the RPC is `security invoker` +
`REVOKE ALL FROM PUBLIC, anon, authenticated` + `GRANT EXECUTE TO service_role`.
`listUsers` is now the bounded `listAllPlatformAuthUsers` loop. Migration applies
clean on the current stack; types regenerate with no drift. The perf fan-out
this finding targeted is fixed; the `settings_data` sub-point is carved out to
F-31. Closed.

### platform-storefront-settings-read/F-31 [P1] closed - Two platform-console queries select tenant_settings columns that live on storefront_settings

**File:** src/app/actions/platform.ts:112
**Found:** 2026-09-03 by /audit (scope: platform.ts + F-13 delta; lens: security, quality)
**Why it matters:** `getPlatformOverviewData` (line 112) selects
`tenant_id, store_name, slug, store_email, business_phone, business_country, custom_domain, settings_data`
from `tenant_settings`, and `getDomainInfrastructureAction` (line ~620) selects
`tenant_id, store_name, slug, custom_domain` from the same table.
`store_name`, `slug`, and `custom_domain` are columns of `storefront_settings`,
not `tenant_settings` (confirmed against the live schema: `column
tenant_settings.store_name does not exist`). PostgREST rejects the whole select,
so `settingsRes.data` / `settings` come back `null` and the error is silently
swallowed (`|| []`, destructured `{ data }` with no throw). Consequences, all
currently shipping on `main`:
- `/platform` and `/platform/merchants`: per-tenant `slug`, `customDomain`, and
  `country` are always blank/`'GH'`; owner email/phone fall back to auth
  metadata only; **`openTicketsCount` / `urgentTicketsCount` KPIs are always 0**
  because the `settings_data.support_tickets` loop never runs.
- `/platform/domains`: `getDomainInfrastructureAction` builds its list from an
  empty `settings`, so the domain-infrastructure view shows nothing.
This predates F-13 (F-13 only conflated it) and is not a regression from the
F-13 change, which deliberately left the select byte-identical.
**Suggested fix:** Point the reads at the right table. `store_name` / `slug` /
`custom_domain` come from `storefront_settings` (join or a second select keyed
by `tenant_id`); keep `store_email` / `business_phone` / `business_country` /
`settings_data` on `tenant_settings`. Add an error check on `settingsRes.error`
so a future schema mismatch is not silent. Consider folding the values the
overview needs into `get_platform_overview_snapshot()` while you are there.
**Resolution:** Fixed in fix/platform-storefront-settings-read.
`getPlatformOverviewData`, `getMerchantContextAction`, and
`getDomainInfrastructureAction` now read `store_name` / `slug` / `custom_domain`
from `storefront_settings` (a `storefrontMap` keyed by `tenant_id` in the
overview; a `maybeSingle` join in the merchant view; a direct table swap in the
domains action). The `tenant_settings` select in the overview is narrowed to
`store_email, business_phone, business_country, settings_data` (all real
columns), and `settingsRes.error` / `storefrontRes.error` are now logged. Name
fallback order: `tenant.name` -> storefront `store_name` -> provisioning
`settings_data.store_name` -> literal. Verified against the local DB: all three
selects now succeed; with a seeded `support_tickets` array the overview's
`openTicketsCount` / `urgentTicketsCount` compute correctly (were always 0).
No migration, no type regen. `lint`/`check`/`build`/`test` (273) green.
Re-reviewed 2026-09-03 by /audit (scope: current; branch
`fix/platform-storefront-settings-read`, base `251b4d7`). All three reads now
target `storefront_settings` (which has `tenant_id` unique + an index, so the
`storefrontMap` and `maybeSingle` lookups are safe). The `getMerchantContextAction`
`Promise.all` destructure was re-checked against the array order (9 = 9,
aligned). Service-role reads stay behind `verifyPlatformStaff`; no new exposure
(`storefront_settings` is already publicly readable for active rows). The
knock-on effects are the intended un-breaking: `slug` search in
`MerchantsClient` now works, ticket KPIs compute, `country` populates from
`business_country` (`'Ghana'` for provisioned tenants - display only, no
consumer matches `=== 'GH'`). No new defect. Closed.
