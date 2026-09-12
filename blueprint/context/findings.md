# Findings

> **Generated file.** The findings ledger: review findings raised by /audit
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. /implement marks repaired findings `fixed`, a later /audit pass
> moves them to `closed`, and /complete refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-01 [P0] open - Entire test suite crashes before running any tests

**File:** `vitest.config.ts` (root) / all 84 test files
**Found:** 2026-09-12 by /audit (scope: path `src/app/api/webhooks`, `src/lib/payments`, `src/app/actions/payments-online`; lens: security, quality, tests)
**Why it matters:** `yarn test` exits with code 1 and runs zero tests. Every test file fails immediately with `TypeError: Cannot read properties of undefined (reading 'config')`. The test gate is declared ON in `AGENTS.md`; a suite that cannot run offers no safety net. The previous commit (Feature 32) passed Husky pre-commit, which only runs lint + tsc, not tests — so this regression went undetected.
**Suggested fix:** Investigate the Vitest worker startup error. The warning `ESM syntax in a file loaded as CommonJS (vitest.config.ts:2:1)` suggests the root cause: `vitest.config.ts` uses ESM `import` syntax but the package does not declare `"type": "module"`. Add `"type": "module"` to `package.json` or rename `vitest.config.ts` → `vitest.config.mts`; then re-run `yarn test` to verify all 84 suites pass.
**Resolution:**

---

### F-02 [P1] open - Hubtel webhook authorizes before signature verification completes

**File:** `src/app/api/webhooks/hubtel/route.ts:44-84`
**Found:** 2026-09-12 by /audit (scope: path `src/app/api/webhooks/hubtel`; lens: security)
**Why it matters:** `isAuthorized` is set at line 44 (global env Basic Auth check) _before_ the order is resolved. If the global env credentials are set and match, the request passes even if it came from a different tenant's Hubtel account. Per-tenant credential validation (lines 73-78) only runs when the global check already failed. A merchant with valid global-env credentials could send a spoofed Hubtel callback for another tenant's order and have it processed — the idempotency check guards payment duplication but not cross-tenant data writes.
**Suggested fix:** Invert the auth order: always attempt per-tenant credential validation first when a `clientReference` starting with `ord_` is present; fall back to global env only for the SaaS billing webhook path (which does not use order references). If neither succeeds, return 401 before processing.
**Resolution:**

---

### F-03 [P1] open - Paystack webhook signature is verified against client-supplied tenantId

**File:** `src/app/api/webhooks/paystack/route.ts:70-79`
**Found:** 2026-09-12 by /audit (scope: path `src/app/api/webhooks/paystack`; lens: security)
**Why it matters:** The `tenantId` used to resolve the per-tenant secret key (line 71) comes from `parsedPayload.data?.metadata`, which is part of the unverified JSON body. An attacker who knows any tenant's `tenantId` can embed it in a forged webhook to cause the server to load that tenant's secret key and attempt HMAC verification against a crafted payload. If they also know the secret key (e.g. via a leaked tenant setting), they can forge a valid signature. More practically, supplying a `tenantId` that has no stored key forces fallback to the global env key, widening the attack surface.
**Suggested fix:** Perform the initial signature check against the global env key only. If that fails, attempt per-tenant key resolution and re-verify. Reject the request if both checks fail. Never use the unauthenticated `tenantId` from the body to select the verification key on the first pass.
**Resolution:**

---

### F-04 [P2] open - Hubtel amount is taken directly from the webhook payload without independent verification

**File:** `src/app/api/webhooks/hubtel/route.ts:52,120-132`
**Found:** 2026-09-12 by /audit (scope: path `src/app/api/webhooks/hubtel`; lens: security)
**Why it matters:** The `amount` recorded in the `payments` table is taken from `data?.Amount || data?.amount || payload.Amount`. Unlike Paystack (which returns pesewas tied to the reference), Hubtel does not sign the amount, so a modified callback with an inflated or zeroed amount would be recorded as-is. The partial-payment guard (`amount >= matchedOrder.total_amount`) catches order-status escalation, but the payment record itself still stores the attacker-supplied figure.
**Suggested fix:** After the Hubtel callback passes auth, call `checkHubtelTransactionStatus(transactionId)` server-to-server to retrieve the verified amount, then use that amount for the `payments.insert`. Accept the webhook body amount only as a hint or skip it entirely.
**Resolution:**

---

