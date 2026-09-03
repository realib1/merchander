# Current Feature

**Title:** Close the unauthenticated-boundary P0s (payments and storefront)

**Type:** Fix

**Status:** verified

**Fixes:** F-02, F-03, F-01, F-04, F-05

**Source:** `/audit full` on 2026-09-03. Takes the P0 cluster plus F-05, which
lives inside the same Hubtel handler and becomes exploitable the moment F-02
makes that handler's writes land.

## The problem

Every surface where an unauthenticated caller reaches the database was built
against the wrong Supabase client, and two of them were built without an
authenticity check. The four defects are entangled, so repairing one in isolation
makes another worse.

| ID | Defect | File |
|---|---|---|
| F-02 | Payment webhooks use the cookie-bound anon client. No session means `auth.uid()` is null, the `payments` insert policy denies the row, the result is never checked, and the route returns `200 success`. The provider stops retrying and the payment is lost. | `api/webhooks/paystack/route.ts:35`, `hubtel/route.ts:31` |
| F-03 | The Hubtel route has no authenticity check at all. `validateHubtelAuth` already exists at `lib/payments/hubtel.ts:51` and is never called. | `api/webhooks/hubtel/route.ts:4` |
| F-05 | `clientReference` is split on `_` and interpolated into `.ilike('id', '<prefix>%')` unescaped, so `ord_%_x` matches every order and `.limit(1)` pays an arbitrary one. | `api/webhooks/hubtel/route.ts:52` |
| F-01 | `submitStorefrontOrder` takes `unitPrice` from the browser and writes it to `order_items.unit_price`. The server never reads `product_variants.price`. `variantId` is never checked against the tenant. | `actions/storefront-order.ts:141` |
| F-04 | The anonymous storefront write and tracking paths also use the anon client. `add_table_grants.sql` grants `orders`, `customers`, and `stores` to `authenticated` only, and no policy admits anon, so checkout may be failing outright for every visitor. Unconfirmed without database access. | `actions/storefront-order.ts:47`, `storefront-tracking.ts:47` |

### Why the order matters

Two couplings drive the build order and must not be broken:

- **F-03 before or with F-02.** Today the Hubtel route is unauthenticated but
  inert, because its writes are refused. Fixing the client first, alone, converts
  it into an open endpoint that inserts completed payments for anyone.
- **F-01 before or with F-04.** The remedy for F-04 is the service-role client,
  which bypasses RLS. Landing that while the server still trusts a
  client-supplied price removes the last thing standing between a tampered
  payload and a written order.

There is also a third trap in F-04's remedy: `submitStorefrontOrder` currently
takes `tenantId` **from the client payload**. Under RLS that is contained. Under
the service-role client it becomes a cross-tenant write primitive, so the tenant
must be resolved server-side from the storefront slug before the client changes.

## The fix

Authenticate at the boundary, authorize with the right client, and never trust a
number the browser supplied.

- Webhooks authenticate first, then write with `createAdminClient()`, and every
  write result is checked. A failed write returns 5xx so the provider retries
  instead of recording a false delivery.
- The storefront prices orders from `product_variants` and resolves the tenant
  from the slug, never from the payload.

Must not break:

- Paystack signature verification stays exactly as it is (already correct).
- The idempotency checks on `transaction_ref` in both routes stay.
- The webhook contract with providers stays: a genuinely ignorable event still
  returns 200, only a real failure returns 5xx.
- Anonymous catalog browsing through `storefront-public.ts` is already correct
  and is not touched.
- `yarn test`, `yarn lint`, `yarn check`, `yarn build` all green.

## Build steps

- [x] 1. **Authenticate the Hubtel webhook.** Call `validateHubtelAuth` on the
  `authorization` header as the first action in the handler, before reading or
  parsing the body, and return 401 on failure. Switch its comparison to
  `crypto.timingSafeEqual` to match `validatePaystackSignature`. Fail closed when
  `HUBTEL_CLIENT_ID` or `HUBTEL_CLIENT_SECRET` is unset.
  *Done when:* a POST with no or wrong `authorization` gets 401 and touches no
  database code path; a correct header proceeds.

