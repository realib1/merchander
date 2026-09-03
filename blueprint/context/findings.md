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

### F-15 [P2] open - Anonymous order creation is unthrottled

**File:** src/app/actions/storefront-order.ts:47
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** The action is reachable by any anonymous visitor and creates
`customers`, `customer_identities`, `orders`, `order_items`, and
`order_access_tokens` rows per call, with no rate limit, captcha, or duplicate
window. It also creates a `stores` row when a tenant has none (line 128), so an
unauthenticated caller can cause store creation. A script can fill a merchant's
order board and customer list.
**Suggested fix:** Rate-limit per IP and per normalised phone, and never create a
`stores` row from an anonymous path; fail the order instead.
**Resolution:**

### F-16 [P2] open - Phone number alone unlocks order tracking

**File:** src/app/actions/storefront-tracking.ts:50
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** `getStorefrontOrderTracking` accepts a valid token **or** a
matching phone number. The order short id is short and sequential-looking and a
Ghanaian mobile number is low-entropy and often public, so the phone branch is
close to guessable. It exposes delivery address, items, and totals.
**Suggested fix:** Treat the token as the real authenticator. For the phone
branch, add rate limiting and lockout, and consider a one-time code to the number
instead of a direct match.
**Resolution:** Still open. Re-reviewed by /audit (scope: current) 2026-09-03:
the F-04 fix moved this action onto the admin client, so the phone-only branch is
now a functioning path where RLS previously made it return nothing. Severity kept
at P2 (attacker needs both a valid `ORD-XXXXXX` and the customer's phone) but the
exposure is now real, not theoretical.

### F-17 [P3] open - Session reset is a state-changing GET

**File:** src/app/api/auth/reset/route.ts:4
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** A GET clears every cookie, so any third-party page can force a
merchant to log out with an `<img>` tag. Impact is denial of session only, but a
mutation behind GET is the wrong shape.
**Suggested fix:** Make it POST with the framework's CSRF handling, or move it to
a Server Action.
**Resolution:**

### F-18 [P3] open - Active branch cookie is written without validation

**File:** src/app/actions/branch.ts:6
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** `setActiveBranch` writes any caller-supplied string to
`merchander_active_store` with no check that the id is a store in the caller's
tenant. Consumers filter with the RLS-bound client, so cross-tenant reads should
still be refused, but the value is untrusted input that reaches query builders.
**Suggested fix:** Verify the store belongs to the caller's tenant before setting
the cookie.
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

### F-20 [P3] open - Telegram secret check is a new pure security function that is neither shared nor tested

**File:** src/app/api/webhooks/telegram/route.ts:10
**Found:** 2026-09-03 by /audit (scope: current; lens: tests)
**Why it matters:** The channel-webhook-auth fix extracts the WhatsApp signature
check to `src/utils/webhook-signature.ts` with a 7-case test, but the sibling
Telegram check (`secretTokenValid`, a constant-time header compare) stays inline
in the route and has no test. The test gate is on, both are pure logic on a
security path, and F-14 already flags this exact drift. The function is correct
and runtime-verified (403 without the header, 200 with it), so this is a
regression-risk and consistency issue, not a live defect.
**Suggested fix:** Move a generic `timingSafeStringEqual(a, b)` into
`webhook-signature.ts`, use it from both routes, and add a focused test.
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
