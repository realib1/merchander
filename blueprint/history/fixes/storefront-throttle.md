# Current Feature

**Title:** Throttle the anonymous storefront order and tracking endpoints

**Type:** Fix

**Status:** verified

**Fixes:** F-15, F-16

**Source:** `/audit full` 2026-09-03. Both findings are live P2 security gaps on
the public storefront server actions, which run on the service-role admin client
(after the F-04 fix) with no auth and no throttle.

## The problem

| ID | Defect | File |
|---|---|---|
| F-15 | `submitStorefrontOrder` is reachable by any anonymous visitor and creates `customers`, `customer_identities`, `orders`, `order_items`, and `order_access_tokens` rows per call with no rate limit, captcha, or duplicate window. It also **inserts a `stores` row** when the tenant has none (line 167), so an unauthenticated caller can cause store creation. A script can fill a merchant's order board and customer list. | `src/app/actions/storefront-order.ts:44` |
| F-16 | `getStorefrontOrderTracking` and `lookupCustomerOrder` authorize on a valid token **or** a matching phone. `ORD-XXXXXX` is short and a Ghanaian mobile number is low-entropy, so the phone branch is close to brute-forceable, and (post F-04) it runs on the admin client so it actually returns data. Exposes delivery address, items, totals. `lookupCustomerOrder`'s phone branch also matches on `phone.ilike.%<raw input>%`, so a short numeric string over-matches unrelated customers. | `src/app/actions/storefront-tracking.ts:141`, `:282` |

No rate-limit infrastructure exists in the repo today. `x-forwarded-for` via
`next/headers` is already used in `src/app/actions/platform-audit.ts:29`.

## The fix

A small DB-backed fixed-window throttle, applied to the three anonymous entry
points, plus removing the anon `stores` insert.

- **New table `storefront_rate_limits`** (`id`, `bucket text`, `created_at timestamptz`),
  RLS enabled with **no policies** so only the service-role client can read or
  write it. Index on `(bucket, created_at)`.
- **New helper `src/lib/security/rate-limit.ts`** —
  `enforceRateLimit(bucket: string, max: number, windowSeconds: number): Promise<boolean>`.
  Counts rows for `bucket` newer than `now() - windowSeconds`; returns `false`
  (blocked) when the count is `>= max`, otherwise inserts one row and returns
  `true`. Opportunistically deletes rows for that bucket older than 24h. Uses
  `createAdminClient()`. On any DB error it **fails open** (returns `true`) and
  logs — a throttle outage must not take down checkout.
- **New helper `src/lib/security/request-ip.ts`** — `getRequestIp(): Promise<string>`
  reading the first `x-forwarded-for` entry via `headers()`, `'unknown'` when
  absent. (Extracted so both actions share one implementation and the
  platform-audit copy can adopt it later — not required here.)
- **`submitStorefrontOrder`:** after phone normalisation and tenant resolution,
  enforce two buckets — `order:ip:<ip>` at **10 / hour** and
  `order:phone:<normalizedPhone>` at **5 / hour**. Either tripping returns
  `{ success: false, error: 'Too many orders from this device or number. Please try again later.' }`
  before any row is written. Then, in the store-resolution block, **delete the
  `else` branch that inserts a `stores` row**; when no store exists, return
  `{ success: false, error: 'This store is not set up to receive orders yet.' }`.
- **`getStorefrontOrderTracking` and `lookupCustomerOrder`:** enforce
  `track:ip:<ip>` at **12 / 10 min** at the top of each; over the limit returns
  `{ success: false, error: 'Too many attempts. Please wait a few minutes and try again.' }`
  (`lookupCustomerOrder` returns `{ error: ... }`). This is the F-16 lockout.
- **`lookupCustomerOrder` phone match:** drop the raw `cleanQuery` and
  `rawDigits.slice(-9)` `%like%` terms; match only on the **normalised phone**
  (`normalizeGhanaPhone`) with `.eq('phone', normalizedPhone)`. If the input
  doesn't normalise to a valid GH number, return "Order not found" rather than
  running a fuzzy scan.