- [x] 2. **Give both webhooks the service-role client and checked writes.**
  Replace `createClient()` with `createAdminClient()` in the Paystack and Hubtel
  routes. Capture and inspect `error` on every insert and update. On a write
  failure, log and return 500 so the provider retries. Keep the existing
  idempotency short-circuits returning 200.
  *Done when:* `grep -r "createClient" src/app/api/webhooks/` is empty, no write
  result is discarded, and a forced write failure returns 500 rather than
  `success`.

- [x] 3. **Match the Hubtel order exactly.** Replace the `ilike` prefix match with
  `.eq('short_id', orderShortId)`. Treat "no order found" as an explicit
  non-success response rather than falling through to `tenantId === null`.
  *Done when:* no `ilike` remains in the route, and a reference containing `%` or
  `_` resolves to no order instead of an arbitrary one.

- [x] 4. **Price the storefront order on the server.** Remove `unitPrice` from
  `orderPayloadSchema`, from `StoreOrderPayload` in `src/types/storefront.ts`, and
  from the `StoreCartDrawer` call site. Resolve `tenantId` server-side from
  `tenantSlug` via `storefront_settings`, and stop accepting it from the payload.
  Fetch the submitted `variantId`s filtered by that tenant, reject the order when
  any id does not resolve, and compute `unit_price` and `total_amount` from the
  fetched rows.
  *Done when:* a payload with an altered price produces an order at the catalogue
  price; a payload naming another tenant's variant is rejected; the cart drawer
  still completes a normal order.

- [x] 5. **Settle F-04 with evidence, then act.** Determine whether `anon` can
  reach `orders`, `customers`, and `stores` in the linked project
  (`select grantee, privilege_type from information_schema.role_table_grants
  where table_name in ('orders','customers','stores');`, or one real storefront
  order). If anon is blocked, move `submitStorefrontOrder` and
  `getStorefrontOrderTracking` onto `createAdminClient()`, keeping the
  server-resolved tenant scope from step 4 on every query. If anon is not
  blocked, change no code and record the evidence so `/audit` can rule F-04
  invalid.
  *Done when:* the grant state is recorded in this spec with the command or
  observation that produced it, and the matching remedy is applied or explicitly
  declined.

  **Evidence (local DB, 2026-09-03):** table grants for `anon` on
  `orders`, `order_items`, `customers`, `stores`, `payments` are all present
  (SELECT/INSERT/UPDATE/DELETE), so the grant-based reasoning in F-04 was wrong.
  RLS is the real gate: as role `anon`, `insert into customers` raises
  `new row violates row-level security policy`, and `select count(*) from orders`
  returns 0 while `postgres` sees 3. So the anonymous storefront write and
  tracking paths were non-functional in production. **Remedy applied:**
  `submitStorefrontOrder`, `getStorefrontOrderTracking`, and `lookupCustomerOrder`
  now use `createAdminClient()`. Every query is scoped to a tenant resolved
  server-side from the storefront slug, never from a client-supplied id.
  `lookupCustomerOrder`'s signature changed from `(tenantId, query)` to
  `(tenantSlug, query)` and its `%short_id%` LIKE became an exact match, since
  RLS no longer backstops it.

- [x] 6. **Delete the duplicate order endpoint and its dead client.** Found while
  building step 4: `submitPublicStoreOrder` in `actions/storefront-public.ts:290`
  is a second order path with the same defect, but worse. It runs on
  `getStorefrontSupabase()`, which is `createAdminClient()`, so RLS never
  applies, and it takes both `tenantId` and `unitPrice` straight from the
  payload. No component calls it, but it is a `'use server'` export, so Next.js
  publishes it as an invocable endpoint. Delete the function and its re-export
  from `actions/storefront.ts`; `submitStorefrontOrder` supersedes it. Also
  delete `StoreOrderTrackingModal.tsx`, dead UI (nothing renders it) that was the
  only other caller of `lookupCustomerOrder` and now passes a tenant id where a
  slug is expected.
  *Done when:* `submitPublicStoreOrder` and `StoreOrderTrackingModal` appear
  nowhere in `src/`, and the storefront still orders through
  `submitStorefrontOrder`.

## Verify

