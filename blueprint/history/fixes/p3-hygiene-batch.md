# Current Feature

**Title:** P3 hygiene batch — GET logout, unvalidated branch cookie, shared webhook compare

**Type:** Fix

**Status:** verified

**Fixes:** F-17, F-18, F-20

**Source:** `/audit full` 2026-09-03. Three unrelated low-severity items, each a
small self-contained diff.

## The problem

| ID | Defect | File |
|---|---|---|
| F-17 | `/api/auth/reset` is a `GET` that clears every cookie. Any third-party page can force-logout a signed-in merchant with `<img src=".../api/auth/reset">`. Denial of session only, but a state change behind `GET` with no origin check is the wrong shape. No in-code caller; the route is listed in `project-overview.md`. | `src/app/api/auth/reset/route.ts:4` |
| F-18 | `setActiveBranch(storeId)` writes any caller-supplied string into the `merchander_active_store` cookie with no check that the id is a store in the caller's tenant. Consumers are RLS-bound and `dashboard/layout.tsx` already discards an unknown id, so impact is low, but untrusted input is persisted and flows into query builders. | `src/app/actions/branch.ts:6` |
| F-20 | The channel-webhook-auth fix extracted the WhatsApp HMAC check to `src/utils/webhook-signature.ts` (tested), but the sibling Telegram constant-time token compare (`secretTokenValid`) stays inline in the route with no test. Same pure-logic-on-a-security-path drift F-14 flags. Function is correct and runtime-verified. | `src/app/api/webhooks/telegram/route.ts:10` |

## The fix

- **F-17:** replace the `GET` handler with a `POST` handler that first rejects
  cross-site calls — 403 unless `Sec-Fetch-Site` is `same-origin`/`none` **or**
  the `Origin` header's origin equals the request URL's origin. Same body
  (clear all cookies, redirect to `/login`). Keep the route path. No `GET`
  export, so `<img>`/prefetch can't trigger it.
- **F-18:** in `setActiveBranch`, resolve the caller (`createClient()` +
  `getAuthenticatedUser` / `getTenantInfo`). For a concrete `storeId` (not
  `'all'`), verify a `stores` row with that `id` and the caller's `tenant_id`
  exists; if not, return `{ success: false, error: 'Unknown branch' }` and do
  **not** touch the cookie. `'all'` and the unauthenticated case (return early,
  as other actions do) are unchanged. `getActiveBranchId` is untouched.
