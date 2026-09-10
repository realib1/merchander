# Fix: Plan & Billing Modernization, Trial Invoicing & Humanized Renewal (F-21 to F-24)

Type: Fix
Status: verified
Fixes: F-21, F-22, F-23, F-24

## The problem

1. **Unreadable Raw Renewal Dates (F-21):** In `CurrentPlanCard.tsx`, the renewal text prints raw ISO timestamps directly (`Renewal on 2026-09-23T18:46:56.697+00:00 • Monthly Cycle`). This technical jargon confuses merchants and looks unprofessional.
2. **Missing 14-Day Free Trial Invoices (F-22):** In `src/app/actions/settings-subscription.ts`, `getSubscriptionSettings()` leaves `invoices: []` completely empty. There is no official record or receipt of the 14-day free trial ($0.00) in the "Billing History & Invoices" table for new or trialing merchants.
3. **Misleading Trial Payment States (F-23):** Merchander offers a 14-day free trial with no credit card required at signup. Displaying a fake card with "Tokenized Mandate" or auto-debit active is deceptive to merchants who never entered payment details. Merchants need transparent communication: "No payment method required during your 14-day free trial", with a voluntary "Add Payment Method" button (Card or Mobile Money) before the trial expires.
4. **Disjointed Plan & Billing UI (F-24):** The current Plan & Billing view uses disparate heavy cards, lacks a visual trial duration timeline (e.g. "Day 1 of 14 • 13 days remaining"), has cluttered quota meters, and has inconsistent plan tier names between platform plans and client cards.

## The fix

Execute a focused, transparent overhaul across 3 clean build steps:

1. **Step 1: Subscription Formatting & Invoicing Logic Helper (F-21, F-22, F-23)**
   - Create `src/utils/subscription.ts` providing pure, testable functions:
     - `formatRenewalDate(renewalDate, cycle, isTrial)`: Formats dates into human-readable text (e.g. `Trial ends on Sep 23, 2026 (14 days left) • Billed monthly thereafter`).
     - `getTrialCountdown(renewalDate)`: Calculates elapsed days, remaining days, progress percentage, and humanized timeline text.
     - `generateTrialInvoice(tenantId, createdAt, tier)`: Generates an official `BillingInvoice` representing the 14-day free trial ($0.00).
   - Add companion automated unit tests in `src/utils/subscription.test.ts` satisfying the project logic testing gate.

2. **Step 2: Subscription Actions & Trial Invoicing (F-22, F-23)**
   - Update `getSubscriptionSettings()` in `src/app/actions/settings-subscription.ts` to detect trial status from `renewal_date`, and when `invoices` is empty, return the generated 14-Day Free Trial invoice (`INV-TR-XXXXXX`, `GH₵ 0.00`, `Active Trial`).
   - Preserve honest payment method status (`sub?.payment_method || null`) without fake mandates during trial.

3. **Step 3: Modern Plan & Billing UI Overhaul (F-21, F-23, F-24)**
   - **`CurrentPlanCard.tsx`**: Redesign into a modern Bento overview card with bold title, clean status pill, human-readable renewal text, visual trial duration countdown progress bar, and sleek resource quota meters.
   - **`BillingMethodCard.tsx`**: For trialing merchants without a card, present a reassuring "No payment method required during trial" card with an "Add Payment Method" action. When connected, display a sleek virtual card or MoMo wallet card with genuine details.
   - **`BillingInvoicesTable.tsx`**: Modernize the ledger to cleanly present the 14-Day Free Trial invoice with formatted dates, `GH₵ 0.00`, and receipt preview.
   - **`PlanTiersGrid.tsx` & `SubscriptionView.tsx`**: Align tier naming (`Starter`, `Growth Pro`, `Enterprise Scale`), enhance the monthly/annual toggle with savings callout, and smooth out transitions.

## Build steps

- [x] **Step 1 - Logic & Invoicing Helper (F-21, F-22, F-23)** - Create `src/utils/subscription.ts` with natural renewal date formatting, trial countdown calculations, and trial invoice generation, backed by comprehensive unit tests in `src/utils/subscription.test.ts`. *Done when:* Unit tests pass and date/trial math is verified.
- [x] **Step 2 - Settings Action & Trial Invoicing (F-22, F-23)** - Update `getSubscriptionSettings` in `src/app/actions/settings-subscription.ts` to supply the 14-day trial invoice when invoices are empty, detect trial state, and preserve genuine payment method status. *Done when:* Action returns the trial invoice record and typecheck passes.
- [x] **Step 3 - Modern Plan & Billing UI Overhaul (F-21, F-23, F-24)** - Overhaul `CurrentPlanCard.tsx`, `BillingMethodCard.tsx`, `BillingInvoicesTable.tsx`, `PlanTiersGrid.tsx`, and `SubscriptionView.tsx` with modern Bento styling, visual trial countdown, honest no-card messaging, and responsive layout. *Done when:* Renewal text reads naturally, 14-day trial invoice displays in the table, billing method card shows honest trial status, and `yarn check` passes.