- `yarn test`, `yarn lint`, `yarn check`, `yarn build` all clean.
- Grep proves the boundary changes: no `createClient` under
  `src/app/api/webhooks/`, no `ilike` in the Hubtel route, no `unitPrice` in the
  storefront order payload or its type.
- Hubtel route: unauthenticated POST returns 401; authenticated POST with a
  reference containing `%` finds no order.
- Storefront: place an order from `/store/[slug]` with the browser devtools
  network payload edited to halve a price, and confirm the created order carries
  the catalogue price.
- Storefront: place one normal order end to end and confirm the row lands, the
  tracking token works, and the order appears on `/dashboard/orders`.
- Paystack: replay a `charge.success` payload with a valid signature against a
  local server and confirm a `payments` row is written rather than a silent 200.

## Out of scope

- F-06 (Paystack metadata trust) and F-09, F-10 (WhatsApp and Telegram
  signatures) are P1 and get their own fix.
- F-11, the subscription source-of-truth split, needs a product decision first.
- Rate limiting (F-15) and the tracking authenticator (F-16) are P2.

## Findings

### unauthenticated-boundary-p0s/F-01 [P0] closed - Storefront order accepts client-supplied prices

**File:** src/app/actions/storefront-order.ts:141
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** `orderPayloadSchema` accepts `items[].unitPrice` from the
browser and validates only `nonnegative()`. Line 141 computes `total_amount`
from it and line 173 writes it straight into `order_items.unit_price`. The
server never reads `product_variants.price`. An anonymous shopper editing the
payload buys any item at any price. `variantId` is also never checked to belong
to `tenantId`, so a variant from another merchant can be added to the order.
**Suggested fix:** Drop `unitPrice` from the payload. Fetch the variants by id
filtered on `tenant_id`, reject any id that does not resolve, and price the
order server-side from the fetched rows.
**Resolution:** fixed in fix/unauthenticated-boundary-p0s step 4. `unitPrice`
removed from `orderPayloadSchema`, `StoreOrderPayload`, and the `StoreCartDrawer`
call. `submitStorefrontOrder` now fetches `product_variants` with
`products!inner(tenant_id)` filtered to the slug-resolved tenant, rejects the
order if any submitted `variantId` does not resolve, and prices from
`product_variants.price`. Verified against the local REST API: the filter returns
the priced rows for the correct tenant and `[]` for a foreign tenant id.
Re-reviewed by /audit (scope: current) 2026-09-03: price tampering and
foreign-variant injection both removed. The sibling reference fields `batchId`
and `pickupStoreId` are still taken from the payload unvalidated; split to F-19.

### unauthenticated-boundary-p0s/F-02 [P0] closed - Payment webhooks write through the anon RLS client and never check the result

**File:** src/app/api/webhooks/paystack/route.ts:35
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** Both payment webhooks call `createClient()`, the cookie-bound
anon client. A webhook POST from Paystack or Hubtel carries no session, so
`auth.uid()` is null. The `payments` insert policy requires
`tenant_id in (select public.get_auth_user_tenant_ids())`
(20260821210000_orders_payments.sql:62), which is empty for an anonymous caller,
so the insert is refused. Every insert and update result is discarded without an
error check (paystack route.ts:180, hubtel route.ts:66), and the handler returns
200 with `status: 'success'`. The provider records the callback as delivered and
does not retry, so a real confirmed payment is lost silently. The same applies to
the `tenant_settings` updates in cases 1 and 2.
**Suggested fix:** Use `createAdminClient()` in both webhook routes, which is the
documented client for flows with no user session, and check the `error` on every
write before returning 200.
**Resolution:** fixed in fix/unauthenticated-boundary-p0s step 2. Both routes now
use `createAdminClient()`. Every insert and update captures `error`; on failure
the route logs and returns 500 so the provider retries instead of recording a
false delivery. Idempotency short-circuits still return 200. `grep createClient
src/app/api/webhooks/` is empty.
Re-reviewed by /audit (scope: current) 2026-09-03: all four Paystack writes and
all Hubtel writes now branch on `error`; confirmed against the diff.

### unauthenticated-boundary-p0s/F-03 [P0] closed - Hubtel webhook has no signature verification

