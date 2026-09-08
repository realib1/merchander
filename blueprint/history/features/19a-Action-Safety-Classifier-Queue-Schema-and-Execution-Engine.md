# Feature 19a: Action Safety Classifier, Queue Schema & Execution Engine

> **Archived Feature.** Completed on 2026-09-07.

**Status:** `verified`

## Goal
Implement the Green / Yellow / Red action safety classification engine and persistent approval queue backend. Inbound customer messages arriving from social channels (WhatsApp) will be evaluated against strict safety tiers: **Green** actions (factual Q&A, stock checks, batch ETAs, order tracking) auto-send immediately; **Yellow** actions (unverified payments, draft order proposals, low-stock reservations, medium-confidence replies) are queued for merchant review in `ai_action_queue` while dispatching an immediate assurance notice to the customer on WhatsApp; **Red** actions (explicit human agent requests, disputes, low confidence) halt automation, send a human handoff notice, and record an urgent exception for manual takeover. Server actions allow merchants to approve, edit & send, or reject queued actions.

## In Scope
- **Database Schema (`supabase/migrations/20260907170000_create_ai_action_queue.sql`):**
  - Create table `ai_action_queue` with tenant isolation and Row Level Security:
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE`
    - `channel_identity_id UUID NOT NULL REFERENCES public.channel_identities(id) ON DELETE CASCADE`
    - `customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL`
    - `action_type TEXT NOT NULL` (`'reply'`, `'confirm_payment'`, `'draft_order'`, `'human_handoff'`)
    - `tier TEXT NOT NULL` (`'green'`, `'yellow'`, `'red'`)
    - `status TEXT NOT NULL` (`'pending'`, `'approved'`, `'rejected'`, `'executed'`, `'cancelled'`)
    - `proposed_payload JSONB NOT NULL DEFAULT '{}'::jsonb` (`reply_text`, `customer_phone`, `order_details`, etc.)
    - `grounded_facts JSONB NOT NULL DEFAULT '[]'::jsonb`
    - `confidence NUMERIC(3,2) NOT NULL DEFAULT 0.00`
    - `escalation_reason TEXT`
    - `customer_notice_sent TEXT` (the assurance message sent to customer)
    - `reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL`
    - `reviewed_at TIMESTAMPTZ`
    - `rejection_reason TEXT`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - RLS policies enforcing tenant boundary based on `tenant_users`.
  - Indexes on `(tenant_id, status, created_at DESC)` and `(tenant_id, tier)`.
- **TypeScript Contracts (`src/types/actions.ts`):**
  - Enums and interfaces: `ActionTier` (`'green' | 'yellow' | 'red'`), `ActionStatus` (`'pending' | 'approved' | 'rejected' | 'executed' | 'cancelled'`), `ActionType` (`'reply' | 'confirm_payment' | 'draft_order' | 'human_handoff'`), and `AIActionRecord`.
- **Action Safety Classifier (`src/lib/intelligence/safety.ts`):**
  - `classifyActionSafety`: Maps `intent`, `confidence`, `requires_human_approval`, and `escalation_reason` to a concrete safety tier.
  - Determines whether an action is Green (auto-send), Yellow (gated in queue + customer assurance notice), or Red (urgent exception + human handoff notice).
  - Supplies contextual customer assurance notices (e.g. for payments: *"Thank you for letting us know! Please hold on briefly while our team verifies your payment on our merchant account."*).
- **Webhook Pipeline Routing (`src/app/api/webhooks/whatsapp/route.ts`):**
  - Integrate `classifyActionSafety`:
    - **Green:** Auto-dispatch reply via `sendOutboundWhatsAppMessage`.
    - **Yellow:** Insert into `ai_action_queue` (`status: 'pending'`, `tier: 'yellow'`) AND send customer assurance notice on WhatsApp.
    - **Red:** Insert into `ai_action_queue` (`status: 'pending'`, `tier: 'red'`) AND send human handoff notice on WhatsApp.
- **Server Actions for Execution (`src/app/actions/approvals.ts`):**
  - `getPendingApprovals(filters?)`: Fetch queued Yellow/Red actions with customer details and grounded facts.
  - `approveAction(actionId, editedPayload?)`: Approves and executes action, sending the proposed or edited text via `sendOutboundWhatsAppMessage`, updating status to `executed`.
  - `rejectAction(actionId, reason?)`: Updates status to `rejected` with audit note.
- **Testing:**
  - Unit tests in `src/lib/intelligence/safety.test.ts` for safety tier classification rules.
  - Unit tests in `src/app/actions/approvals.test.ts` for approve, edit-and-send, and reject workflows.
  - Updated integration tests in `src/app/api/webhooks/whatsapp/route.test.ts` covering Green auto-dispatch, Yellow queueing + assurance notice, and Red exception handling.
  - Full verification: `yarn check` and `yarn test`.

## Out of Scope
- Frontend UI components, queue lists, and modal interfaces (Sub-feature 19b).
- Automatic conversation-to-order draft state machine (Feature 20).
- Proactive customer outreach scheduling (Feature 21).

## Context & Constraints
- **Assurance / Clarity Notice:** When an action enters the Yellow approval queue (especially payments), the customer must receive an immediate assurance notice so they are never left wondering if their message was received.
- **No In-App Chat Emulation:** The merchant touchpoint is an approval and exceptions queue, not an in-app chat inbox.
- **Multi-Tenant Isolation:** `ai_action_queue` is strictly protected by RLS; tenant users can only query and mutate their tenant's queued actions.
- **Webhook Failure Isolation:** Queue database operations and outbound message sends must never cause the webhook to return HTTP 500 to Meta.

## Build Steps
- [x] 1. Create Supabase migration `supabase/migrations/20260907170000_create_ai_action_queue.sql` and TypeScript contracts in `src/types/actions.ts`.
- [x] 2. Implement `src/lib/intelligence/safety.ts` with `classifyActionSafety` and unit tests in `src/lib/intelligence/safety.test.ts`.
- [x] 3. Implement server actions in `src/app/actions/approvals.ts` (`getPendingApprovals`, `approveAction`, `rejectAction`) with unit tests in `src/app/actions/approvals.test.ts`.
- [x] 4. Wire safety classification and queue insertion into `src/app/api/webhooks/whatsapp/route.ts` with customer assurance notices for Yellow/Red tiers.
- [x] 5. Update and expand integration tests in `src/app/api/webhooks/whatsapp/route.test.ts` and run full project verification (`yarn check` and `yarn test`).

## Files & Areas
- `supabase/migrations/20260907170000_create_ai_action_queue.sql` [NEW]
- `src/types/actions.ts` [NEW]
- `src/lib/intelligence/safety.ts` [NEW]
- `src/lib/intelligence/safety.test.ts` [NEW]
- `src/app/actions/approvals.ts` [NEW]
- `src/app/actions/approvals.test.ts` [NEW]
- `src/app/api/webhooks/whatsapp/route.ts` [MODIFY]
- `src/app/api/webhooks/whatsapp/route.test.ts` [MODIFY]

## Data & Contracts
- **`ai_action_queue` Table:**
  - `id`: UUID (PK)
  - `tenant_id`: UUID (FK to `tenants`)
  - `channel_identity_id`: UUID (FK to `channel_identities`)
  - `customer_id`: UUID (FK to `customers`, nullable)
  - `action_type`: `'reply' | 'confirm_payment' | 'draft_order' | 'human_handoff'`
  - `tier`: `'green' | 'yellow' | 'red'`
  - `status`: `'pending' | 'approved' | 'rejected' | 'executed' | 'cancelled'`
  - `proposed_payload`: JSONB (`reply_text`, `customer_phone`, `order_details`, etc.)
  - `grounded_facts`: JSONB (array of fact strings)
  - `confidence`: numeric(3,2)
  - `escalation_reason`: string | null
  - `customer_notice_sent`: string | null
  - `reviewed_by`: UUID (FK to `auth.users`, nullable)
  - `reviewed_at`: TIMESTAMPTZ | null
  - `rejection_reason`: string | null
- **Server Action Contract:**
  - `approveAction(actionId: string, editedText?: string): Promise<{ success: boolean; error?: string }>`
  - `rejectAction(actionId: string, reason?: string): Promise<{ success: boolean; error?: string }>`

## Testing
- Unit tests in `src/lib/intelligence/safety.test.ts`.
- Server action tests in `src/app/actions/approvals.test.ts`.
- Webhook route tests in `src/app/api/webhooks/whatsapp/route.test.ts`.
- Full project typecheck: `yarn check`.
- Full test suite: `yarn test`.



