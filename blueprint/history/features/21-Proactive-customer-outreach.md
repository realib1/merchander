# Feature 21: Proactive customer outreach

**From build-plan:** feature 21
**Status:** verified

## Goal

Enable Merchander Intelligence to proactively decide when and how to message customers over their connected channels (WhatsApp) for key lifecycle moments: payment reminders for unpaid orders, pre-order batch milestone announcements, back-in-stock notifications for waitlisted customers, and real-time delivery status updates. All outreach strictly enforces frequency limits, anti-spam Ghana quiet hours, and Green / Yellow / Red action safety controls with merchant queue review.

## In scope

- **Pure Logic Outreach Policy & Formatter (`src/utils/outreach.ts`):**
  - **Quiet Hours Enforcement:** `isGhanaQuietHours(date?: Date)` (GMT/UTC 21:00 to 08:00) to ensure automated messages are never sent during sleeping hours.
  - **Frequency Capping & Anti-Spam:** `evaluateFrequencyCap(history, policy)` enforcing a 24-hour cooldown between non-urgent customer messages, a maximum cap of 3 reminders per order, and duplicate prevention.
  - **Grounded Copy Generators for 4 Outreach Triggers:**
    - `formatPaymentReminderMessage({ customerName, orderNumber, totalAmount, currency, itemsSummary, paymentInstructions })`
    - `formatBatchMilestoneMessage({ customerName, batchName, milestone, expectedArrival, trackingUrl })`
    - `formatBackInStockMessage({ customerName, productName, variantName, storeUrl })`
    - `formatDeliveryUpdateMessage({ customerName, orderNumber, deliveryStatus, trackingUrl, address })`
  - **Safety Classification for Outreach:** `classifyOutreachSafety({ triggerType, isBulk, hasUnresolvedIssue, confidence })` assigning Green (individual routine delivery update / safe reminder) vs Yellow (batch broadcasts, bulk waitlists, high-value reminders) vs Red (complaints, disputes).
  - Pure unit tests in `src/utils/outreach.test.ts` satisfying the testing gate.
- **Outreach Intelligence Service (`src/lib/intelligence/outreach.ts`):**
  - Query customer channel identity, order/batch/waitlist context, and recent message history.
  - Check volume limits and quiet hours before any dispatch.
  - If **Green**: immediately auto-dispatch via `sendOutboundWhatsAppMessage` and record in `messages`.
  - If **Yellow**: enqueue into `ai_action_queue` with `action_type: 'proactive_outreach'`, `tier: 'yellow'`, `status: 'pending'`, proposed copy, customer details, and grounded facts.
  - If **Red / Capped / Suppressed**: block dispatch, record reason, and avoid customer spam.
  - Unit tests in `src/lib/intelligence/outreach.test.ts`.
- **Server Actions for Proactive Triggers (`src/app/actions/outreach.ts`):**
  - `scanPendingPaymentRemindersAction`: identifies unpaid orders ($\ge 24$h old, pending payment) and triggers outreach evaluation.
  - `broadcastBatchMilestoneAction`: triggers batch milestone outreach for all customers in a pre-order batch.
  - `notifyBackInStockAction`: triggers back-in-stock alerts for customers on `product_waitlist` when stock is added.
  - `sendOrderDeliveryUpdateAction`: triggers delivery status update message when order fulfillment status changes.
  - Unit tests in `src/app/actions/outreach.test.ts`.
- **Approvals Lifecycle & Action Execution (`src/types/actions.ts`, `src/app/actions/approvals.ts`):**
  - Extend `ActionType` to include `'proactive_outreach'`.
  - In `approveAction`: when approving a `'proactive_outreach'` action, send the message via `sendOutboundWhatsAppMessage` using approved/edited text; update linked `product_waitlist` status to `'notified'` if applicable, or log to `preorder_batch_notifications` if applicable.
  - In `rejectAction`: mark action rejected with reason without dispatching.
  - Unit tests in `src/app/actions/approvals.test.ts`.
- **Merchant Approval Card UI (`ApprovalActionCard.tsx`):**
  - Dedicated card preview for `action_type === 'proactive_outreach'`:
    - Visual badge and icon for the specific outreach trigger (Payment Reminder, Batch Milestone, Back in Stock, Delivery Update).
    - Recipient name, phone number, and order/batch context pills.
    - Full editable WhatsApp message preview.
    - 1-click **Approve & Send** and **Reject** buttons.

## Out of scope

