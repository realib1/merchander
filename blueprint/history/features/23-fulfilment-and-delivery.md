# Feature: Fulfilment & delivery

**From build-plan:** feature 23
**Status:** verified

## Goal

Provide end-to-end customer order fulfilment: delivery zone selection & fees, in-store pickup routing, rider/courier dispatch assignment, printable and WhatsApp-shareable Ghanaian waybill dispatch slips, and live rider tracking on the customer storefront.

## In scope

1. **Database Schema & Migration for Fulfilment & Dispatch:**
   - Add fulfilment columns to `public.orders`:
     - `rider_name` (text), `rider_phone` (text), `courier_name` (text), `tracking_number` (text), `dispatch_notes` (text).
     - `pickup_store_id` (uuid references `public.stores(id)`).
     - `dispatched_at` (timestamptz), `delivered_at` (timestamptz).
   - Update TypeScript order types (`src/types/orders.ts`, `src/types/actions.ts`).

2. **Pure Waybill & Dispatch Slip Utilities (`src/utils/waybill.ts`):**
   - Enhance `generateDispatchSlip` for Ghanaian local delivery & regional parcel freight:
     - Clear distinction between **"PAID ONLINE - DO NOT COLLECT CASH"** vs **"CASH ON DELIVERY - COLLECT GH₵ XXX"** to prevent duplicate collection or rider misunderstandings.
     - Support delivery landmark / GhanaPost GPS alongside street location.
     - Support in-store pickup dispatch slips (store location, customer pickup code, store attendant signature).
     - WhatsApp-ready plain text formatting for 1-click `wa.me/<rider_phone>?text=...` dispatch sharing.
   - 100% branch coverage unit test suite in `src/utils/waybill.test.ts` (resolving audit finding F-07).

3. **Fulfilment Server Actions (`src/app/actions/fulfilment.ts`):**
   - `assignOrderRiderAction({ orderId, tenantId, riderName, riderPhone, courierName, trackingNumber, notes })`:
     - Validates order ownership and status. Normalizes rider phone with `normalizeGhanaPhone`.
     - Transitions status to `'dispatched'` and sets `dispatched_at`.
     - Dispatches automated customer notification via WhatsApp (`"Your order #ORD-123 is on its way with rider {name} ({phone})!"`).
   - `markOrderDeliveredAction({ orderId, tenantId, deliveredNotes })`:
     - Sets status to `'delivered'` and stamps `delivered_at`.
     - Dispatches customer delivery completion message on WhatsApp.
   - Unit tests in `src/app/actions/fulfilment.test.ts`.

4. **Merchant Orders Fulfilment UI (Dispatch Modal & Printable Waybill):**
   - In `/dashboard/orders` (Kanban and Order Detail views):
     - Add **"Dispatch / Assign Rider"** action button.
     - `OrderDispatchModal`: select Delivery (enter Rider Name, Phone, Courier e.g. Yango / Bolt / In-House / VIP Bus, Waybill tracking ref) or Pickup (select Branch, pickup code).
     - `WaybillSlipModal`: printable thermal POS / standard slip preview with 1-click **"Send Waybill to Rider on WhatsApp"** (`wa.me` deep link).
     - Quick "Mark as Delivered" action for dispatched orders.

5. **Storefront Customer Live Tracking & Rider Information:**
   - In `/store/[slug]/orders/[orderId]` (`OrderTrackingView` & `TrackingSummaryCards`):
     - Update `storefront-tracking.ts` to fetch real order dispatch and rider details.
     - Render active delivery card: assigned courier/rider name, click-to-call phone button, tracking number, and live status progress (Paid → Dispatched → Delivered).

## Out of scope