### Must not break

- A normal shopper placing one order, then tracking it by token or by their real
  phone, still works (limits are well above one interaction).
- `submitStorefrontOrder` still resolves tenant from the slug and prices from the
  catalogue (F-01/F-04 fixes untouched).
- The throttle failing (DB error, table missing on an un-migrated env) must not
  block checkout — `enforceRateLimit` fails open.
- `storefront_rate_limits` is unreadable to `anon`/`authenticated` (RLS on, no
  policy); only the admin client touches it.
- `yarn test`, `yarn lint`, `yarn check`, `yarn build` all green.
- `npx supabase db reset --local` clean.

## Build steps

- [x] 1. **Migration: `storefront_rate_limits`.**
  `supabase/migrations/20260903180321_create_storefront_rate_limits.sql`: table
  (`id uuid pk default gen_random_uuid()`, `bucket text not null`,
  `created_at timestamptz not null default timezone('utc', now())`), index on
  `(bucket, created_at)`, RLS enabled with no policy,
  `REVOKE ALL ... FROM anon, authenticated`, `GRANT SELECT, INSERT, DELETE ... TO
  service_role`, `NOTIFY pgrst`. `src/types/supabase.ts` regenerated
  (`npx supabase gen types typescript --local`).
  **Evidence:** `db reset --local` exit 0; `to_regclass` non-null,
  `relrowsecurity = true`, `pg_policies` count 0. Via PostgREST: anon
  `SELECT` → `42501 permission denied`, anon `POST` → 401; service_role `POST`
  → 201, `HEAD` count → `Content-Range: 0-0/1`. Types diff is the new table only
  (plus `is_platform_staff` correctly dropping from public Functions — it moved
  to `private` in the merged F-08/F-12 migration).

- [x] 2. **Helpers.** `src/lib/security/request-ip.ts` (`getRequestIp` — first
  `x-forwarded-for` hop, mirrors `platform-audit.ts`) and
  `src/lib/security/rate-limit.ts` (`enforceRateLimit(bucket, max, windowSeconds)`
  — count-in-window on the admin client, insert if under, opportunistic 24h
  cleanup, **fails open** on any error/throw). Both `import 'server-only'`.
  **Evidence:** `yarn check` / `yarn lint` exit 0. Every DB-error and catch path
  returns `true`.

- [x] 3. **F-15 — throttle order creation, drop the anon store insert.**
  `submitStorefrontOrder`: after tenant resolution, `Promise.all` of
  `enforceRateLimit('order:ip:<ip>', 10, 3600)` and
  `enforceRateLimit('order:phone:<phone>', 5, 3600)`; either blocked → throttle
  error before any write. The `stores` insert `else` branch is replaced with
  `return { success:false, error:'This store is not set up to receive orders yet.' }`.
  **Evidence:** `yarn check`/`lint`/`build` exit 0. Fixed-window semantics proven
  end-to-end against local PostgREST (loop of 15: allowed 12, blocked 3 at
  max 12). Diff removes the only `stores` `.insert(` in the file.

- [x] 4. **F-16 — throttle tracking, tighten the phone match.**
  `getStorefrontOrderTracking` and `lookupCustomerOrder` both enforce
  `track:ip:<ip>` (12 / 600s) before tenant resolution. `lookupCustomerOrder`'s
  phone branch: `else if (normalizedPhone)` only, matched with
  `.eq('phone', normalizedPhone)` — the raw-input / last-9-digits `ilike` terms
  and the interpolated `.or()` filter string are gone.
  **Evidence:** `yarn check`/`lint`/`build` exit 0. `normalizeGhanaPhone('233')`
  → `null` (verified against `src/utils/phone.ts`), so `"233"` falls to the
  `short_id` branch → no match → "Order not found." The
  `getStorefrontOrderTracking` phone branch already did an exact normalised
  compare; only the throttle was added there.