- Customer-facing payment links (Paystack / Hubtel live checkout links) — Feature 22.
- Full delivery rider tracking maps & logistics zone management — Feature 23.
- Inbound chat client redesign (conversations page remains focused on Approvals & Exceptions).

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Pure Logic Outreach Policy, Formatters & Volume Limits** - Implement `src/utils/outreach.ts` with quiet hours checks, frequency capping, message copy formatters for the 4 triggers, and outreach safety classifier. Add comprehensive tests in `src/utils/outreach.test.ts`. *Done when:* `yarn test src/utils/outreach.test.ts` passes with 100% logic coverage.
- [x] **Step 2 - Outreach Intelligence Engine** - Implement `evaluateAndQueueOutreach` in `src/lib/intelligence/outreach.ts` to check limits, handle Green auto-dispatch, Yellow queueing to `ai_action_queue`, and Red/capped suppression. Add unit tests in `src/lib/intelligence/outreach.test.ts`. *Done when:* Service tests pass for all 4 trigger types, quiet hours suppression, and queue routing.
- [x] **Step 3 - Server Actions for Outreach Triggers** - Create `src/app/actions/outreach.ts` exposing payment reminder scanning, batch milestone broadcast, back-in-stock notification, and delivery update actions. Add unit tests in `src/app/actions/outreach.test.ts`. *Done when:* Server action tests pass verifying tenant scoping, order filtering, and trigger execution.
- [x] **Step 4 - Action Queue Execution & Approvals Transitions** - Extend `ActionType` in `src/types/actions.ts` with `'proactive_outreach'`, and update `approveAction` / `rejectAction` in `src/app/actions/approvals.ts` to dispatch approved outreach messages and update waitlist/notification records. Update `src/app/actions/approvals.test.ts`. *Done when:* All approvals action unit tests pass including proactive outreach flows.
- [x] **Step 5 - Approval Card UI Preview for Proactive Outreach** - Enhance `ApprovalActionCard.tsx` to render dedicated outreach trigger badges, customer/order metadata pills, and editable message preview for `'proactive_outreach'` actions. *Done when:* Merchant queue card cleanly displays proactive outreach details and enables 1-click approval.
- [x] **Step 6 - Full Repository Verification** - Run typecheck (`yarn check`), test suites (`yarn test`), and linter (`yarn lint`). *Done when:* 0 type errors, 0 lint errors, and 100% passing tests across the entire codebase.

## Files / areas

- `src/utils/outreach.ts` [NEW]
- `src/utils/outreach.test.ts` [NEW]
- `src/lib/intelligence/outreach.ts` [NEW]
- `src/lib/intelligence/outreach.test.ts` [NEW]
- `src/app/actions/outreach.ts` [NEW]
- `src/app/actions/outreach.test.ts` [NEW]
- `src/types/actions.ts` [MODIFY]
- `src/types/supabase.ts` [MODIFY]
- `src/utils/actionsMath.ts` [MODIFY]
- `src/app/actions/approvals.ts` [MODIFY]
- `src/app/actions/approvals.test.ts` [MODIFY]
- `src/app/dashboard/conversations/components/ApprovalActionCard.tsx` [MODIFY]

## Data / contracts

- `public.ai_action_queue`:
  - `action_type`: `'proactive_outreach'` (or existing `'reply'` / `'draft_order'`).
  - `tier`: `'yellow'` (or `'green'` for auto-dispatch audit).
  - `proposed_payload`:
    ```ts
    {
      trigger_type: 'payment_reminder' | 'batch_milestone' | 'back_in_stock' | 'delivery_update';
      reply_text: string;
      to: string;
      customer_name?: string;
      customer_phone?: string;
      order_id?: string;
      order_number?: string;
      total_amount?: number;
      batch_id?: string;
      batch_name?: string;
      milestone?: string;
      variant_id?: string;
      product_name?: string;
      variant_name?: string;
      delivery_status?: string;
      tracking_url?: string;
    }
    ```
  - `grounded_facts`: array of strings verifying order status, inventory levels, or batch milestone.
- `public.product_waitlist`:
  - `status`: transition from `'waiting'` to `'notified'` upon back-in-stock outreach dispatch.
- `public.preorder_batch_notifications`:
  - Record broadcast audit log on batch milestone outreach.

## Testing

- Pure logic: `yarn test src/utils/outreach.test.ts` (frequency caps, quiet hours, message copy generators, safety classification).
- Intelligence service: `yarn test src/lib/intelligence/outreach.test.ts` (evaluation, Green dispatch vs Yellow queueing, suppression).
- Server actions: `yarn test src/app/actions/outreach.test.ts` and `yarn test src/app/actions/approvals.test.ts`.
- Full project verification: `yarn check` and `yarn test`.
- Manual verification:
  1. Trigger payment reminder scan for an unpaid order $\ge 24$h old.
  2. Confirm Yellow action is enqueued in `/dashboard/conversations` with formatted copy and context pills.
  3. Click **Approve & Send** and verify outbound WhatsApp message is sent via Meta Graph API and logged in `messages`.
  4. Verify frequency cap prevents duplicate reminders within 24 hours.

## Notes for the AI

- **Ghana Time (GMT / UTC+0):** Ghana does not observe daylight saving time. Local time is always UTC. Quiet hours (21:00 to 08:00) map directly to UTC `0 <= hour < 8 || hour >= 21`.
- **Anti-Ban Safety:** Never broadcast in tight unthrottled loops. When dispatching multiple messages, enforce jittered delays as documented in `whatsapp-anti-ban-operations`.
- **Strict Typing:** Avoid `any` types in mocks and interfaces to pass Husky pre-commit hooks (`@typescript-eslint/no-explicit-any`).
- **Idempotency:** Always verify whether an identical outreach action was recently generated or executed to avoid embarrassing duplicate customer pings.
