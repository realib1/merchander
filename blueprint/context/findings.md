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

### F-21 [P2] fixed - Widening the plan-read gate leaves /platform/plans-billing with no role guard

**File:** src/app/platform/plans-billing/page.tsx:8
**Found:** 2026-09-03 by /audit (scope: current; lens: security)
**Why it matters:** The F-07 fix regated `getPlatformPlansAction` from
owner/admin to all seven staff roles (correct: the plan catalogue is shown on
`/platform` and `/platform/merchants`). But `/platform/plans-billing` has **no
route-level RBAC** - `platform/layout.tsx` only checks "active platform staff",
and `PLATFORM_RBAC_RULES['/platform/plans-billing']` is enforced nowhere except
`PlatformNav` link visibility. Previously the owner/admin gate *inside*
`getPlatformPlansAction` incidentally blocked the page for other roles (they got
`{ plans: [], error: 'Forbidden' }` and an error box). After the change, an
`operations`/`support`/`finance`/`tech_admin`/`compliance` user who navigates to
`/platform/plans-billing` by URL now sees the full `PlansBillingClient` with real
plan data and interactive Create/Edit/Toggle controls; the write actions still
403 on click (their gate is unchanged), so this is not privilege escalation and
the data is non-sensitive by F-07's own reasoning - but it breaks the spec's
stated "must not break" invariant ("`/platform/plans-billing` as `operations`:
still 403") and shows an editor full of dead controls to five roles.
**Suggested fix:** Add an explicit guard at the top of `PlansBillingPage` (and/or
the plan-write section of the client): `await verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/plans-billing'])`
wrapped to `redirect('/platform')` on throw, so the route 403s for non-admins
independently of the read action. Keeps the F-07 widening for the overview and
merchants pages while restoring the plans-billing route boundary.
**Resolution:** Fixed on `fix/platform-console-consolidation` (spec step 4).
`PlansBillingPage` now runs
`try { await verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/plans-billing']) } catch { redirect('/platform') }`
before the plan read, so the route redirects away for the five non-owner/admin
roles independently of the widened read action; owner/admin render and write
paths are unchanged. `yarn check` / `yarn lint` / `yarn build` / `yarn test`
(184) all clean. No live non-admin staff login was available, so route behavior
is inferred from the shared `verifyPlatformStaff` gate (used by every other
platform action) plus the green build. Awaiting `/audit` re-review to close.

### F-22 [P3] open - Order-tracking throttle also rate-limits the valid-token path

**File:** src/app/actions/storefront-tracking.ts:63
**Found:** 2026-09-03 by /audit (scope: current; lens: security)
**Why it matters:** The F-16 fix enforces `track:ip:<ip>` at 12 / 10 min at the
top of `getStorefrontOrderTracking`, before the token check. The storefront
order page (`store/[slug]/orders/[orderId]/page.tsx:40`) calls this action on
every SSR render with the token from the URL. A customer who holds a valid
256-bit tracking token and reloads their tracking link more than 12 times in 10
minutes (plausible while waiting on a delivery) is locked out of their own
order for a few minutes. The token path is not a brute-force risk, so it does
not need the same ceiling as the guessable phone path.
**Suggested fix:** Either raise the tracking limit to ~30 / 10 min (clears
realistic reload behaviour, still stops phone enumeration), or only enforce the
throttle on the phone-auth fallback (check the token first; throttle before the
`phone` comparison). The limit change is the smaller diff.
**Resolution:**

### F-23 [P3] open - /api/auth/reset redirect and origin check have minor residuals

**File:** src/app/api/auth/reset/route.ts:20
**Found:** 2026-09-03 by /audit (scope: current; lens: security)
**Why it matters:** Two small issues left by the F-17 fix, neither a security
regression. (1) The handler returns `NextResponse.redirect(new URL('/login', ...))`,
which is a `307` — a browser following it re-issues the request as `POST /login`.
It happens to render 200 today (App Router pages answer POST), but a `303 See
Other` is the correct status for "this POST changed state, now GET that page".
(2) The cross-origin check compares the `Origin` header against
`new URL(request.url).origin`. On the stated Vercel-direct deployment these
match, but behind a reverse proxy or custom-domain edge where `request.url`
carries an internal host, a legitimate same-origin `POST` would get a false
`403`. It fails safe (deny, not bypass) and there is no in-code caller, so
impact is low; `Sec-Fetch-Site` is the primary guard regardless.
**Suggested fix:** Use `NextResponse.redirect(url, 303)`, and either compare
`Origin` against the `host` / `x-forwarded-host` header or drop the `Origin`
branch and rely on `POST` + `Sec-Fetch-Site` alone.
**Resolution:**
