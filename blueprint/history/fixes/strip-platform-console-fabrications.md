# Current Feature

**Title:** Strip fabricated data from the platform console

**Type:** Fix

**Status:** verified

**Source:** Platform Console Reality Check (review artifact, 2026-09-02) — Section A
findings plus the Section D "Strip" phase. Not an `/audit` ledger item, so there is
no `Fixes:` stamp; the review is the record.

## The problem

The `/platform` console renders values it never measured. When real data is
missing it substitutes a plausible literal instead of saying nothing, so an
operator cannot tell a working surface from a decorative one.

| # | What it claims | What the code does | File |
|---|---|---|---|
| 1 | Four green ✓ compliance guarantees | Hardcoded array. MFA is never enforced (`mfa_enabled` only ever written `false`); "AES-256 GCM" appears nowhere in `src/` except this string; "RLS 100%" is unverified | `platform/security/page.tsx:14` |
| 2 | "Storage Allocated — Media, CDN & Assets" | `productCount * 1.8 + 14` | `actions/platform.ts:846` |
| 3 | "Database Latency — PostgreSQL Direct Probe", always green | Wall time of 4 PostgREST HTTP calls; card hardcodes `text-emerald-500` | `platform.ts:838`, `system-health/page.tsx:27` |
| 4 | Per-merchant connected channels & payment providers | `[] → ['WhatsApp']` fallback; `connectedProviders` hardcoded `['Paystack MoMo','Hubtel']` for every tenant | `platform.ts:462` |
| 5 | Net revenue, churn %, revenue-over-time | `MRR * 0.975`; literal `0`; a single synthetic datapoint. No billing integration exists — `price_monthly` is a typed-in number | `platform.ts:588` |
| 6 | DNS status, SSL status, target host, cert expiry, "last verified" | All literals. `lastVerifiedAt: new Date()` reports "verified just now" having verified nothing | `platform.ts:648` |
| 7 | Tier prices on Overview and in the plan-override dropdown | Hardcoded in JSX, duplicating `platform_plans.price_ghs` | `platform/page.tsx:159`, `MerchantsClient.tsx:460` |
| 8 | Five commercial plans | 100-line `fallbackPlans` array renders fake plans when the table is empty | `plans-billing/page.tsx:10` |
| 9 | Tier badge / tier distribution | `sub?.tier \|\| 'starter'` — a tenant with no subscription row counts as a paying Starter at price 0 | `platform.ts:242`, `:456` |

## The fix

Delete every unmeasured value. Where the underlying data is real but the status
is not (Domains), keep the data and drop the status. Where nothing real backs the
field (storage, net revenue, churn, providers), remove the field from the type,
the action, and the UI together so it cannot come back.

Governing rule for this fix and after: **never render a value that was not
measured.** Prefer an explicit "not instrumented" state over a plausible default.

Must not break:

- Genuinely real surfaces stay: incidents, broadcasts, staff RBAC, audit-log
  table, merchant registry, tier *counts*, MRR arithmetic from real
  `tenant_subscriptions` rows.
- `verifyPlatformStaff` role gates on every touched action are unchanged.
- `yarn test`, `yarn lint`, `yarn check`, `yarn build` all green.

## Build steps

- [x] 1. **Security page — delete the fabricated compliance cards.** Remove the
  `securityPolicies` array and the grid that renders it from
  `src/app/platform/security/page.tsx`. Keep `StaffManagementClient` (real).
  Leave no replacement copy asserting anything unverified.
  *Done when:* the page renders only real staff/RBAC management; no hardcoded
  security claim remains anywhere in `src/app/platform/`.

- [x] 2. **System Health — remove the invented storage metric, make latency
  honest.** Drop `storageUsageMb` from the return type of
  `getPlatformInfrastructureStatus` and its MetricCard. Relabel the latency card
  to name what it measures (round-trip of the platform's own queries, not a DB
  probe) and drive `subtitleColor` off a threshold instead of a hardcoded
  emerald.
  *Done when:* no storage card; latency card renders non-green above its
  threshold (verify by temporarily forcing a high value, then revert).

- [x] 3. **Merchant context — stop inventing integrations.** In
  `getMerchantContextAction`, return `connectedChannels` as-is (empty allowed) and
  delete `connectedProviders` from the action, from `PlatformTenant` in
  `src/types/platform.ts`, and from the merchant detail page.
  *Done when:* a merchant with no `channel_connections` rows shows an empty
  channels state, not "WhatsApp"; `connectedProviders` appears nowhere in `src/`.