## Verify

- `yarn test src/utils/subscription.test.ts` passes.
- `yarn test` passes all tests.
- `yarn check` (`tsc --noEmit`) passes with 0 errors.
- `yarn lint` passes with 0 errors.
- `yarn build` passes.
- Opening `/dashboard/settings/subscription` shows:
  - Natural renewal date ("Trial ends on Sep 23, 2026 (14 days left) • Billed monthly thereafter").
  - 14-day trial invoice in Billing History & Invoices (`INV-TR-...`, `GH₵ 0.00`, `Active Trial`).
  - Transparent "No payment method required during your 14-day free trial" billing method card.
  - Modern Bento styling and responsive layout.

## Findings

### plan-and-billing-modernization/F-21 [P2] closed - Raw ISO timestamp and technical cycle text in subscription renewal date

**File:** src/app/dashboard/settings/subscription/components/CurrentPlanCard.tsx:74
**Found:** 2026-09-09 by user review
**Why it matters:** The subscription header prints raw ISO strings directly (`Renewal on 2026-09-23T18:46:56.697+00:00 • Monthly Cycle`). This technical jargon is unreadable and intimidating to retail merchants.
**Suggested fix:** Format the renewal date into natural language (e.g. `Trial ends on Sep 23, 2026 (14 days left) • Billed monthly thereafter` or `Renews on Sep 23, 2026 • Billed monthly`).
**Resolution:** Fixed on 2026-09-09 in fix/plan-and-billing-modernization. Created `formatRenewalDate` in `src/utils/subscription.ts` (tested in `src/utils/subscription.test.ts`) that transforms raw ISO strings into friendly, conversational phrasing (`Trial ends on Sep 23, 2026 (14 days left) • Billed monthly thereafter` or `Renews on Oct 1, 2026 • Billed monthly`). Integrated into `CurrentPlanCard.tsx`.

### plan-and-billing-modernization/F-22 [P2] closed - 14-Day Free Trial not captured in Billing History & Invoices

**File:** src/app/actions/settings-subscription.ts:72
**Found:** 2026-09-09 by user review
**Why it matters:** `getSubscriptionSettings` returns `invoices: []`, leaving the Billing History table empty for newly registered or trialing merchants. There is no official record or receipt of the 14-day free trial, leading merchants to wonder what plan they are on.
**Suggested fix:** Automatically generate an official 14-day free trial invoice record (`INV-TR-XXXXXX`, `GH₵ 0.00`, `Active Trial`) in `getSubscriptionSettings` when invoices are empty.
**Resolution:** Fixed on 2026-09-09 in fix/plan-and-billing-modernization. Created `generateTrialInvoice` in `src/utils/subscription.ts` and updated `getSubscriptionSettings` in `src/app/actions/settings-subscription.ts` to automatically populate the 14-day free trial invoice (`INV-TR-XXXXXX`, `GH₵ 0.00`, `Active Trial`) for trialing accounts.

### plan-and-billing-modernization/F-23 [P2] closed - Billing method shows misleading tokenized mandate or empty state instead of honest no-card trial status

**File:** src/app/dashboard/settings/subscription/components/BillingMethodCard.tsx:157
**Found:** 2026-09-09 by user review
**Why it matters:** Free trial accounts do not require upfront payment details at signup. Displaying a fake card with "Tokenized Mandate" or auto-debit active is deceptive and leads merchants to believe they have already been charged.
**Suggested fix:** During the 14-day free trial, explicitly communicate that no payment method is required, while offering a voluntary "Add Payment Method" (Card or Mobile Money) action before the trial expires.
**Resolution:** Fixed on 2026-09-09 in fix/plan-and-billing-modernization. Updated `BillingMethodCard.tsx` to detect trial status and explicitly communicate "No payment method required during your 14-day free trial" with a clear CTA to voluntarily connect Card or Mobile Money (MTN MoMo / Telecel Cash) anytime before trial expiration, eliminating deceptive fake mandates.

### plan-and-billing-modernization/F-24 [P2] closed - Plan and Billing UI lacks modern communicable SaaS structure and trial progress visibility

**File:** src/app/dashboard/settings/subscription/components/SubscriptionView.tsx:156
**Found:** 2026-09-09 by user review
**Why it matters:** The current subscription view stacks disjointed cards with heavy colors, lacks a visual trial duration progress bar, and has inconsistent tier naming between platform plans and client cards.
**Suggested fix:** Overhaul the Plan & Billing UI with modern Bento cards, trial duration progress bars, sleek quota meters, clear tier selection, and clean responsive invoice tables.
**Resolution:** Fixed on 2026-09-09 in fix/plan-and-billing-modernization. Overhauled `CurrentPlanCard.tsx` with a modern Bento-style layout, visual 14-day trial duration progress bar (`Day 1 of 14 • 13 days remaining`), sleek quota meters with capacity bars, updated `PlanTiersGrid.tsx` with Ghanaian social commerce tiers, and modernized `BillingInvoicesTable.tsx`.