**File:** src/app/api/webhooks/hubtel/route.ts:4
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** The handler parses the body and acts on it with no
authenticity check of any kind. There is no shared secret, no HMAC, no allowlist.
The Paystack route next to it does verify (`validatePaystackSignature`), so this
is an omission rather than a missing capability. Once F-02 is fixed and these
writes actually land, anyone who can reach the URL can insert a completed
`payments` row for any amount and move an order to `processing`.
**Suggested fix:** Verify the Hubtel callback before any parsing, following the
`validatePaystackSignature` pattern in `src/lib/payments/paystack.ts`, and reject
with 401 on failure. Fix this together with F-02, never after it.
**Resolution:** fixed in fix/unauthenticated-boundary-p0s step 1. The existing
`validateHubtelAuth` (basic-auth against `HUBTEL_CLIENT_ID`/`HUBTEL_CLIENT_SECRET`)
is now the first line of the handler, before any body read, returning 401 on
failure. Its comparison was moved to `crypto.timingSafeEqual` and it fails closed
when either env var is unset. Smoke-tested: valid header passes; wrong, null,
empty, and missing-env all return false.
Re-reviewed by /audit (scope: current) 2026-09-03: the check is the first
statement in the handler, ahead of `req.text()`; no database path is reachable
without it.

### unauthenticated-boundary-p0s/F-04 [P0] closed - Anonymous storefront reads and writes are blocked by RLS (not grants)

**File:** src/app/actions/storefront-order.ts:47
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** `submitStorefrontOrder`, `getStorefrontOrderTracking`, and the
wishlist action all use `createClient()` from pages served to anonymous visitors.
`supabase/migrations/20260822173400_add_table_grants.sql` grants `customers`,
`orders`, `order_items`, and `stores` to `authenticated` only; the sole anon
grants in the whole migration set are `waitlist`, `storefront_settings`,
`order_access_tokens`, and `storefront_sessions`. No policy on `orders` or
`customers` admits an anonymous caller. If that is the live state, storefront
checkout and order tracking fail for every visitor and surface a raw Postgres
permission error. `storefront-public.ts` already uses `createAdminClient()` for
catalog reads, which is the correct pattern and suggests the others were missed.
**Missing validation:** No database access from this session. Place one order
through `/store/[slug]` against the linked project and read the returned error,
or run `select grantee, privilege_type from information_schema.role_table_grants
where table_name = 'orders';`.
**Suggested fix:** If confirmed, move the anonymous storefront write and tracking
paths onto `createAdminClient()` with explicit tenant scoping in the query, the
same shape `storefront-public.ts` uses. Fix F-01 first or at the same time, since
the admin client bypasses RLS and would make the price defect exploitable.
**Resolution:** confirmed and fixed in fix/unauthenticated-boundary-p0s step 5.
The grant premise was wrong: `anon` holds full DML grants on these tables locally.
RLS is the gate. Proven on the local DB: as role `anon`, `insert into customers`
raises `new row violates row-level security policy` and `select count(*) from
orders` returns 0 against 3 real rows. So checkout and tracking were dead for
every anonymous visitor. `submitStorefrontOrder`, `getStorefrontOrderTracking`,
and `lookupCustomerOrder` now use `createAdminClient()` with the tenant resolved
server-side from the storefront slug (never a client id), which also removed the
cross-tenant write primitive that the naive swap would have introduced.
`lookupCustomerOrder(tenantId, ...)` became `lookupCustomerOrder(tenantSlug, ...)`.
`syncGuestWishlist` had the same defect (already resolved tenant from slug, just
wrong client) and was migrated too.
Re-reviewed by /audit (scope: current) 2026-09-03: all four actions now resolve
the tenant from `storefront_settings.slug` server-side; no client-supplied tenant
id reaches a query. `getStorefrontOrderTracking` keeps a secondary
`tenants.name ilike` fallback for a missing storefront row, which is unchanged
and low-risk (still gated by the token/phone check). The phone-only tracking
branch (F-16) is now a live path where it was previously dead under RLS.

### unauthenticated-boundary-p0s/F-05 [P1] closed - Hubtel order lookup is vulnerable to LIKE-wildcard injection

