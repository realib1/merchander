# Fix: Plan and Billing Pricing Synchronization, Invoice History & Data Integrity

## Overview
- **Type:** Fix
- **Status:** verified
- **Scope:** Synchronize subscription tier pricing and quotas across actions and UI, unify `tenant_subscriptions` and `tenant_settings.settings_data.subscription` stores to persist payment methods and invoices, provide receipt preview/print, and add automated tests.

## The Problem
1. **Pricing & Quotas Discrepancy:**
   - In `src/app/actions/settings-subscription.ts`, hardcoded prices (Starter: 150 GHS, Pro: 350 GHS, Enterprise: 1800 GHS) contradict the canonical prices displayed in `PlanTiersGrid.tsx` and processed in `payments-online.ts` (Starter: 0 GHS / Free, Pro: 250 GHS / mo, Enterprise: 750 GHS / mo).
   - As a result, merchants on the free Starter plan see an inaccurate "GH₵ 150 / month" on their `CurrentPlanCard.tsx` instead of "Free" or "GH₵ 0".
   - Quotas also differed: `PlanTiersGrid` promises 1 staff seat on Starter and 1,000 bot messages on Pro, whereas `settings-subscription.ts` returned 3 staff seats on Starter.
2. **Dual Store Disconnection (Disappearing Invoices & Payment Methods):**
   - Online payments (`payments-online.ts`) save paid invoices, tokenized cards, and MoMo billing methods to `tenant_settings.settings_data.subscription`.
   - In contrast, `getSubscriptionSettings()` in `settings-subscription.ts` only queried `tenant_subscriptions`, ignoring `tenant_settings.settings_data.subscription`.
   - Furthermore, `getSubscriptionSettings()` hardcoded `invoices = [trialInvoice]`, wiping out all real paid invoice records on page refresh.
   - `updateSubscriptionTier()` only updated `tenant_subscriptions`, leaving `settings_data` out of sync.
3. **No Receipt View or Print Action:**
   - In `BillingInvoicesTable.tsx`, clicking the receipt download button merely triggered `toast.success(...)` with no printable receipt or preview modal.

## The Fix
1. **Canonical Subscription Configuration:**
   - Define a shared, typed `SUBSCRIPTION_TIER_CONFIG` in `src/utils/subscription.ts` containing single-source-of-truth tier names, prices (Starter: 0, Pro: 250, Enterprise: 750), annual discounts, and quota limits.
   - Use `SUBSCRIPTION_TIER_CONFIG` in `settings-subscription.ts`, `PlanTiersGrid.tsx`, `SubscriptionView.tsx`, and `CurrentPlanCard.tsx`.
2. **Unified Data Layer in Subscription Action:**
   - In `src/app/actions/settings-subscription.ts`, query both `tenant_subscriptions` and `tenant_settings.settings_data.subscription`.
   - Merge fields defensively: prioritize active tier, billing cycle, renewal date, and genuine payment method (`card` or `mtn_momo`).
   - Retain all paid invoices alongside the generated 14-day trial invoice (`INV-TR-...`) without duplicates.
   - In `updateSubscriptionTier()`, synchronize both `tenant_subscriptions` and `tenant_settings.settings_data.subscription` using canonical prices.
3. **Printable Invoice Receipt Preview:**
   - Add a modal receipt preview in `BillingInvoicesTable.tsx` displaying the merchant trading name, invoice number, billing date, itemized tier subscription, tax/amount, payment method, and a `window.print()` action.
4. **Automated Unit Tests:**
   - Add unit tests in `src/app/actions/settings-subscription.test.ts` verifying data merging, canonical price reflection, and trial invoice preservation.
   - Update `src/utils/subscription.test.ts` with test coverage for `SUBSCRIPTION_TIER_CONFIG`.

## Build Steps
### Step 1: Plan and Billing Pricing Synchronization, Unified Persistence & Receipt Preview
- Export `SUBSCRIPTION_TIER_CONFIG` from `src/utils/subscription.ts`.
- Update `src/app/actions/settings-subscription.ts` to merge `tenant_subscriptions` with `settings_data.subscription` and unify `updateSubscriptionTier()`.
- Align `PlanTiersGrid.tsx`, `SubscriptionView.tsx`, and `CurrentPlanCard.tsx` with canonical config.
- Enhance `BillingInvoicesTable.tsx` with printable receipt preview modal.
- Add unit tests in `src/app/actions/settings-subscription.test.ts` and update `src/utils/subscription.test.ts`.
- **Done when:** `yarn test` passes all tests, `yarn check` and `yarn lint` report 0 errors, and `yarn build` succeeds.

## Verify
- `yarn test`: all unit test suites pass cleanly (73/73 test files, 635 tests).
- `yarn check`: TypeScript typecheck passes with 0 errors.
- `yarn lint`: ESLint passes with 0 errors, 0 warnings.
- `yarn build`: Next.js production build succeeds with 58/58 routes.
