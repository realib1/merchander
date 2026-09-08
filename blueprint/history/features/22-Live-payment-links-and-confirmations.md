# Feature: Live payment links & confirmations

**From build-plan:** feature 22
**Status:** verified

## Goal

Enable customer-facing live payment links, automated WhatsApp payment confirmations and receipts upon webhook settlement, interactive online checkout on the storefront order tracking page, and intelligent payment reminders for pending orders.

## In scope

1. **Pure payment link & message copy utilities (`src/utils/paymentLinks.ts`):**
   - Pure functions to construct customer payment URLs (`${appUrl}/store/${slug}/orders/${orderShortId}?pay=true` and direct checkout links).
   - Warm Ghanaian merchant message formatters:
     - Order payment link message with item summary, total in GH₵, and direct link.
     - Automated payment receipt message with transaction reference, amount paid, payment method, and tracking link.
     - Friendly payment reminder message with outstanding balance and urgency context.
   - Full unit test suite in `src/utils/paymentLinks.test.ts`.

2. **Draft Order & Merchant Approval Integration:**
   - Embed live payment links in draft order capture (`captureDraftOrderFromCart` in `src/lib/intelligence/orders.ts`).
   - Include payment link in proposed reply text when merchant approves `draft_order` in the approval queue.

3. **Automated Webhook Payment Confirmation & Receipt Dispatch:**
   - Enhance Paystack webhook (`src/app/api/webhooks/paystack/route.ts`) and Hubtel webhook (`src/app/api/webhooks/hubtel/route.ts`) to transition order status to `'paid'` / `'processing'`.
   - Automatically compose and dispatch a WhatsApp payment receipt to the customer via `sendOutboundWhatsAppMessage`.
   - Log the outbound confirmation message in `messages` table with `{ payment_id, transaction_ref, order_id }` metadata.
   - Guard with idempotency so duplicate webhook retries never send duplicate receipts or record duplicate payments.
   - Ensure webhook errors in dispatch do not cause webhook retry storms (swallow outbound notice error, return 200 OK to gateway).

4. **Payment Reminder Intelligence & Action:**
   - Server action `sendOrderPaymentReminderAction({ orderId, tenantId })` to generate and send a payment reminder to the customer on WhatsApp.
   - Query unpaid orders with `pending_payment` or `draft` status past due threshold.

5. **Storefront Order Tracking "Pay Online" UI:**
   - Add interactive `StorefrontPaymentCard` to `OrderTrackingView` (`src/app/store/[slug]/orders/[orderId]/components/`):
     - For unpaid orders (`draft`, `pending_payment`): payment method selection (Hubtel Mobile Money USSD prompt or Paystack checkout), phone input for MoMo prompt, "Pay Online" trigger calling `initiateOrderOnlinePayment`.
     - For paid orders (`paid`, `processing`, `dispatched`, `delivered`): verified "Payment Completed" badge with transaction reference and payment date.

## Out of scope

- Physical point-of-sale (POS) terminal hardware integration (handled by existing manual cash/MoMo ledger).
- Rider dispatch and delivery waybill generation (handled in Feature 23: Fulfilment & delivery).
- Automated recurring subscription billing (already handled in Settings/Subscription).

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Payment links & receipt copy pure utilities** - Create `src/utils/paymentLinks.ts` with link builders, payment link WhatsApp copy, payment confirmation receipt copy, payment reminder copy, and unit tests in `src/utils/paymentLinks.test.ts`. *Done when:* `yarn test src/utils/paymentLinks.test.ts` passes with 100% coverage on all branch conditions.
- [x] **Step 2 - Payment link integration in draft orders & approvals** - Update `captureDraftOrderFromCart` in `src/lib/intelligence/orders.ts` and `approveAction` in `src/app/actions/approvals.ts` to generate and inject live payment URLs into the proposed order message copy. *Done when:* Capturing a draft order generates reply text containing the valid store payment link and approval test suite passes.
- [x] **Step 3 - Webhook automated payment confirmation & receipt dispatch** - Update `src/app/api/webhooks/paystack/route.ts` and `src/app/api/webhooks/hubtel/route.ts` to update order status, resolve customer channel identity, format payment receipt copy, and dispatch outbound WhatsApp confirmation receipt. *Done when:* Webhook tests verify that a successful payment callback marks the order paid and dispatches the confirmation receipt via WhatsApp.
- [x] **Step 4 - Proactive payment reminders action** - Add `sendOrderPaymentReminderAction` and reminder generation logic in `src/app/actions/payments-online.ts` / `src/lib/intelligence/reminders.ts` with validation of unpaid status and phone number. *Done when:* Unit tests verify reminder generation and sending for unpaid orders.
- [x] **Step 5 - Storefront order tracking "Pay Online" UI** - Create `StorefrontPaymentCard.tsx` and integrate it into `OrderTrackingView.tsx` with mobile money prompt dispatch, gateway redirect, and verified paid receipt view. *Done when:* Storefront tracking page renders payment options for pending orders and completed receipt for paid orders, and `yarn check` + `yarn test` + `yarn lint` are clean.

## Files / areas

- `src/utils/paymentLinks.ts` (NEW) - pure link generators, WhatsApp message copy formatters
- `src/utils/paymentLinks.test.ts` (NEW) - unit tests for link generation and message copy
- `src/lib/intelligence/orders.ts` - embed payment link in draft order confirmation reply
- `src/app/actions/approvals.ts` - ensure payment link is preserved/rendered on draft order approval
- `src/app/api/webhooks/paystack/route.ts` - dispatch automated WhatsApp confirmation receipt on successful charge
- `src/app/api/webhooks/hubtel/route.ts` - dispatch automated WhatsApp confirmation receipt on successful charge
- `src/app/api/webhooks/paystack/route.test.ts` (NEW / MODIFY) - webhook confirmation tests
- `src/app/api/webhooks/hubtel/route.test.ts` (NEW / MODIFY) - webhook confirmation tests
- `src/app/actions/payments-online.ts` - payment reminder action & payment link retrieval
- `src/app/actions/payments-online.test.ts` (NEW / MODIFY) - unit tests for payment online actions
- `src/app/store/[slug]/orders/[orderId]/components/StorefrontPaymentCard.tsx` (NEW) - customer pay-now & receipt component
- `src/app/store/[slug]/orders/[orderId]/components/OrderTrackingView.tsx` - mount payment card

## Data / contracts

- Order status transition: `'draft'` | `'pending_payment'` -> `'paid'` (or `'processing'`).
- Payment record in `payments`: status `'completed'`, net amount calculated, `transaction_ref` locked for idempotency.
- WhatsApp receipt message: dispatched with metadata `{ action_type: 'payment_confirmation', order_id, transaction_ref, payment_id }`.

## Testing

- Logic unit tests: `yarn test src/utils/paymentLinks.test.ts`
- Action & webhook unit tests: `yarn test src/app/actions/payments-online.test.ts src/app/api/webhooks/paystack/route.test.ts src/app/api/webhooks/hubtel/route.test.ts`
- Type safety: `yarn check` (`tsc --noEmit`)
- Linter: `yarn lint` (`eslint src`)
- Full test suite: `yarn test`

## Notes for the AI

- Follow strict TypeScript types: no `any` (Husky pre-commit enforces `@typescript-eslint/no-explicit-any`).
- Webhook handlers run in server context without user auth; use `createAdminClient()` for database writes and wrap outbound notifications in try/catch to guarantee 200 OK return to payment providers even if WhatsApp dispatch fails.
- Respect Ghanaian phone number formats (`024...`, `+233...`) using `normalizeGhanaPhone`.