- [x] 5. **Full verify.**
  | Command | Result |
  |---|---|
  | `yarn check` | exit 0 |
  | `yarn lint` | exit 0 |
  | `yarn test` | 184 passed (26 files) |
  | `yarn build` | exit 0 |
  | `npx supabase db reset --local` | clean, migration applies |

## Verify

- `yarn test` / `yarn lint` / `yarn check` / `yarn build` clean;
  `npx supabase db reset --local` clean.
- Local DB: `anon` cannot read or write `storefront_rate_limits`.
- Drive `submitStorefrontOrder` from a script (or the storefront cart) 11 times
  with the same phone: first calls succeed, later calls return the throttle
  error, `orders` count stops climbing.
- Storefront: place one real order, then open the tracking URL (token) and also
  look it up by the order's phone — both still work.
- Hit `lookupCustomerOrder` with `"233"` — returns "Order not found".
- Deployment note: the new migration must reach the linked remote
  (`supabase db push`) before this ships, or `enforceRateLimit` runs against a
  missing table and fails open (no throttle, but no breakage).

## Out of scope

- A captcha / proof-of-work on the storefront (bigger UX change).
- Replacing the phone-tracking branch with a one-time code (F-16 "consider"
  alternative) — the throttle is the agreed mitigation.
- F-13, F-14, F-17-F-21.
- Adopting `getRequestIp` inside `platform-audit.ts` (leave its local copy).

## Findings

### storefront-throttle/F-15 [P2] closed - Anonymous order creation is unthrottled

**File:** src/app/actions/storefront-order.ts:47
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** Anonymous, admin-client action creating customers / orders /
tokens per call with no rate limit; also auto-inserted a `stores` row when the
tenant had none.
**Resolution:** New `storefront_rate_limits` table (RLS on, no policy,
service-role grant only) + `enforceRateLimit` helper (fixed window, fails open).
`submitStorefrontOrder` enforces `order:ip:<ip>` 10/hour and
`order:phone:<phone>` 5/hour before any write; the `stores` auto-insert branch
is replaced with a failure return. Re-reviewed by /audit (scope: current)
2026-09-03: throttle placement/buckets/fail-open correct; the removed
`stores` insert is safe (platform merchant creation always seeds a primary
store, and `inventory.ts:46` already treats "no store" as an error). Count-
then-insert is non-atomic (minor overshoot under concurrent bursts), acceptable
for an abuse throttle. No new defect. Closed.

### storefront-throttle/F-16 [P2] closed - Phone number alone unlocks order tracking

**File:** src/app/actions/storefront-tracking.ts:50
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** `getStorefrontOrderTracking` / `lookupCustomerOrder`
authorize on token OR phone; post-F-04 they run on the admin client so the
guessable phone branch returns real data (address, items, totals).
`lookupCustomerOrder` also matched `phone.ilike.%<raw input>%` with user input
concatenated into a PostgREST `.or()` filter string.
**Resolution:** Both actions enforce `track:ip:<ip>` at 12 / 10 min before doing
work (the lockout). `lookupCustomerOrder`'s phone branch narrowed to a single
`.eq('phone', normalizeGhanaPhone(input))` — removes the fuzzy scan and the
`.or()` injection vector; `"233"` now returns "Order not found". Token stays the
primary authenticator. Re-reviewed by /audit (scope: current) 2026-09-03: the
per-IP throttle makes the ~10^8 phone-space guess infeasible; no new security
defect. The throttle also fronting the valid-token reload path is a minor UX
cost, tracked separately as F-22 (P3). Closed.

### Still open at completion (not part of this fix)

- **F-22 [P3] open** — order-tracking throttle also rate-limits the valid-token
  path; a customer reloading their tracking link >12x/10min is briefly locked
  out. Raised by this fix's audit. Non-blocking.
- **F-21 [P2] fixed** — plans-billing route guard from the prior fix, still
  awaiting an /audit re-review.
- F-13, F-14, F-17-F-20 (P2/P3) — pre-existing.