### F-05 [P2] open - `decryptSecret` called unconditionally on Paystack order checkout path

**File:** `src/app/actions/payments-online.ts:475`
**Found:** 2026-09-12 by /audit (scope: path `src/app/actions/payments-online`; lens: quality)
**Why it matters:** Line 475: `const secretKey = rawSecret ? decryptSecret(rawSecret) : undefined;`. Unlike the Hubtel path which first calls `isEncrypted()` before decrypting (webhook route line 27), the `initiateOrderOnlinePayment` Paystack path calls `decryptSecret` on the raw value regardless. If the stored key is already plaintext (merchant entered key but encryption was skipped), `decryptSecret` will either corrupt the key or throw, causing payment initiation to fail silently.
**Suggested fix:** Mirror the webhook pattern: `const secretKey = rawSecret ? (isEncrypted(rawSecret) ? decryptSecret(rawSecret) : rawSecret) : undefined;`
**Resolution:**

---

### F-06 [P3] open - Vitest config ESM warning is suppressed rather than fixed

**File:** `vitest.config.ts:2`
**Found:** 2026-09-12 by /audit (scope: path `src/app/api/webhooks`; lens: quality)
**Why it matters:** The Vite config emits a warning about ESM syntax being used in a CommonJS-loaded file on every `yarn test` run. This is cosmetic today but is flagged as a future breaking change in Vite. The warning is the precursor to F-01.
**Suggested fix:** Add `"type": "module"` to `package.json` (if compatible) or rename to `vitest.config.mts`. This is the same fix as F-01; resolving F-01 closes F-06 automatically.
**Resolution:**

---

### F-07 [P3] fixed - Root NotFound component is marked 'use client' despite zero client-side interactivity

**File:** `src/components/layout/NotFound.tsx:1`
**Found:** 2026-09-12 by /audit (scope: path `src/app/not-found.tsx`; lens: quality, performance)
**Why it matters:** `src/components/layout/NotFound.tsx` specifies the `'use client'` directive, forcing Next.js to ship the component code and React hydration bundle to the client browser on 404 responses. The component contains no hooks (`useState`, `useEffect`, `usePathname`), no state, no browser APIs, and no event handlers. It is purely presentational and can be rendered as a Server Component.
**Suggested fix:** Remove the `'use client'` directive from `src/components/layout/NotFound.tsx` so both it and `src/app/not-found.tsx` render as zero-JS Server Components.
**Resolution:** Removed `'use client'` directive from `src/components/layout/NotFound.tsx`. Both `NotFound` and `src/app/not-found.tsx` now execute as zero-JS Server Components.

---

### F-08 [P3] fixed - Hardcoded hex focus ring color drifts from brand theme tokens

**File:** `src/components/layout/NotFound.tsx:57`
**Found:** 2026-09-12 by /audit (scope: path `src/app/not-found.tsx`; lens: quality)
**Why it matters:** The home CTA button uses `focus:ring-[#FC5302]` with a hardcoded hex literal, whereas adjacent text and background styles use the semantic design token `text-brand-primary` and `bg-brand-primary`. Hardcoding hex colors circumvents the centralized theme token configuration in `globals.css` and risks inconsistency if brand palette values change.
**Suggested fix:** Replace `focus:ring-[#FC5302]` with `focus:ring-brand-primary`.
**Resolution:** Replaced `focus:ring-[#FC5302]` with `focus-visible:ring-brand-primary` on both Home and Dashboard CTA buttons.

---

### F-09 [P3] fixed - Duplicate Image elements in DOM for mobile and desktop viewports

**File:** `src/components/layout/NotFound.tsx:35-42,65-75`
**Found:** 2026-09-12 by /audit (scope: path `src/app/not-found.tsx`; lens: performance, quality)
**Why it matters:** The exact same Next.js `<Image src="/images/404-woman.png" ... />` element is declared twice in the JSX—once wrapped in `md:hidden` and once in `hidden md:flex`. Both elements are rendered into the initial HTML DOM tree simultaneously, creating redundant DOM nodes.
**Suggested fix:** Refactor the container layout using responsive grid or flex order classes (e.g. `order-first lg:order-last` or CSS grid placement) so that a single `<Image>` element serves both mobile and desktop screen sizes.
**Resolution:** Unified the illustration container into a single responsive `<Image>` element with `priority`, explicit `sizes` attribute, and responsive grid layout.


