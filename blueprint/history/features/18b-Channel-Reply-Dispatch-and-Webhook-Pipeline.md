# Feature 18b: Channel Reply Dispatch & Webhook Pipeline

> **Archived Feature.** Completed on 2026-09-06.

**Status:** `verified`

## Goal
Connect the Next.js application to the Python Intelligence service's Q&A reply endpoint (`POST /api/v1/reply`). Route inbound customer inquiry messages from the WhatsApp Cloud API webhook to generate grounded, conversational responses (pricing, stock availability, pre-order batch ETAs, active order status, and human-hold escalation notices), dispatch the generated response back to the customer on WhatsApp via the Meta Graph API, and persist the outbound exchange in the `messages` table with audit metadata.

## In Scope
- **TypeScript Contracts (`src/types/messaging.ts`):**
  - Add `CustomerContext` (`customer_id?`, `phone_number?`, `name?`).
  - Add `ReplyRequest` (`tenant_id?`, `message: NormalizedMessage`, `customer?: CustomerContext | null`).
  - Add `ReplyResponse` (`reply_text`, `intent`, `confidence`, `grounded_facts`, `requires_human_approval`, `escalation_reason`).
- **Intelligence Service Reply Client (`src/lib/intelligence/reply.ts`):**
  - Implement `generateGroundedReply(request: ReplyRequest): Promise<ReplyResponse>`.
  - Enforce timeout handling (8000ms), API key authentication via `X-API-Key`, and fallback resilience (`SAFE_REPLY_FALLBACK`).
  - Redact customer message text in application logs to guarantee PII protection (F-08).
- **Outbound WhatsApp Service (`src/lib/channels/whatsapp/service.ts`):**
  - Enhance `sendOutboundWhatsAppMessage` to optionally accept `metadata: Record<string, unknown>`.
  - Persist metadata (intent, confidence, grounded facts, escalation flags) within `messages.content` for auditability and Feature 19 readiness.
- **Inbound WhatsApp Webhook Pipeline (`src/app/api/webhooks/whatsapp/route.ts`):**
  - Construct `CustomerContext` using resolved `channel_identities` (`customer_id`, `channel_handle` / `from`, `profile_name`).
  - Route inbound inquiry text messages (messages that do not represent cart orders) to `generateGroundedReply`.
  - Dispatch grounded response back out to the customer via `sendOutboundWhatsAppMessage` when `reply_text` is non-empty.
  - Wrap reply generation and outbound dispatch in isolated `try/catch` blocks so errors never block inbound webhook 200 OK delivery.
- **Testing:**
  - Unit tests in `src/lib/intelligence/reply.test.ts` covering successful replies, timeout handling, error fallback, and PII redaction.
  - Integration tests in `src/app/api/webhooks/whatsapp/route.test.ts` verifying webhook signature checks, identity context passing, reply dispatching, and error resilience.
  - Full project verification: `yarn check` and `yarn test`.

## Out of Scope
- Full merchant approval queue UI in Next.js dashboard (Feature 19).
- Conversation-to-order draft conversion state machine (Feature 20).
- Automatic customer outbound notifications / scheduled broadcasts (Feature 21).

## Context & Constraints
- **Zero Fabrication:** Only grounded facts retrieved from the Python Intelligence Brain are returned to customers.
- **Order & Payment Grounding:** Active undelivered orders matched by phone number or customer ID provide status updates. Payment claims trigger a polite hold response and flag `requires_human_approval: true`.
- **Webhook Non-Blocking:** Outbound dispatch or Intelligence service failures must never cause the webhook to return 500 to Meta, preventing retry flood loops.
- **PII Protection (F-08):** Inbound message body text must never be printed directly in plaintext server console logs.

## Build Steps
- [x] 1. Add `CustomerContext`, `ReplyRequest`, and `ReplyResponse` types to `src/types/messaging.ts`.
- [x] 2. Implement `src/lib/intelligence/reply.ts` with `generateGroundedReply`, timeout handling, safe fallback, and unit tests in `src/lib/intelligence/reply.test.ts`.
- [x] 3. Update `src/lib/channels/whatsapp/service.ts` to accept optional `metadata` in `sendOutboundWhatsAppMessage` and persist it in `messages.content`.
- [x] 4. Wire `generateGroundedReply` and `sendOutboundWhatsAppMessage` into `src/app/api/webhooks/whatsapp/route.ts` with customer context and error isolation.
- [x] 5. Implement webhook integration tests in `src/app/api/webhooks/whatsapp/route.test.ts` and verify full suite with `yarn check` and `yarn test`.

## Files & Areas
- `src/types/messaging.ts` [MODIFY]
- `src/lib/intelligence/reply.ts` [NEW]
- `src/lib/intelligence/reply.test.ts` [NEW]
- `src/lib/channels/whatsapp/service.ts` [MODIFY]
- `src/app/api/webhooks/whatsapp/route.ts` [MODIFY]
- `src/app/api/webhooks/whatsapp/route.test.ts` [NEW]

## Data & Contracts
- **ReplyRequest Contract:**
  - `tenant_id`: string | null
  - `message`: `NormalizedMessage` (`platform`, `external_id`, `sender_id`, `text`, `timestamp`)
  - `customer`: `CustomerContext | null` (`customer_id`, `phone_number`, `name`)
- **ReplyResponse Contract:**
  - `reply_text`: string
  - `intent`: string
  - `confidence`: number
  - `grounded_facts`: string[]
  - `requires_human_approval`: boolean
  - `escalation_reason`: string | null

## Testing
- Unit tests in `src/lib/intelligence/reply.test.ts`.
- Route tests in `src/app/api/webhooks/whatsapp/route.test.ts`.
- Typecheck: `yarn check`.
- Unit test suite: `yarn test`.
