# Feature 19b: Merchant Approval & Exceptions Queue Surface

**Status:** verified

## Goal
Replace the synthetic in-app chat stream at `/dashboard/conversations` with a focused, high-leverage Approvals & Exceptions operational surface. Customer dialogues live natively in WhatsApp and social messaging channels; Merchander's merchant touchpoint is an approval and exceptions queue rather than a simulated chat inbox. Merchants review and 1-click approve, edit & send, or reject pending **Yellow** actions (unverified payment claims, draft orders, low-stock reservations, medium-confidence inquiries), and handle urgent **Red** exceptions (human agent requests, disputes, low confidence) with 1-click direct WhatsApp takeover (`https://wa.me/<phone>`). This surface decommissions the inert chat composer and synthetic thread generator, resolving finding F-05.

## In Scope
- **Server Action Enhancements (`src/app/actions/approvals.ts`):**
  - `getApprovalsQueueMetrics()`: Computes pending Yellow count, urgent Red count, actions executed today, and average confidence.
  - `resolveRedException(actionId, notes?)`: Marks a Red tier urgent exception as `executed` or `cancelled` once merchant completes manual takeover.
  - Unit tests in `src/app/actions/approvals.test.ts`.
- **Queue Logic & Math Utility (`src/utils/actionsMath.ts`):**
  - Pure functions for queue filtering (`filterActionQueue`), tier grouping, sorting by urgency and recency, and KPI metric aggregations.
  - Formatter for 1-click WhatsApp takeover link generation:
    `buildWhatsAppTakeoverUrl(phone, customerName, reason)`.
  - Unit tests in `src/utils/actionsMath.test.ts` fulfilling the pure logic testing gate.
- **Top Metrics Component (`src/app/dashboard/conversations/components/ApprovalsTopMetrics.tsx`):**
  - Four Bento-style KPI cards:
    - **Pending Approvals (Yellow):** amber badge, count of actions awaiting merchant verification.
    - **Urgent Exceptions (Red):** red emergency badge, count of human takeover requests.
    - **Executed Today:** green badge, count of approved/sent AI actions.
    - **AI Accuracy / Grounding:** average grounding confidence percentage.
- **Approvals & Exceptions Workspace (`src/app/dashboard/conversations/components/ApprovalsWorkspace.tsx`):**
  - Tabbed filters:
    - `Pending Approvals (Yellow)` (with count badge)
    - `Urgent Exceptions (Red)` (with red alert badge)
    - `All Pending`
    - `History (Executed & Rejected)`
  - Search bar: filter by customer name, phone handle, or action type.
- **Yellow Approval Card (`src/app/dashboard/conversations/components/ApprovalActionCard.tsx`):**
  - Displays customer name, phone, channel icon (`WhatsApp`), action type badge (`Confirm Payment`, `Draft Order`, `Review Reply`), and AI confidence score (`92% Grounded`).
  - Displays customer assurance notice already dispatched on WhatsApp (e.g. *"Notice sent: Thank you for letting us know! Please hold on briefly while our team verifies your payment..."*).
  - Collapsible list of grounded facts retrieved by the Intelligence service.
  - Proposed outbound text preview with inline **Edit** toggle mode.
  - Action buttons:
    - **Approve & Send** (green): Calls `approveAction`, sends outbound message, updates status to `executed`.
    - **Edit & Send** (outline): Saves merchant edits, dispatches updated text, updates status to `executed`.
    - **Reject** (rose): Opens rejection reason popover and updates status to `rejected`.
- **Urgent Red Exception Card (`src/app/dashboard/conversations/components/UrgentExceptionCard.tsx`):**
  - High-visibility alert styling with escalation reason badge (`Human agent requested`, `Dispute / Complaint`, `Low confidence`).
  - Customer context (name, phone handle, time escalated).
  - Notice status: confirms customer received human handoff notice.
  - **1-Click WhatsApp Takeover:** `<a>` button opening `https://wa.me/<phone>?text=...` in a new tab.
  - **Mark Resolved:** Button calling `resolveRedException` to clear the exception from the active queue.
- **Empty States & Cleanups:**
  - Reassuring "Inbox Zero" empty states when no items remain in the active queue.
  - Retire and delete obsolete synthetic chat components:
    - `ChatStreamView.tsx` (removes fake send composer and resolves F-05)
    - `ConversationListSidebar.tsx`
    - `CustomerContextPanel.tsx`
  - Update `src/app/actions/conversations.ts` to re-export approvals or deprecate legacy synthetic functions.
  - Mark `F-05` as `fixed` in `blueprint/context/findings.md`.

