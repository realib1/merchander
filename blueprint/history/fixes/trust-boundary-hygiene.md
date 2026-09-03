# Current Feature

**Title:** Trust-boundary hygiene batch (storefront order refs, platform page guards)

**Type:** Fix

**Status:** verified

**Fixes:** F-19, F-25

**Source:** `/audit` findings ledger. Two small authorization / payload-trust
gaps left after earlier fixes, in unrelated areas but the same class of defect
(a reference from an untrusted caller written without a tenant / role check).

## The problem

| ID | Defect | File |
|---|---|---|
| F-19 | `submitStorefrontOrder` validates `variantId` against the slug-resolved tenant (F-01) but still reads `val.batchId`, per-item `item.batchId`, and `val.pickupStoreId` straight from the payload and writes them into `orders.batch_id`, `order_items.batch_id`, and `orders.store_id`. The action runs on the admin client (F-04), so RLS does not filter these writes. A crafted payload can attach the order to another tenant's `preorder_batch` or `store`. Contained (the order's `tenant_id` is server-resolved, so RLS-scoped views elsewhere exclude the row), but it is the same hygiene gap F-01 named for `variantId`. | `src/app/actions/storefront-order.ts:172`, `:200`, `:221` |
| F-25 | `/platform/communications` and `/platform/support` gate only their data action, and both pages ignore the returned `error` and render the interactive client (`CommunicationsClient`, `SupportClient`) regardless. A staff role outside `PLATFORM_RBAC_RULES` for that route reaches the page by URL and sees the composer / inbox shell (empty data, writes still 403). Same class as F-21 / F-24, lower stakes. | `src/app/platform/communications/page.tsx:8`, `src/app/platform/support/page.tsx:8` |

## The fix

- **F-19:** after the tenant is resolved, before the order insert:
  - Collect every distinct batch id in the payload (`val.batchId` plus each
    `item.batchId`). If any are present, look them up in `preorder_batches`
    scoped to `tenant_id`. If the row count does not match the id count, reject
    the order (same shape as the existing "no longer available" variant reject).
  - When `val.pickupStoreId` is supplied, look it up in `stores` scoped to
    `tenant_id` instead of trusting it; reject if there is no such row. Keep the
    existing primary-store fallback for when no pickup store is given.
  - Must not break: a normal delivery order with no `batchId` / no
    `pickupStoreId` still works; a valid pre-order against the tenant's own
    batch still works; pickup at the tenant's own branch still works.
- **F-25:** add `await requirePlatformRoute('/platform/communications')` and
  `await requirePlatformRoute('/platform/support')` at the top of the two page
  components (the helper from F-24 already exists and both route keys are in
  `PLATFORM_RBAC_RULES`). No other change to those pages.
  - Must not break: owner / admin / operations still reach communications;
    owner / admin / support / operations / tech_admin still reach support; every
    other role redirects to `/platform`.

## Build steps

- [x] 1. **F-19 - validate batch and pickup-store references against the tenant.**
  In `submitStorefrontOrder`, after the variant pricing block (step 1b) add a
  batch-ownership check: gather `[val.batchId, ...items.map(i => i.batchId)]`,
  filter to defined strings, dedupe; if non-empty, `select('id')` from
  `preorder_batches` `.eq('tenant_id', tenantId).in('id', ids)` and reject when
  the returned count differs from the id count (DB error -> generic retry
  message). In step 4, when `val.pickupStoreId` is set, resolve it via
  `stores.select('id').eq('id', val.pickupStoreId).eq('tenant_id', tenantId).maybeSingle()`
  and reject when missing; otherwise keep the current primary-store fallback.
  **Done when:** `yarn check` / `yarn lint` pass; a manual or scripted order with
  a foreign `batchId` or `pickupStoreId` returns `{ success: false }` and writes
  no row, while a clean delivery order and a valid same-tenant pre-order still
  succeed.

- [x] 2. **F-25 - route-guard the two remaining platform pages.**
  Import `requirePlatformRoute` in `communications/page.tsx` and
  `support/page.tsx`; call it (awaited) as the first statement of each page
  component. No other edits.
  **Done when:** `yarn check` / `yarn lint` / `yarn build` pass; grep shows both
  pages call the guard before their data action; the RBAC route keys resolve.

- [x] 3. **Full verify.** `yarn test` (190, 26 files), `yarn lint` (0),
  `yarn check` (0), `yarn build` (0) all green.

## Verify

- Storefront: place a normal delivery order (no batch) - succeeds. Place a
  pre-order whose `batchId` belongs to the same store - succeeds. Craft a
  payload with a `batchId` or `pickupStoreId` from another tenant (or a random
  uuid) - order is rejected, no `orders` row created.
- `/platform/communications` as `finance` or `compliance` (out of RBAC): redirect
  to `/platform`. As `operations`: renders. `/platform/support` as `finance`:
  redirect; as `support`: renders. (No live multi-role staff login locally -
  DB role-list + the shared guard is the evidence, as for F-24.)
