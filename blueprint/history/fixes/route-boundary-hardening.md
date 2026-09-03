# Current Feature

**Title:** Route/request-boundary hardening batch (platform route guard, tracking throttle, reset redirect)

**Type:** Fix

**Status:** verified

**Fixes:** F-24, F-22, F-23

**Source:** `/audit` 2026-09-03/04. Three route- and request-boundary items:
one P2 authz gap on `/platform`, two P3 residuals from earlier fixes.

## The problem

| ID | Defect | File |
|---|---|---|
| F-24 | `/platform` routes whose data action is a bare `verifyPlatformStaff()` are reachable by all seven staff roles via direct URL, though `PLATFORM_RBAC_RULES` intends a subset (same gap F-21 had). `/platform/security` → `getPlatformStaffListAction` ungated: `operations`/`support`/`finance`/`tech_admin` can read the full `platform_staff_users` roster incl. `mfa_enabled` and see the RBAC UI (writes are owner/admin-gated, so disclosure not escalation). `/platform/system-health` → `getPlatformInfrastructureStatus` likewise. | `src/app/platform/security/page.tsx:9`, `src/app/platform/system-health/page.tsx:9`, `src/app/actions/platform-staff.ts:19`, `src/app/actions/platform.ts:760` |
| F-22 | The F-16 tracking throttle (`track:ip:<ip>`, 12 / 10 min) sits ahead of the token check in `getStorefrontOrderTracking`, and the order page SSRs a call on every reload with the URL token. A customer with a valid token who reloads >12×/10 min is locked out of their own order. | `src/app/actions/storefront-tracking.ts:11` |
| F-23 | `/api/auth/reset` (F-17 fix) returns a `307` (browser re-POSTs `/login`) where `303` is correct, and compares the `Origin` header against `new URL(request.url).origin`, which is fragile behind a reverse proxy / custom-domain edge. | `src/app/api/auth/reset/route.ts:12` |

## The fix

- **F-24:** add `src/lib/auth/require-platform-route.ts` exporting
  `requirePlatformRoute(route)` — `await verifyPlatformStaff(PLATFORM_RBAC_RULES[route])`
  inside `try`, `redirect('/platform')` in `catch`, returns `{ user, role }` on
  success. Apply it to `security/page.tsx` and `system-health/page.tsx`, and
  refactor `plans-billing/page.tsx` to use it (drops its bespoke inline
  try/catch). Also tighten the two loose actions themselves as defence in depth:
  `getPlatformStaffListAction` → `verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/security'])`,
  `getPlatformInfrastructureStatus` → `verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/system-health'])`.
- **F-22:** raise `TRACK_MAX_PER_WINDOW` from 12 to 30 (still makes the ~10^8
  Ghana-mobile space infeasible at 30 / 10 min; comfortably above any real
  reload pattern). Applies to both `getStorefrontOrderTracking` and
  `lookupCustomerOrder` via the shared const. Comment notes the token-first
  reorder as the fuller alternative.
- **F-23:** `NextResponse.redirect(new URL('/login', request.url), 303)`.
  Replace the `Origin` vs `request.url` comparison with `Origin`'s host vs the
  `x-forwarded-host` / `host` header (403 on mismatch or an unparseable
  `Origin`). Keep the `Sec-Fetch-Site` check as the primary guard.

### Must not break

- Owner/admin (and `compliance` for `/security`, `tech_admin`+`operations` for
  `/system-health`) still reach those pages; every other role redirects to
  `/platform`.
- `plans-billing` behaviour is unchanged after the refactor (owner/admin in,
  others redirected; `getPlatformPlansAction` still open to all roles for the
  overview/merchants pages).