## Out of Scope
- Automatic draft order state machine logic (Feature 20).
- Scheduled outbound broadcasts and proactive customer marketing (Feature 21).
- Direct socket streaming for live updates (Supabase Realtime subscription can be added later; initial version uses standard Next.js revalidation).

## Context & Constraints
- **No Chat Emulation:** The operational surface is an Approvals & Exceptions queue. Customers converse natively on WhatsApp.
- **Immediate Feedback:** Fast server action mutations with optimistic UI updates and toast notifications (`sonner`).
- **Auditability:** Merchant edits and rejection reasons are strictly persisted in `ai_action_queue.proposed_payload` and `rejection_reason`.
- **Multi-Tenant Isolation:** All data queries and mutations enforce tenant boundary via `tenant_id` and RLS.

## Build Steps
- [x] 1. Add `getApprovalsQueueMetrics` and `resolveRedException` server actions in `src/app/actions/approvals.ts` with unit tests in `src/app/actions/approvals.test.ts`.
- [x] 2. Implement `src/utils/actionsMath.ts` (queue filtering, WhatsApp takeover URL formatting, KPI metrics) with 100% unit tests in `src/utils/actionsMath.test.ts`.
- [x] 3. Create `ApprovalsTopMetrics.tsx` for the Bento KPI cards and queue health overview.
- [x] 4. Create `ApprovalActionCard.tsx` with grounded facts display, inline text editing, and 1-click Approve / Edit & Send / Reject controls.
- [x] 5. Create `UrgentExceptionCard.tsx` and `UrgentExceptionsList.tsx` for Red tier human handoffs with 1-click WhatsApp takeover (`wa.me/<phone>`) and resolve actions.
- [x] 6. Build `ApprovalsWorkspace.tsx` and reframe `src/app/dashboard/conversations/page.tsx`; retire legacy chat components (`ChatStreamView.tsx`, `ConversationListSidebar.tsx`, `CustomerContextPanel.tsx`), mark F-05 fixed in `findings.md`, and verify full test suite (`yarn check` and `yarn test`).

## Files & Areas
- `src/app/actions/approvals.ts` [MODIFY]
- `src/app/actions/approvals.test.ts` [MODIFY]
- `src/utils/actionsMath.ts` [NEW]
- `src/utils/actionsMath.test.ts` [NEW]
- `src/app/dashboard/conversations/components/ApprovalsTopMetrics.tsx` [NEW]
- `src/app/dashboard/conversations/components/ApprovalActionCard.tsx` [NEW]
- `src/app/dashboard/conversations/components/UrgentExceptionCard.tsx` [NEW]
- `src/app/dashboard/conversations/components/UrgentExceptionsList.tsx` [NEW]
- `src/app/dashboard/conversations/components/ApprovalsWorkspace.tsx` [NEW]
- `src/app/dashboard/conversations/page.tsx` [MODIFY]
- `src/app/dashboard/conversations/components/ChatStreamView.tsx` [DELETE]
- `src/app/dashboard/conversations/components/ConversationListSidebar.tsx` [DELETE]
- `src/app/dashboard/conversations/components/CustomerContextPanel.tsx` [DELETE]
- `src/app/dashboard/conversations/components/ConversationsWorkspace.tsx` [DELETE]
- `src/app/dashboard/conversations/components/ConversationsTopMetrics.tsx` [DELETE]
- `blueprint/context/findings.md` [MODIFY]

## Data & Contracts
- **`ApprovalsQueueMetrics` Interface:**
  - `pendingYellowCount`: number
  - `urgentRedCount`: number
  - `executedTodayCount`: number
  - `avgConfidencePct`: number
- **`resolveRedException` Contract:**
  - `resolveRedException(actionId: string, resolutionNote?: string): Promise<{ success: boolean; error?: string }>`
- **`buildWhatsAppTakeoverUrl` Contract:**
  - `buildWhatsAppTakeoverUrl(phone: string, customerName?: string, reason?: string): string`

## Testing
- Unit tests in `src/utils/actionsMath.test.ts` (pure logic testing gate).
- Server action tests in `src/app/actions/approvals.test.ts`.
- Full project typecheck: `yarn check`.
- Full project test suite: `yarn test`.
