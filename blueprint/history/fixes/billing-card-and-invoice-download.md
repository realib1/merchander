# Fix: Real Invoice File Download & Billing Payment Method Honesty

## Overview
- **Type:** Fix
- **Status:** verified
- **Scope:** Provide genuine downloadable invoice receipt files with dual preview/download actions, eliminate misleading billing card states for free Starter merchants, add full card & MoMo input in `BillingMethodModal`, calculate live outbound bot quota, and make trial copy dynamic.

## The Problem
1. **Fake "Download" Invoice:**
   - In `BillingInvoicesTable.tsx`, the action icon was `<Download />` but clicking it merely opened the preview modal or displayed a toast without downloading any invoice file to the user's computer.
   - Merchants need an actual downloadable invoice receipt file (styled, standalone HTML/PDF document) they can save, archive, or email for accounting and tax reporting.
2. **Mocked / Misleading Card States in Billing:**
   - In `BillingMethodCard.tsx`, merchants on the free Starter plan were shown copy threatening "service disruptions" if they did not attach a billing method ("Connect a tokenized Card or Mobile Money wallet to enable automatic monthly plan renewals and prevent service disruptions"), despite Starter being 100% Free.
   - If a card was attached, it showed `(Auto-renew active)` even when the account was on the free Starter tier with no recurring charges.
3. **Incomplete Billing Method Modal:**
   - `BillingMethodModal.tsx` only had a single `holderName` input for cards that redirected to Paystack with a 1 GHS charge. There was no direct card entry form (Card Number, Expiry, CVV), no Luhn validation, and no test card helper for development/demo environments.
   - It did not wire `updateTenantBillingMethod()` from `payments-online.ts`, making local or manual card/MoMo connections impossible.
4. **Hardcoded Bot Quota & Trial Copy:**
   - In `src/app/actions/settings-subscription.ts`, `botMessages.current` was hardcoded to `0` instead of counting actual outbound messages sent by the tenant from the `messages` table.
   - In `CurrentPlanCard.tsx`, the trial progress banner hardcoded "All Growth Pro features are unlocked" regardless of the account's selected tier.

## The Fix
1. **Real Invoice File Download (`BillingInvoicesTable.tsx`):**
   - Implemented `handleDownloadInvoice(invoice)` that generates and triggers immediate browser download of an official standalone invoice file (`Merchander-Invoice-${inv.invoiceNumber}.html`) featuring:
     - Company branding (Merchander Cloud Commerce, TIN/VAT GH-7749102-M, Accra, Ghana).
     - Invoice details, issue date, status badge, itemized plan details, tax, and total.
     - Print-optimized stylesheet (`@media print`) and an embedded "Print to PDF" trigger.
   - Provided two distinct action buttons per row/card:
     - `<Eye size={14} />` "View Receipt" (opens in-app modal).
     - `<Download size={14} />` "Download Invoice" (downloads the real file).
   - In the modal, provided both "Download HTML" and "Print / Save as PDF".
2. **Honest Starter Plan Billing Card (`BillingMethodCard.tsx`):**
   - For merchants on the free Starter plan without a card: displays honest, non-threatening copy explaining that Starter is free forever and adding a payment method is optional unless upgrading.
   - If a card is linked on Starter: displays "Active Payment Method • Free Starter Plan (No renewal charges)" instead of `(Auto-renew active)`.
3. **Comprehensive Card & MoMo Entry (`BillingMethodModal.tsx`):**
   - Added full card input fields: Cardholder Name, Card Number (with automatic spacing and brand detection), Expiry Date (MM/YY), and CVV.
   - Included 1-click test card autofill for development/staging environments.
   - Wired `updateTenantBillingMethod()` so merchants can save their billing method directly and see it immediately reflected in the UI and database.
   - Added direct MoMo save and test number autofill.
4. **Live Bot Usage Calculation (`settings-subscription.ts`):**
   - Queried `messages` table count for `direction = 'outbound'` to supply real live bot message usage instead of hardcoded 0.
5. **Dynamic Trial Banner (`CurrentPlanCard.tsx`):**
   - Used `formatTierName(settings.tier)` for dynamic trial copy.
6. **Automated Unit Tests:**
   - Updated `settings-subscription.test.ts` to test outbound bot quota calculation and Starter billing method behavior.

## Build Steps
### Step 1: Real Invoice File Download, Honest Billing Cards & Full Payment Method Entry [COMPLETED]
- Updated `BillingInvoicesTable.tsx` with standalone HTML invoice file download and dual preview/download actions.
- Updated `BillingMethodCard.tsx` with honest Starter tier states.
- Updated `settings-subscription.ts` to query live outbound messages for bot usage.
- Updated `CurrentPlanCard.tsx` with dynamic trial tier copy.

### Step 2: Complete Removal of Fake Cards, Dual-Store Purging & PCI-DSS Tokenization [COMPLETED]
- Defined `isFakeCard` in `src/utils/subscription.ts` to identify mock/test card fingerprints (`•••• 4242`, `•••• 4081`, demo holders, unverified cards without gateway provider/auth codes).
- Updated `getSubscriptionSettings()` in `settings-subscription.ts` to:
  - Respect explicit `paymentMethod: null` without falling back to legacy relational rows.
  - Automatically filter out fake/mock cards and purge them asynchronously from both `tenant_settings.settings_data.subscription` and `tenant_subscriptions.payment_method` in the database.
- Synchronized `tenant_subscriptions.payment_method` in `removeTenantBillingMethod`, `updateTenantBillingMethod`, and `verifyBillingMethodStatus` in `src/app/actions/payments-online.ts`.
- Removed all fake direct card forms, test card buttons, and raw CVV inputs in `BillingMethodModal.tsx`. Replaced with authentic PCI-DSS Paystack tokenization flow (`handleCardGatewayAuthorize` triggering a 1 GHS reversible token authorization).
- Cleaned starter account seeding in `scratch/seed-accounts.mjs` to default `payment_method: null` and `price_monthly: 0.0`.
- Added unit tests in `settings-subscription.test.ts` verifying fake card filtering and explicit `null` preservation.
- Verified `yarn test` (73/73 files, 637/637 tests passing), `yarn check` (0 errors), `yarn eslint` (0 errors), and `yarn build` (58/58 routes generated).

## Verify
- `yarn test`: all 73 test suites pass (637/637 tests).
- `yarn check`: TypeScript typecheck passes with 0 errors.
- `yarn lint`: ESLint passes with 0 errors.
- `yarn build`: Next.js production build succeeds with 58/58 routes.