- `security/page.tsx` still gets `currentStaffRole` for `StaffManagementClient`
  (from the helper's return).
- A real customer tracking one order by token or by phone still works; the
  throttle still blocks a genuine burst.
- Same-origin `POST /api/auth/reset` still clears cookies and lands on `/login`;
  cross-origin / cross-site POST still 403; `GET` still 405.
- `yarn test`, `yarn lint`, `yarn check`, `yarn build` all green.

## Build steps

- [x] 1. **F-24 — shared platform route guard.** Added
  `src/lib/auth/require-platform-route.ts` — `requirePlatformRoute(route)`:
  `redirect('/platform')` if the route key is unknown (fail closed), else
  `verifyPlatformStaff(PLATFORM_RBAC_RULES[route])` in `try` with
  `redirect('/platform')` in `catch`, returning `{ user, role }` on success.
  Wired into `security/page.tsx` (replacing the bare `verifyPlatformStaff()`,
  keeps `userRole` from the return), `system-health/page.tsx` (new call before
  the data fetch), and `plans-billing/page.tsx` (replaces its inline try/catch).
  **Evidence:** `yarn check`/`lint` exit 0; grep shows all three pages import
  and call the helper; `plans-billing` no longer imports `verifyPlatformStaff`
  or `redirect` directly.

- [x] 2. **F-24 — tighten the two loose actions.**
  `getPlatformStaffListAction` → `verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/security'])`
  (import added to `platform-staff.ts`); `getPlatformInfrastructureStatus` →
  `verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/system-health'])`.
  **Evidence:** `yarn check` exit 0. grep confirms each action's page is its
  only caller (`getPlatformStaffListAction` ← `security/page.tsx`;
  `getPlatformInfrastructureStatus` ← `system-health/page.tsx`).

- [x] 3. **F-22 — raise the tracking limit.** `TRACK_MAX_PER_WINDOW` 12 → 30 in
  `storefront-tracking.ts`; doc comment expanded, notes the token-first reorder
  as the fuller fix.
  **Evidence:** `yarn check`/`lint` exit 0. Local PostgREST simulation of the
  fixed-window logic at max 30: **30 allowed then 5 blocked** over 35 attempts.

- [x] 4. **F-23 — reset route: 303 + host-based origin check.**
  `api/auth/reset/route.ts`: `NextResponse.redirect(url, 303)`; the `Origin`
  check now compares `new URL(origin).host` against
  `x-forwarded-host ?? host` (403 on mismatch or an unparseable `Origin`). The
  `Sec-Fetch-Site` branch is unchanged.
  **Evidence** (dev server, curl):
  | Request | Result |
  |---|---|
  | `GET` | `405` |
  | `POST` `Sec-Fetch-Site: same-origin` | `303 → /login` |
  | `POST` no origin headers | `303` |
  | `POST` `Origin: https://evil.test` | `403` |
  | `POST` `Origin` matching `Host` | `303` |
  | `POST` `Sec-Fetch-Site: cross-site` | `403` |
  | `POST` `Origin: not-a-url` | `403` (fails closed) |
  `yarn check`/`lint`/`build` exit 0.

- [x] 5. **Full verify.**
  | Command | Result |
  |---|---|
  | `yarn test` | 190 passed (26 files) |
  | `yarn lint` | exit 0 |
  | `yarn check` | exit 0 |
  | `yarn build` | exit 0 |

## Verify

- `yarn test` / `yarn lint` / `yarn check` / `yarn build` clean.
- `/platform/security` and `/platform/system-health` as an out-of-list role
  (e.g. `operations` for `/security`): redirect to `/platform`. As an allowed
  role: page renders. (No live multi-role staff login — DB role-list check +
  the shared guard is the evidence, as for F-21.)
- `/platform/plans-billing` unchanged: owner/admin in, others redirected.
- Storefront: track one order by token, reload 13+ times — no lockout now;
  a scripted burst past 30 still gets "Too many attempts".
- `/api/auth/reset`: `GET` → 405; same-origin `POST` → 303 → `/login` with
  cookies cleared; cross-origin/cross-site `POST` → 403.

## Out of scope

- Retrofitting `requirePlatformRoute` across every `/platform` page that is
  already correctly gated at its action (revenue, domains, merchants,
  audit-logs, communications, support) — not broken, leave them. (The
  `communications`/`support` dead-shell residual was raised separately as F-25.)
- The token-first reorder of `getStorefrontOrderTracking` (F-22 fuller fix) —
  the limit bump is the agreed mitigation.
- F-13 (platform query fan-out), F-14 (untested modules), F-19.

## Findings

### route-boundary-hardening/F-21 [P2] closed - Widening the plan-read gate leaves /platform/plans-billing with no role guard

**File:** src/app/platform/plans-billing/page.tsx:8
**Found:** 2026-09-03 by /audit (scope: current; lens: security)
**Why it matters:** The F-07 fix regated `getPlatformPlansAction` from
owner/admin to all seven staff roles (correct: the plan catalogue is shown on
`/platform` and `/platform/merchants`). But `/platform/plans-billing` had no
route-level RBAC — `platform/layout.tsx` only checks "active platform staff",
and `PLATFORM_RBAC_RULES['/platform/plans-billing']` was enforced nowhere except
`PlatformNav` link visibility. After the widening, a non-owner/admin role
navigating to `/platform/plans-billing` by URL saw the full `PlansBillingClient`
with real plan data and dead Create/Edit/Toggle controls.
**Resolution:** Repair shipped on `fix/platform-console-consolidation` (spec
step 4): `PlansBillingPage` runs
`try { await verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/plans-billing']) } catch { redirect('/platform') }`
before the plan read. On `fix/route-boundary-hardening` this was refactored to
`await requirePlatformRoute('/platform/plans-billing')` (same semantics, shared
helper). Re-reviewed by /audit twice — (scope: src/app/platform) 2026-09-04
against `5c1e7ba`, and (scope: current) 2026-09-03 on the refactor: guard runs
before `getPlatformPlansAction()` and any JSX, `redirect` sits outside the
`try` so `NEXT_REDIRECT` is not swallowed, `verifyPlatformStaff` is the same
gate the write actions use. Original defect gone, no new defect. Closed.

### route-boundary-hardening/F-22 [P3] closed - Order-tracking throttle also rate-limits the valid-token path

**File:** src/app/actions/storefront-tracking.ts:63
**Found:** 2026-09-03 by /audit (scope: current; lens: security)
**Why it matters:** The F-16 fix enforced `track:ip:<ip>` at 12 / 10 min at the
top of `getStorefrontOrderTracking`, before the token check. The storefront
order page calls this action on every SSR render with the URL token, so a
customer holding a valid 256-bit tracking token who reloaded their link more
than 12 times in 10 minutes was locked out of their own order.
**Resolution:** `TRACK_MAX_PER_WINDOW` raised 12 → 30 (10-min window unchanged),
a single const consumed by both `getStorefrontOrderTracking` and
`lookupCustomerOrder`; the doc comment records the token-first reorder as the
fuller fix. 30 / 10 min clears any realistic reload pattern while still making
brute force of the ~10^8 Ghana-mobile space + a valid `ORD-XXXXXX` infeasible.
Verified: local PostgREST fixed-window simulation at max 30 → 30 allowed then
blocked. Re-reviewed by /audit (scope: current; lens: security) 2026-09-03:
throttle still runs before the token/phone check, bounded, per-IP, fixed window,
fails open on DB error — unchanged design. Original friction gone, no new
defect. Closed.

### route-boundary-hardening/F-23 [P3] closed - /api/auth/reset redirect and origin check have minor residuals

**File:** src/app/api/auth/reset/route.ts:20
**Found:** 2026-09-03 by /audit (scope: current; lens: security)
**Why it matters:** Two small issues left by the F-17 fix, neither a security
regression. (1) The handler returned a `307` where `303 See Other` is correct
for "this POST changed state, now GET that page". (2) The cross-origin check
compared the `Origin` header against `new URL(request.url).origin`, which is
fragile behind a reverse proxy / custom-domain edge (a legitimate same-origin
`POST` could get a false `403`). Fails safe (deny, not bypass); `Sec-Fetch-Site`
is the primary guard regardless.
**Resolution:** The redirect is now `NextResponse.redirect(url, 303)`, and the
`Origin` check compares `new URL(origin).host` against `x-forwarded-host ?? host`
(403 on mismatch or an unparseable `Origin`); the `Sec-Fetch-Site` branch is
unchanged. Verified by dev-server curl: `GET` → 405, same-origin `POST` → 303 →
`/login`, matching-host `Origin` → 303, `Origin: https://evil.test` /
`Origin: not-a-url` / `Sec-Fetch-Site: cross-site` → 403. Re-reviewed by /audit
(scope: current; lens: security) 2026-09-03: a browser cannot set `Origin`,
`Host`, or `x-forwarded-*` on a cross-site `fetch`, so a forged same-host match
is not reachable; `none` is still allowed for address-bar navigation. Original
residuals gone, no new defect. Closed.

### route-boundary-hardening/F-24 [P2] closed - Several /platform routes are not role-gated when their action gate is loose

**File:** src/app/platform/security/page.tsx:9
**Found:** 2026-09-04 by /audit (scope: src/app/platform; lens: security)
**Why it matters:** Where a `/platform` page's data action was a bare
`verifyPlatformStaff()` (no role list), the route was reachable by all seven
staff roles via direct URL even though `PLATFORM_RBAC_RULES` intends a subset —
the same gap F-21 had. `/platform/security` exposed the full `platform_staff_users`
roster (email, role, `is_active`, `mfa_enabled`) and the RBAC UI to
`operations`/`support`/`finance`/`tech_admin`; `/platform/system-health`
exposed infrastructure status. Writes stayed owner/admin-gated, so disclosure
not escalation — hence P2.
**Resolution:** New `src/lib/auth/require-platform-route.ts` →
`requirePlatformRoute(route)` (fail-closed on an unknown route key, else
`verifyPlatformStaff(PLATFORM_RBAC_RULES[route])` with `redirect('/platform')`
on throw, returns `{ user, role }`). Applied to `security/page.tsx`,
`system-health/page.tsx`, and `plans-billing/page.tsx`. Defence in depth: the
two loose actions now pass the route's role list to `verifyPlatformStaff`
instead of a bare call (each page is the action's only caller). `yarn
check`/`lint`/`build`/`test` (190) clean. Re-reviewed by /audit (scope: current;
lens: security) 2026-09-03: `redirect` is called from the `catch` and the
unknown-key branch, both outside the `try`; `verifyPlatformStaff` only ever
`throw`s `Error`, never `redirect`s, so no `NEXT_REDIRECT` is swallowed. All
three pages call the guard before any data fetch or JSX; `security/page.tsx`
still gets `userRole` from the return. A full sweep found no remaining bare
`verifyPlatformStaff()` in `src/app/`. No live non-owner staff session (only a
`platform_owner` is seeded, and owner bypasses role checks), so the redirect
path is evidenced by the shared gate's role logic + `PLATFORM_RBAC_RULES`
values, as for F-21. Original disclosure gap gone, no new defect. Closed.

### Still open at completion (not part of this fix)

- **F-25 [P3] open** — `communications` and `support` `/platform` pages still
  render an interactive client shell (empty data) to out-of-RBAC roles because
  they swallow the action's auth error. Raised by this fix's audit; same class
  as F-21/F-24, lower stakes (no data, writes gated). Non-blocking.
- **F-13 [P2] open** — platform overview query fan-out (whole-table scans +
  `listUsers({ perPage: 1000 })` cap).
- **F-14 [P2] open** — five pure `src/utils` modules with no tests despite the
  declared gate.
- **F-19 [P3] open** — storefront order still trusts `batchId` / `pickupStoreId`
  from the payload (same hygiene gap F-01 named for `variantId`).
