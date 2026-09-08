# Feature 20: Conversation-to-order capture

**From build-plan:** feature 20
**Status:** verified

## Goal

Capture agreed customer carts from social messaging conversations (WhatsApp) into structured draft orders against live tenant inventory and pricing. Route captured orders to the Yellow merchant approval queue with automated customer assurance notices. Upon merchant approval, transition the draft order to `pending_payment` and dispatch the confirmed order summary back to the customer on WhatsApp.

## In scope

- **Pure Logic Cart & Order Math Utility (`src/utils/orderCapture.ts`):**
  - Validation of extracted cart items against variant records.
  - Order subtotal, delivery fee, and grand total calculations.
  - Formatter for customer order confirmation WhatsApp copy:
    `formatOrderConfirmationMessage({ customerName, orderNumber, items, totalAmount })`.
  - Formatter for automated customer assurance notice:
    `formatOrderAssuranceNotice()`.
  - Formatter for grounded inventory & pricing facts.
  - Unit tests in `src/utils/orderCapture.test.ts` satisfying the pure logic testing gate.
- **Grounded Order Capture Service (`src/lib/intelligence/orders.ts`):**
  - Query tenant `product_variants` joined with `products` and `inventory_levels` by SKU or name.
  - Verify live prices and available stock across tenant stores (defaulting to tenant's primary store).
  - Create row in `public.orders` with `status: 'draft'`, `sales_channel: 'whatsapp'`, `attribution_source: 'whatsapp'`, and total amount.
  - Create line item rows in `public.order_items`.
  - Return structured capture result with grounded facts, confidence score, and stock warnings.
- **WhatsApp Inbound Webhook Integration (`src/app/api/webhooks/whatsapp/route.ts`):**
  - Connect cart extraction (`isCartOrder`) to the order capture pipeline.
  - Insert Yellow tier action into `ai_action_queue` (`action_type: 'draft_order'`, `status: 'pending'`).
  - Dispatch immediate automated customer assurance notice via WhatsApp:
    *"We've received your order request! Our team is confirming stock and preparing your order details now. We'll get back to you shortly."*
  - Ensure duplicate webhook deliveries do not generate duplicate draft orders.
- **Server Action Order Lifecycle Transitions (`src/app/actions/approvals.ts`):**
  - In `approveAction`: when approving a `draft_order` action, transition linked order from `draft` to `pending_payment`, dispatch confirmed order copy to the customer on WhatsApp, and mark action `executed`.
  - In `rejectAction`: when rejecting a `draft_order` action, transition linked order to `cancelled`, and mark action `rejected` with reason.
  - Unit tests in `src/app/actions/approvals.test.ts`.
- **Merchant Approval Queue Card Enhancement (`ApprovalActionCard.tsx`):**
  - Render rich draft order preview when `action_type === 'draft_order'`:
    - Order number badge (e.g. `#ORD-1042`).
    - Line items breakdown (quantity, variant name, unit price, item subtotal).
    - Order grand total.
    - Low stock or out-of-stock warning banner if inventory is constrained.
  - Outbound confirmation message preview with inline editing mode.
  - 1-click **Approve & Send** and **Reject**.

## Out of scope

- Live customer payment link generation (Paystack / Hubtel / MoMo checkout) — Feature 22.
- Proactive customer outreach campaigns and automated scheduled reminders — Feature 21.
- Fulfilment, delivery zones, and rider dispatch assignment — Feature 23.
- Manual order creation from merchant dashboard form (already shipped in Feature 5 / `create-order.ts`).

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Cart & Order Capture Math Utility & Tests** - Implement pure functions in `src/utils/orderCapture.ts` for cart line item pricing, total calculation, customer confirmation copy generation, assurance notice generation, and grounded inventory facts. Add comprehensive unit tests in `src/utils/orderCapture.test.ts`. *Done when:* `yarn test src/utils/orderCapture.test.ts` passes with 100% coverage.
- [x] **Step 2 - Grounded Order Capture Service** - Implement `captureDraftOrderFromCart` in `src/lib/intelligence/orders.ts` to validate extracted cart items against tenant variants/inventory in Supabase, resolve primary store, generate draft order, and insert order items. *Done when:* Service returns structured draft order results and handles valid, partial, and out-of-stock items gracefully.
- [x] **Step 3 - Webhook Pipeline Wiring & Assurance Notice** - Wire `isCartOrder` in `src/app/api/webhooks/whatsapp/route.ts` to trigger order capture, insert Yellow action into `ai_action_queue`, and dispatch immediate customer assurance notice via WhatsApp. *Done when:* Inbound WhatsApp message with order intent creates draft order, queues Yellow action, and dispatches assurance notice.
- [x] **Step 4 - Server Action Order Transitions & Approvals Tests** - Update `approveAction` and `rejectAction` in `src/app/actions/approvals.ts` to transition `draft` orders to `pending_payment` (or `cancelled`) and dispatch confirmation message. Update `src/app/actions/approvals.test.ts`. *Done when:* All approvals action unit tests pass including draft order approval and rejection flows.
- [x] **Step 5 - Approval Card Draft Order UI Preview** - Enhance `ApprovalActionCard.tsx` to render order number badge, line items list, pricing summary, and stock warning banner for `draft_order` actions. *Done when:* Yellow queue card clearly renders rich order details and permits 1-click approval with message editing.
- [x] **Step 6 - Full Project Verification** - Run typecheck (`yarn check`) and all unit tests (`yarn test`). *Done when:* 0 type errors and 100% passing test suites across the repository.

## Files / areas

- `src/utils/orderCapture.ts` [NEW]
- `src/utils/orderCapture.test.ts` [NEW]
- `src/lib/intelligence/orders.ts` [NEW]
- `src/lib/intelligence/orders.test.ts` [NEW]
- `src/app/api/webhooks/whatsapp/route.ts` [MODIFY]
- `src/app/actions/approvals.ts` [MODIFY]
- `src/app/actions/approvals.test.ts` [MODIFY]
- `src/app/dashboard/conversations/components/ApprovalActionCard.tsx` [MODIFY]
- `src/types/actions.ts` [MODIFY]

## Data / contracts

- `public.orders`:
  - `status`: `'draft'` upon capture $\rightarrow$ `'pending_payment'` upon merchant approval $\rightarrow$ `'cancelled'` upon rejection.
  - `sales_channel`: `'whatsapp'`.
  - `attribution_source`: `'whatsapp'`.
  - `store_id`: tenant primary store ID.
  - `customer_id`: resolved customer ID.
- `public.order_items`:
  - `order_id`: draft order ID.
  - `variant_id`: matched variant ID.
  - `quantity`: parsed quantity.
  - `unit_price`: verified live variant price.
- `public.ai_action_queue`:
  - `action_type`: `'draft_order'`.
  - `tier`: `'yellow'`.
  - `proposed_payload`: `{ order_id, order_number, items, total_amount, currency, reply_text, to, customer_name, customer_phone }`.
  - `grounded_facts`: list of grounded inventory and price checks.
  - `customer_notice_sent`: customer assurance copy dispatched on WhatsApp.

## Testing

- Pure logic: `yarn test src/utils/orderCapture.test.ts` (cart calculations, copy formatters, notice text).
- Server actions: `yarn test src/app/actions/approvals.test.ts` (draft order status transition on approval/rejection).
- Intelligence order capture: `yarn test src/lib/intelligence/orders.test.ts`.
- Full project test suite: `yarn test`.
- Typecheck: `yarn check`.
- Manual verification:
  1. Trigger or simulate inbound order message on WhatsApp.
  2. Verify draft order is inserted in `orders` with `status = 'draft'`.
  3. Verify Yellow action appears in `/dashboard/conversations` with order items preview.
  4. Click **Approve & Send** and verify order transitions to `pending_payment` and outbound confirmation is dispatched.

## Notes for the AI

- **Multi-tenant RLS:** All database reads and writes must be strictly scoped to `tenant_id`.
- **No Mock Payments:** Do not create fake payment completion records; order status remains `pending_payment` until real payment collection in Feature 22.
- **Testing Gate:** Any pure logic in `src/utils/` must have 100% test coverage before step approval.
- **Grounded Verification:** Never create order items with fabricated pricing or arbitrary SKUs; always validate against live `product_variants`.
