# Findings

> **Generated file.** The findings ledger: review findings raised by /audit
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. /implement marks repaired findings `fixed`, a later /audit pass
> moves them to `closed`, and /complete refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

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