**File:** src/app/api/webhooks/hubtel/route.ts:52
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** `clientReference` comes from the request body, is split on
`_`, and `parts[1]` is interpolated into `.ilike('id', `${orderShortId}%`)`
unescaped. `%` and `_` are LIKE metacharacters, so a reference like `ord_%_x`
matches every order and `.limit(1).single()` picks an arbitrary one, which then
receives the payment and the status change. Matching an order by UUID prefix is
also ambiguous on its own.
**Suggested fix:** Carry the real order id in the reference and look it up with
`.eq('id', ...)`. If a prefix match must stay, escape `%`, `_`, and `\` before
building the pattern and reject a match that is not unique.
**Resolution:** fixed in fix/unauthenticated-boundary-p0s step 3. The reference is
now minted as `ord_<short_id>_<ts>` (`short_id` is `ORD-XXXXXX`, no underscore)
and the webhook resolves it with `.eq('short_id', ...)`. A "no order found"
result returns 404 instead of falling through to a null tenant. Note: any Hubtel
reference minted in the old `ord_<uuid8>_<ts>` format will 404 at the webhook,
which is acceptable because F-02 means no such callback ever wrote successfully.
Re-reviewed by /audit (scope: current) 2026-09-03: `split('_')[1]` on
`ord_ORD-XXXXXX_<ts>` yields the exact short id (short id contains no
underscore); the `%`/`_` wildcard vector is gone. Same exact-match fix applied to
the two `%short_id%` lookups in `storefront-tracking.ts` for the same reason.

### unauthenticated-boundary-p0s/F-06 [P1] accepted - Paystack subscription webhook trusts metadata it did not author

**File:** src/app/api/webhooks/paystack/route.ts:42
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** Case 1 reads `metadata.tenantId`, `metadata.tier`, and
`metadata.billingCycle` and writes the resulting subscription without checking
the paid amount against any plan price. The signature proves the event came from
Paystack, not that our server initiated the charge. A transaction can be started
with the publishable key (`NEXT_PUBLIC_*`) carrying arbitrary metadata, so a GHS
1 charge can set a tenant to any tier. `metadata.tier || 'pro'` also defaults to
a slug that does not exist in `platform_plans`.
**Suggested fix:** Look the plan up in `platform_plans` by slug, require
`data.amount` to match its price for the billing cycle, and reject the event
otherwise. Do not default the tier.
**Resolution:** accepted by the user (info@sherohq.com) on 2026-09-03. Not in scope of the unauthenticated-boundary P0 fix, which touched none of this code. Deferred and tracked here. Goes to a dedicated webhook-authenticity fix alongside F-09 and F-10.

### unauthenticated-boundary-p0s/F-07 [P1] accepted - Plan catalogue is gated by a page rule, so most staff see a false empty state

**File:** src/app/actions/platform.ts:495
**Found:** 2026-09-03 by /audit (scope: full; lens: quality)
**Why it matters:** `getPlatformPlansAction` is gated with
`PLATFORM_RBAC_RULES['/platform/plans-billing']` (owner and admin), but it is
called from `/platform` (platform/page.tsx:27) and `/platform/merchants`
(merchants/page.tsx:10), both of which admit all seven staff roles. Both callers
swallow the throw into `{ plans: [] }`, so `operations`, `support`, `finance`,
`tech_admin`, and `compliance` see "No plans configured" on the Overview and an
empty plan-override dropdown. That is the console asserting something about the
database it did not measure, the exact defect class commit 553749f removed.
`PLATFORM_RBAC_RULES` is a nav map; one route-keyed table cannot gate an action
shared across routes.
**Suggested fix:** Give actions their own capability constants. Reading the plan
catalogue is allowed for every staff role that can open a page showing prices;
writing plans stays owner and admin.
**Resolution:** accepted by the user (info@sherohq.com) on 2026-09-03. Not in scope of the unauthenticated-boundary P0 fix, which touched none of this code. Deferred and tracked here. Belongs to the platform-console consolidation follow-up; the code is already on main (commit dd29bdc), not this branch.

### unauthenticated-boundary-p0s/F-08 [P1] accepted - Private-schema migration omits GRANT USAGE and will break every rewritten policy

**File:** supabase/migrations/20260903002200_move_platform_staff_to_private.sql:2
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** The migration creates schema `private`, moves
`is_platform_staff()` into it, and rewrites every policy to call
`private.is_platform_staff()`. `CREATE SCHEMA` grants USAGE to nobody, and RLS
quals are evaluated with the calling role's privileges, so `authenticated` and
`anon` would hit `permission denied for schema private` on every table the
migration touches. The migration is committed but not applied, so nothing is
broken yet; applying it as-is would lock the platform plane out.
**Suggested fix:** Add `GRANT USAGE ON SCHEMA private TO authenticated, anon,
service_role;` after the schema is created. This does not undo the fix, since
PostgREST only exposes `public` and `graphql_public`. Apply against a local reset
before it reaches a shared environment.
**Resolution:** accepted by the user (info@sherohq.com) on 2026-09-03. Not in scope of the unauthenticated-boundary P0 fix, which touched none of this code. Deferred and tracked here. Migration file only, not yet applied anywhere, so nothing is broken. Fixed together with F-12 before that migration is ever run.

### unauthenticated-boundary-p0s/F-09 [P1] accepted - WhatsApp webhook does not verify the Meta payload signature

**File:** src/app/api/webhooks/whatsapp/route.ts:29
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** The GET verification handshake is implemented, but POST parses
and acts on the body with no `X-Hub-Signature-256` check, so anyone can post
fabricated inbound messages. `VERIFY_TOKEN` also falls back to the literal
`'merchander_verify_token'` when the env var is absent, which makes the handshake
pass with a value published in the repository. Impact is limited today because
the handler only calls a stub, but features 16 to 21 build directly on this
boundary.
**Suggested fix:** Verify `X-Hub-Signature-256` as an HMAC-SHA256 of the raw body
keyed with the app secret before parsing, and fail closed when the env var is
missing instead of falling back to a literal.
**Resolution:** accepted by the user (info@sherohq.com) on 2026-09-03. Not in scope of the unauthenticated-boundary P0 fix, which touched none of this code. Deferred and tracked here. Goes to the dedicated webhook-authenticity fix with F-06 and F-10.

### unauthenticated-boundary-p0s/F-10 [P1] accepted - Telegram webhook skips its secret check outside production

**File:** src/app/api/webhooks/telegram/route.ts:16
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** The guard is
`if (process.env.NODE_ENV === 'production' && secretToken !== TELEGRAM_SECRET_TOKEN)`,
so every non-production deployment (preview builds, staging) accepts unsigned
webhook traffic. `TELEGRAM_SECRET_TOKEN` also defaults to the literal
`'merchander_telegram_token'` committed at line 6.
**Suggested fix:** Check the token unconditionally and fail closed when the env
var is unset.
**Resolution:** accepted by the user (info@sherohq.com) on 2026-09-03. Not in scope of the unauthenticated-boundary P0 fix, which touched none of this code. Deferred and tracked here. Goes to the dedicated webhook-authenticity fix with F-06 and F-09.

### unauthenticated-boundary-p0s/F-11 [P1] accepted - Subscription state has two disagreeing sources of truth

**File:** src/app/actions/settings-subscription.ts:48
**Found:** 2026-09-03 by /audit (scope: full; lens: quality)
**Why it matters:** The merchant surface and the Paystack webhook read and write
`tenant_settings.settings_data.subscription` using the slugs
`starter | pro | enterprise`, while the platform console reads
`tenant_subscriptions` using `free | starter | growth | business | enterprise`.
The two never synchronise, so a merchant and platform staff see different plans
and different prices for the same tenant, and MRR is computed from a table the
upgrade flow does not write. Carried forward from the strip fix follow-ups, now
confirmed against the webhook as well.
**Suggested fix:** Pick `tenant_subscriptions` as the single source, make the
webhook and merchant surface read and write it, and migrate any live
`settings_data.subscription` rows. Needs a product decision before code.
**Resolution:** accepted by the user (info@sherohq.com) on 2026-09-03. Not in scope of the unauthenticated-boundary P0 fix, which touched none of this code. Deferred and tracked here. Needs a product decision on which store of subscription truth wins before any code; carried as a standalone item.