- [x] 4. **Revenue — keep only what is measured.** Remove `netRevenueGHS`,
  `churnRatePercent`, `revenueByPeriod`, and the duplicate `grossPlatformRevenue`
  from `PlatformRevenueMetrics`, from `getPlatformRevenueMetricsAction`, and from
  `revenue/page.tsx` (including the churn card and the period table). Relabel MRR
  as **Contracted MRR** with a subtitle stating no billing integration is
  connected. Source `planName` in `revenueByPlan` from `platform_plans` rather
  than hardcoded strings.
  *Done when:* the page shows only Contracted MRR, projected ARR, ARPU, failed
  billing count, and per-plan breakdown with DB-sourced names; no fabricated
  figure remains.

- [x] 5. **Domains — keep the real list, drop the fake status.** Remove
  `dnsStatus`, `sslStatus`, `targetHost`, `sslExpiresAt`, and `lastVerifiedAt`
  from `DomainInfrastructureItem` and `getDomainInfrastructureAction`; the
  tenant, domain and type fields are real and stay. Replace the status columns in
  `domains/page.tsx` with a single notice that DNS and certificate verification
  is not yet instrumented.
  *Done when:* the page lists configured subdomains and custom domains with no
  status claim; no `new Date()`-derived "verified" timestamp remains.

- [x] 6. **Plans — one source of truth.** Delete the `fallbackPlans` array from
  `plans-billing/page.tsx` and render an empty state when `platform_plans` is
  empty. Fetch plans in `platform/page.tsx` for the Commercial Tiers panel and in
  `merchants/page.tsx` to pass into `MerchantsClient` for the plan-override
  dropdown, replacing both hardcoded price lists.
  *Done when:* changing `price_ghs` in the database changes every price shown in
  the console; an empty `platform_plans` table renders an empty state, not five
  invented plans.

- [x] 7. **Unprovisioned tenants stop counting as paying.** Add `'none'` to the
  subscription tier union in `src/types/platform.ts` and to the `tierCounts` /
  `tierRevenue` records. Replace `sub?.tier || 'starter'` at `platform.ts:242`
  and `:456` with `'none'`, render it distinctly in the merchant registry and
  tier panel, and add an Overview attention item when any tenant is
  unprovisioned.
  *Done when:* a tenant with no `tenant_subscriptions` row shows as unprovisioned
  everywhere, is excluded from paid-tier counts, and raises an attention item;
  `yarn check` passes with the widened union handled at every site.

## Verify

- `yarn test`, `yarn lint`, `yarn check`, `yarn build` all clean.
- Grep proves the deletions: no `securityPolicies`, `storageUsageMb`,
  `connectedProviders`, `netRevenueGHS`, `churnRatePercent`, `fallbackPlans`,
  `dnsStatus`, or `|| 'starter'` remains in `src/`.
- `/platform` — tier panel prices match `platform_plans` rows; unprovisioned
  tenants surface as an attention item.
- `/platform/revenue` — MRR reads "Contracted"; no churn or period table.
- `/platform/domains` — real domains listed, explicit not-instrumented notice.
- `/platform/security` — staff management only.
- `/platform/system-health` — no storage card; latency labelled honestly.
- `/platform/merchants/[id]` — a merchant with no channel connections shows
  empty, not WhatsApp.

## Follow-ups (not this fix)

- **Merchant-side subscription page disagrees with the platform.** Found while
  verifying: `src/app/actions/settings-subscription.ts:48` reads the tier from
  `tenant_settings.settings_data.subscription` JSON — **not** `tenant_subscriptions`
  — defaults it to `'starter'`, and carries its own hardcoded limits/price matrix
  using slugs `starter | pro | enterprise`, which do not match the platform's
  `free | starter | growth | business | enterprise`. The merchant and the platform
  therefore report different plans and prices for the same tenant. Out of scope
  here (merchant surface, different data source); needs its own decision on which
  source of truth wins.
- **Govern phase** (next `/fix`): reason + ticket gate on Merchant Context,
  session-scoped audit rows with exit and duration, audit-log error surfacing and
  filters, `platform_audit_logs` immutability trigger, settle staff MFA.
- **Instrument phase**: real `platform_support_tickets` table; webhook-boundary
  counters feeding new Payments & Providers and Integrations pages; real DNS and
  certificate probes to bring Domains back.
- Move `is_platform_staff()` into the `private` schema (Supabase advisor warning).