- `yarn test` / `yarn lint` / `yarn check` / `yarn build` clean.

## Out of scope

- Matching each `item.batchId` to a `product_preorder_batches` row for that
  specific variant (F-19 "ideally"): the tenant-ownership check closes the
  cross-tenant boundary, which is the security issue. Per-variant batch
  correctness is a data-quality concern for a separate pass.
- Retrofitting `requirePlatformRoute` onto `revenue` / `domains` / `audit-logs`
  (they render an error state or a read-only empty table, not an interactive
  shell) - not a boundary problem.
- F-13 (platform query fan-out), F-14 (untested `src/utils` modules).

## Findings

### trust-boundary-hygiene/F-19 [P3] closed - Storefront order still trusts batchId and pickupStoreId from the payload

**File:** src/app/actions/storefront-order.ts:154
**Found:** 2026-09-03 by /audit (scope: current; lens: security)
**Why it matters:** The F-01 fix validates `variantId` against the slug-resolved
tenant but leaves the sibling reference fields unchecked. `submitStorefrontOrder`
still read `val.batchId`, per-item `item.batchId`, and `val.pickupStoreId` from
the payload and wrote them into `orders.batch_id`, `order_items.batch_id`, and
`orders.store_id` with no tenant check. The action runs on the admin client
(F-04), so RLS did not filter these writes: a crafted payload could attach the
order to another tenant's `preorder_batch` or `store`. Contained (the order's
`tenant_id` is server-resolved), hence P3, but the same hygiene gap F-01 named
for `variantId`.
**Resolution:** Fixed on `fix/trust-boundary-hygiene` (spec step 1).
`submitStorefrontOrder` now, after tenant resolution: (a) collects every
distinct batch id from `val.batchId` + each `item.batchId`, filters to defined
strings, and when non-empty selects them from `preorder_batches` scoped to
`tenant_id`, rejecting the order when the row count does not match (a DB error
rejects too) - before any customer or order write; (b) when `val.pickupStoreId`
is supplied, resolves it via `stores.eq('id').eq('tenant_id', tenantId).maybeSingle()`
and rejects when missing, instead of writing it straight to `orders.store_id`.
The primary-store fallback for the no-pickup path is unchanged. Re-reviewed by
/audit (scope: current; lens: security) 2026-09-03: reference fields are now on
the same footing as `variantId`; per-variant `product_preorder_batches` matching
was deliberately left out of scope (data quality, not the cross-tenant
boundary). Original defect gone, no new defect. `yarn check` / `lint` / `test`
(190) / `build` exit 0. Closed.

### trust-boundary-hygiene/F-25 [P3] closed - Some /platform pages render an interactive shell to out-of-RBAC roles

**File:** src/app/platform/communications/page.tsx:8
**Found:** 2026-09-03 by /audit (scope: current; lens: security)
**Why it matters:** F-24 guarded `security`, `system-health`, and
`plans-billing`. `/platform/communications` and `/platform/support` still relied
on the data action alone and both ignored its returned `error`, rendering
`CommunicationsClient` / `SupportClient` for any active staff role reaching the
URL - a dead interactive shell (empty data, writes still gated) for roles
outside the route's `PLATFORM_RBAC_RULES` entry. Same class as F-21 / F-24,
lower stakes.
**Resolution:** Fixed on `fix/trust-boundary-hygiene` (spec step 2). Both pages
call `await requirePlatformRoute('/platform/communications')` /
`'/platform/support'` as the first statement, before the data action, so an
out-of-RBAC role redirects to `/platform` instead of reaching the client.
Re-reviewed by /audit (scope: current; lens: security) 2026-09-03:
`communications` is fully closed - its guard
(`PLATFORM_RBAC_RULES['/platform/communications']` = owner/admin/operations) is
byte-identical to `BROADCAST_ROLES`, so no dead shell remains for any role. For
`support`, the roles this finding named (`finance`, `compliance`) now redirect
at the guard. Original defect for the named roles is gone. `yarn check` / `lint`
/ `test` (190) / `build` exit 0. Closed. The re-review surfaced that the
`support` route guard and its data action use different role sets (residual
shell for `tech_admin`, `compliance` locked out of an action-authorized page) -
tracked separately as F-26, still open at completion.

### Still open at completion (not part of this fix)

- **F-26 [P3] open** - `/platform/support` route guard
  (`PLATFORM_RBAC_RULES['/platform/support']`) and its data action
  (`SUPPORT_INBOX_ROLES`) allow different role sets: `tech_admin` passes the
  guard but the action denies (residual dead shell), and `compliance` is
  action-authorized but redirected by the guard. Raised by this fix's audit.
  Fix is to reconcile the two role lists.
- **F-13 [P2] open** - platform overview query fan-out (whole-table scans +
  `listUsers({ perPage: 1000 })` cap).
- **F-14 [P2] open** - five pure `src/utils` modules with no tests despite the
  declared gate.