- Direct 3rd-party logistics API automated ride booking (e.g. Yango Delivery API / Bolt Business API integration) — manual assignment and WhatsApp dispatch first.
- Inbound sea/air freight supplier shipments (already handled in Feature 7: Shipments & Logistics).
- Live GPS map breadcrumb tracking for motorbikes.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Database schema & migration for order fulfilment & dispatch** - Create migration `supabase/migrations/20260909000000_order_fulfilment_dispatch.sql` adding rider, courier, pickup store, and timestamp columns to `orders`, and update TypeScript contracts in `src/types/orders.ts` and `src/types/actions.ts`. *Done when:* Migration applies cleanly and TypeScript types reflect all new dispatch fields.
- [x] **Step 2 - Pure waybill & dispatch slip utilities and unit tests** - Enhance `src/utils/waybill.ts` with COD vs paid security badges, GhanaPost GPS / landmark support, WhatsApp deep-link text generator, and create `src/utils/waybill.test.ts`. *Done when:* `yarn test src/utils/waybill.test.ts` passes with 100% branch coverage on delivery, pickup, COD, and paid states.
- [x] **Step 3 - Fulfilment server actions & automated customer dispatch notices** - Create `src/app/actions/fulfilment.ts` with `assignOrderRiderAction`, `markOrderDeliveredAction`, and automated WhatsApp notices, backed by `src/app/actions/fulfilment.test.ts`. *Done when:* `yarn test src/app/actions/fulfilment.test.ts` passes verifying tenant isolation, rider assignment, and status transitions.
- [x] **Step 4 - Merchant dashboard dispatch modal & printable waybill slip** - Build `OrderDispatchModal.tsx` and `WaybillSlipModal.tsx` in `src/app/dashboard/orders/components/` with rider assignment form, thermal print formatting, and 1-click WhatsApp share to rider. *Done when:* Merchant can assign a rider from order details/Kanban, preview the waybill slip, and click to share directly to the rider's WhatsApp.
- [x] **Step 5 - Storefront live delivery tracking & end-to-end verification** - Update `storefront-tracking.ts` and `TrackingSummaryCards.tsx` to surface real assigned rider/courier information with click-to-call, and verify end-to-end delivery lifecycle. *Done when:* Storefront tracking page renders assigned courier details and delivery state, and `yarn check` + `yarn lint` + `yarn test` pass with 0 errors.

## Files / areas

- `supabase/migrations/20260909000000_order_fulfilment_dispatch.sql` (NEW) - schema columns for orders
- `src/types/orders.ts` (MODIFY) - order dispatch and rider types
- `src/types/storefront.ts` (MODIFY) - storefront waybill/rider types
- `src/utils/waybill.ts` (MODIFY) - Ghanaian dispatch slip formatter & WhatsApp text
- `src/utils/waybill.test.ts` (NEW) - unit test suite for waybill formatting
- `src/app/actions/fulfilment.ts` (NEW) - rider assignment, status progression, delivery actions
- `src/app/actions/fulfilment.test.ts` (NEW) - unit tests for fulfilment actions
- `src/app/dashboard/orders/components/OrderDispatchModal.tsx` (NEW) - rider assignment modal
- `src/app/dashboard/orders/components/WaybillSlipModal.tsx` (NEW) - printable & shareable waybill
- `src/app/dashboard/orders/[id]/page.tsx` (MODIFY) - mount dispatch & waybill actions
- `src/app/dashboard/orders/components/OrdersBoardView.tsx` (MODIFY) - quick dispatch trigger
- `src/app/actions/storefront-tracking.ts` (MODIFY) - fetch order rider details
- `src/app/store/[slug]/orders/[orderId]/components/TrackingSummaryCards.tsx` (MODIFY) - display assigned rider

## Data / contracts

- Order status progression: `'paid'` / `'draft'` -> `'dispatched'` -> `'delivered'`.
- Fulfilment mode: `'delivery'` | `'pickup'`.
- Rider assignment record: `{ rider_name, rider_phone, courier_name, tracking_number, dispatch_notes, dispatched_at }`.
- Payment collection safety: Waybills must prominently specify whether rider should collect payment (`cash_on_delivery`) or if payment was already verified online (`paid`).

## Testing

- Logic unit tests: `yarn test src/utils/waybill.test.ts`
- Action unit tests: `yarn test src/app/actions/fulfilment.test.ts`
- Full test suite: `yarn test`
- Type safety: `yarn check` (`tsc --noEmit`)
- Linter: `yarn lint` (`eslint src`)

## Notes for the AI

- Adhere strictly to TypeScript types without `any` (Husky pre-commit enforces lint & check).
- Normalize Ghanaian rider phone numbers (`024...`, `+233...`) using `normalizeGhanaPhone`.
- WhatsApp share links to riders use `https://wa.me/${phone}?text=${encodeURIComponent(slipText)}`.
- Respect multi-tenant isolation: every write must enforce `tenant_id` check.