- **F-20:** add `timingSafeStringEqual(a: string, b: string): boolean` to
  `src/utils/webhook-signature.ts` (length-guarded `crypto.timingSafeEqual` on
  UTF-8 buffers). Rewrite `verifyMetaSignature`'s final compare to call it.
  Replace the Telegram route's local `secretTokenValid` body with a call to it
  (`import` from `@/utils/webhook-signature`, drop the route's `crypto` import).
  Add focused tests for `timingSafeStringEqual`.

### Must not break

- Real sign-out paths (`/auth/signout`, the `logout()` action, Supabase
  `signOut`) are untouched.
- A same-origin call to `/api/auth/reset` (form POST or `fetch`) still clears
  cookies and redirects to `/login`.
- Branch switching from `BranchSwitcher` still works for a valid store id and
  for "All Branches"; `dashboard/layout.tsx`'s cookie read is unchanged.
- WhatsApp and Telegram webhook signature/token verification keeps identical
  behaviour — valid passes, invalid/missing/short/long all rejected. The
  existing `webhook-signature.test.ts` cases stay green.
- Test gate: the new `src/utils` logic ships with passing tests in the same
  diff; `yarn test` green.
- `yarn test`, `yarn lint`, `yarn check`, `yarn build` all clean.

## Build steps

- [x] 1. **F-20 — shared constant-time string compare.** Added
  `timingSafeStringEqual(a, b)` to `src/utils/webhook-signature.ts` (UTF-8
  buffers, length guard, `crypto.timingSafeEqual`). `verifyMetaSignature`'s final
  compare now calls it. `telegram/route.ts` `secretTokenValid` calls it and the
  `crypto` import is gone. 6 new test cases in `webhook-signature.test.ts`.
  **Evidence:** `yarn test src/utils/webhook-signature.test.ts` → 13 passed
  (7 existing `verifyMetaSignature` + 6 new); full `yarn test` → 190 passed (was
  184). `yarn check`/`lint` exit 0. Telegram route diff removes all local
  `crypto`/`Buffer`/`timingSafeEqual`.

- [x] 2. **F-17 — POST-only, same-origin `/api/auth/reset`.** `GET` export
  replaced with `POST`. Rejects with 403 when `Sec-Fetch-Site` is present and
  not `same-origin`/`none`, or when `Origin` is present and its origin !==
  `new URL(request.url).origin`. Otherwise clears all cookies + redirects to
  `/login` as before.
  **Evidence** (dev server, `curl`):
  | Request | Result |
  |---|---|
  | `GET` | `405` |
  | `POST` `Sec-Fetch-Site: same-origin` | `307 → /login` |
  | `POST` no origin headers | `307` |
  | `POST` `Origin: https://evil.test` | `403` |
  | `POST` `Sec-Fetch-Site: cross-site` | `403` |
  | `POST` `Origin: http://localhost:3001` (match) | `307` |
  `yarn check`/`lint`/`build` exit 0.

- [x] 3. **F-18 — validate the branch id before persisting.** `setActiveBranch`
  now resolves the caller (`createClient` + `getAuthenticatedUser`), returns
  `{ success: false, error: 'Not signed in' }` if unauthenticated, and for a
  non-`'all'` `storeId` does `getTenantInfo` +
  `stores.select('id').eq('id', storeId).eq('tenant_id', tenantId).maybeSingle()`
  — no row → `{ success: false, error: 'Unknown branch' }`, cookie untouched.
  `'all'` and valid-id paths keep the existing cookie set + `revalidatePath`.
  **Evidence:** against local DB — real store id in its own tenant → 1 row
  (allowed); same id + wrong tenant → 0 rows; garbage id → 0 rows (both
  rejected). `yarn check`/`lint`/`build` exit 0. Caller `BranchSwitcher` already
  guards on `res.success`.

- [x] 4. **Full verify.**
  | Command | Result |
  |---|---|
  | `yarn test` | 190 passed (26 files) |
  | `yarn lint` | exit 0 |
  | `yarn check` | exit 0 |
  | `yarn build` | exit 0 |

## Verify

- `yarn test` / `yarn lint` / `yarn check` / `yarn build` clean.
- `/api/auth/reset`: `GET` → 405; cross-origin `POST` → 403; same-origin `POST`
  → redirect to `/login` and session cleared.
- Branch switcher (needs ≥2 branches): switching to a real branch and to "All
  Branches" both work and persist across reload; a forged cookie value is still
  ignored by `dashboard/layout.tsx` (unchanged) and can no longer be written by
  the action.
- Telegram webhook: `POST` without `X-Telegram-Bot-Api-Secret-Token` → 403,
  with the correct token → 200 (unchanged).
- WhatsApp webhook signature check unchanged (existing tests + a manual signed
  `POST`).

## Out of scope

- The `GET` handler on `/auth/signout` (same GET-logout shape, different route —
  separate finding if wanted).
- F-19 (storefront `batchId`/`pickupStoreId` trust), F-22, F-13, F-14, F-21.
- Any broader CSRF framework or a shared `assertSameOrigin` helper — inline the
  check in the one route for now.

## Findings

### p3-hygiene-batch/F-17 [P3] closed - Session reset is a state-changing GET

**File:** src/app/api/auth/reset/route.ts:4
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** A `GET` that clears every cookie — any third-party page could
force-logout a merchant with an `<img>` tag.
**Resolution:** `GET` export replaced with `POST`; 403 when `Sec-Fetch-Site` is
present and not `same-origin`/`none`, or when `Origin` is present and != the
request origin; otherwise clears cookies + redirects to `/login`. Verified by
curl: GET→405, same-origin POST→307→/login, cross-origin/cross-site POST→403.
Re-reviewed by /audit (scope: current) 2026-09-03: the `<img>`/GET vector is
gone and `Sec-Fetch-Site` blocks cross-site; two minor residuals (307 vs 303
redirect, Origin-vs-request.url fragility behind a proxy) split off as F-23,
neither a security regression. Closed.

### p3-hygiene-batch/F-18 [P3] closed - Active branch cookie is written without validation

**File:** src/app/actions/branch.ts:6
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** `setActiveBranch` persisted any caller-supplied string into
`merchander_active_store` with no tenant check.
**Resolution:** `setActiveBranch` now resolves the caller, returns
`{ success: false }` when unauthenticated, and for a concrete `storeId`
persists it only after confirming a `stores` row with that id in the caller's
tenant (RLS-bound client; `.eq('tenant_id', ...)` is defence-in-depth). Foreign
or non-UUID id → no row → rejected, cookie untouched. Verified against local DB.
Re-reviewed by /audit (scope: current) 2026-09-03: no new defect; a
`getTenantInfo` throw on a practically-unreachable membership-less session
would surface as a rejected action, noted not fixed. Closed.

### p3-hygiene-batch/F-20 [P3] closed - Telegram secret check is a new pure security function that is neither shared nor tested

**File:** src/app/api/webhooks/telegram/route.ts:10
**Found:** 2026-09-03 by /audit (scope: current; lens: tests)
**Why it matters:** The WhatsApp HMAC check was extracted + tested; the sibling
Telegram constant-time token compare stayed inline and untested despite the
test gate.
**Resolution:** `timingSafeStringEqual(a, b)` added to
`src/utils/webhook-signature.ts` (UTF-8 buffers, length guard,
`crypto.timingSafeEqual`); `verifyMetaSignature` and the Telegram route's
`secretTokenValid` both call it; the route's `crypto` import is removed; 6
focused test cases added. `yarn test` 190 passed (was 184), the 7 existing
`verifyMetaSignature` cases still green. Re-reviewed by /audit (scope: current)
2026-09-03: byte-identical to both former inline compares; verification
behaviour unchanged. Closed.

### Still open at completion (not part of this fix)

- **F-23 [P3] open** — `/api/auth/reset` uses a 307 (vs 303) redirect and an
  `Origin`-vs-`request.url` check that is fragile behind a reverse proxy. Raised
  by this fix's audit. Non-blocking, fails safe.
- **F-21 [P2] fixed** — plans-billing route guard from `fix/platform-console-consolidation`,
  still awaiting an `/audit` re-review.
- F-22 [P3], F-13 [P2], F-14 [P2], F-19 [P3] — pre-existing.
