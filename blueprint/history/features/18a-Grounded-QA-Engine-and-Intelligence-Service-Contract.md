# Feature 18a: Grounded Q&A Engine & Intelligence Service Contract

> **Archived Feature.** Completed on 2026-09-06.

**Status:** `verified`

## Goal
Implement a grounded Q&A and conversational reply engine in the Python Intelligence service (`services/intelligence/`). The engine will accept customer inquiries (via `POST /api/v1/reply`), fetch real-time merchant grounding data (catalog products, variant stock/pricing, pre-order batch ETAs, and active customer orders matched by phone number and customer ID), and generate an accurate, conversational response in polite Ghanaian merchant tone. It strictly prevents hallucination: if data is not confirmed in the database or involves unverified payments, it flags the interaction for human escalation.

## In Scope
- Schemas (`services/intelligence/app/schemas.py`):
  - `CustomerContext`: `customer_id` (optional), `phone_number` (optional), `name` (optional).
  - `CustomerOrderSummary`: `order_number`, `status`, `total_amount`, `currency`, `items_summary`, `created_at`, `delivery_address`.
  - `ReplyRequest`: `tenant_id`, `message: NormalizedMessage`, `customer: Optional[CustomerContext]`.
  - `ReplyResponse`: `reply_text`, `intent`, `confidence`, `grounded_facts`, `requires_human_approval`, `escalation_reason`.
- Order Grounding Service (`services/intelligence/app/services/orders.py`):
  - Async Supabase query fetching active, undelivered orders (`status NOT IN ('delivered', 'cancelled')`) matching either `customer_id` or customer phone number.
- Grounded Q&A Engine (`services/intelligence/app/services/qa.py`):
  - Context synthesizer combining tenant catalog, open pre-order batches, and active customer orders.
  - LLM prompt enforcing Ghanaian social-commerce tone (polite, warm, currency in `GH₵`), strict grounding, zero fabricated facts, and explicit safety boundaries (payment verification requires human approval).
  - Deterministic / heuristic fallback when no LLM API key is present (`ENVIRONMENT == "test"` or offline).
- API Endpoint (`services/intelligence/app/main.py`):
  - Add `POST /api/v1/reply` protected by `verify_api_key`.
- Testing (`services/intelligence/tests/test_qa.py`):
  - Price & variant inquiries with in-stock products.
  - Out-of-stock and unknown product inquiries (asserting zero fabrication).
  - Open pre-order batch ETA inquiries.
  - Order status inquiries matching phone number and customer ID.
  - Unconfirmed payment inquiries escalating to human approval.
  - Endpoint authentication enforcement.

## Out of Scope
- Next.js client wrapper and inbound WhatsApp webhook routing (Feature 18b).
- Outbound WhatsApp message transmission via Meta Graph API (Feature 18b).
- Full merchant approval queue UI in Next.js dashboard (Feature 19).
- Conversation-to-order draft conversion state machine (Feature 20).

## Context & Constraints
- **Zero Fabrication:** The model must NEVER invent prices, stock counts, delivery dates, or payment receipts not present in the grounding data.
- **Order Resolution Rule:** Orders are matched by `customer_id` OR `sender_id`/`phone_number`. Only active/undelivered orders (`status NOT IN ('delivered', 'cancelled')`) are considered for automated status updates.
- **Payment Safety Rule:** Payment status inquiries that cannot be verified against confirmed database payments must set `requires_human_approval: true` and ask the customer to hold for merchant verification.
- **Offline & Test Resiliency:** All unit tests must pass deterministically without requiring a live Gemini API key or external Supabase connection.

## Build Steps
- [x] 1. Add `CustomerContext`, `CustomerOrderSummary`, `ReplyRequest`, and `ReplyResponse` schemas in `services/intelligence/app/schemas.py`.
- [x] 2. Implement `app/services/orders.py` to retrieve active customer orders from Supabase by `customer_id` and/or phone number.
- [x] 3. Implement grounded Q&A reasoning and anti-hallucination prompt in `app/services/qa.py` with deterministic fallback.
- [x] 4. Wire `POST /api/v1/reply` endpoint in `app/main.py` with API key authentication.
- [x] 5. Implement test suite in `services/intelligence/tests/test_qa.py` and verify all tests pass with `pytest` and `yarn check`.

## Files & Areas
- `services/intelligence/app/schemas.py` [MODIFY]
- `services/intelligence/app/services/orders.py` [NEW]
- `services/intelligence/app/services/qa.py` [NEW]
- `services/intelligence/app/main.py` [MODIFY]
- `services/intelligence/tests/test_qa.py` [NEW]

## Data & Contracts
- **Reply Request (`ReplyRequest`):**
  - `tenant_id`: `Optional[str]`
  - `message`: `NormalizedMessage` (`platform`, `external_id`, `sender_id`, `text`, `timestamp`)
  - `customer`: `Optional[CustomerContext]` (`customer_id`, `phone_number`, `name`)
- **Reply Response (`ReplyResponse`):**
  - `reply_text`: `str`
  - `intent`: `str`
  - `confidence`: `float`
  - `grounded_facts`: `List[str]`
  - `requires_human_approval`: `bool`
  - `escalation_reason`: `Optional[str]`

## Testing
- Unit tests in `services/intelligence/tests/test_qa.py`.
- Full python test suite: `uv run --extra dev pytest`.
- Full project verification: `yarn check` and `yarn test`.
