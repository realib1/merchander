# Feature 17c: Next.js Integration & Dispatch Pipeline

> **Archived Feature.** Completed on 2026-09-06.

**Status:** `verified`

## Goal
Replace the mock stub in `src/lib/intelligence/extract.ts` with a resilient, authenticated HTTP client communicating with the FastAPI intelligence service (`POST /api/v1/extract`). Wire inbound WhatsApp webhook messages (`src/app/api/webhooks/whatsapp/route.ts`) into the extraction pipeline with tenant scoping, and resolve security finding **F-08** by sanitizing console logging to avoid logging customer message content and PII in cleartext.

## In Scope
- Type alignment in `src/types/messaging.ts`: Add optional `intent` and `notes` to `ExtractedCart` matching the Python schema.
- Live HTTP client in `src/lib/intelligence/extract.ts`:
  - `extractCartFromChat(message: NormalizedMessage, tenantId?: string): Promise<ExtractedCart>`
  - Uses `PYTHON_BRAIN_URL` and `INTELLIGENCE_SERVICE_API_KEY` with sensible local fallbacks.
  - Passes `X-API-Key` authentication header.
  - Implements request timeout via `AbortSignal.timeout(8000)`.
  - Catches network failures, timeouts, and non-200 responses with a safe zero-confidence fallback (`confidence: 0, items: [], intent: 'unknown'`).
  - Redacts raw message text from logs (F-08), logging only sanitized metadata (platform, external ID, message length, tenant ID).
- Inbound dispatch in `src/app/api/webhooks/whatsapp/route.ts`:
  - For inbound messages of type `'text'` with non-empty text, construct `NormalizedMessage` and invoke `extractCartFromChat(normalizedMsg, tenantId)`.
  - Log extraction metrics (item count, confidence, intent) without exposing customer PII.
- Log sanitization in `src/app/api/webhooks/telegram/route.ts`:
  - Redact raw extracted cart and message contents from server logs (F-08).
- Unit test suite `src/lib/intelligence/extract.test.ts`:
  - Tests payload serialization, `X-API-Key` header, timeout handling, error fallback, and log privacy.
- Findings ledger update in `blueprint/context/findings.md`:
  - Mark **F-08** as `fixed`.

## Out of Scope
- Async Celery/Redis queue worker implementation (deferred to 17d).
- Outbound WhatsApp replies or automated conversational messaging (deferred to 18).
- Green/Yellow/Red action safety approval queues (deferred to 19).
- Conversation-to-order draft creation state machine (deferred to 20).
- Mock composer cleanup in `src/app/actions/conversations.ts` (tracked separately in F-05).

## Context & Constraints
- **Webhook Latency Safety:** Meta WhatsApp webhooks expect an HTTP 200 within 15–20s. The extraction call enforces an 8-second timeout and fails open (returns fallback empty cart) on timeout or service unavailability so webhooks are never blocked or dropped.
- **Log Privacy (F-08):** Inbound customer text messages may contain sensitive PII (addresses, phone numbers, payment details). Never output raw message content or customer identifiers in server stdout.
- **Tenant Scoping:** The extraction call passes `tenant_id` to ensure the Python service grounds extraction strictly against the merchant's catalog.
- **Contract Parity:** `ExtractedCart` in TypeScript must maintain field compatibility with Python `ExtractedCart` (`items`, `confidence`, `intent`, `notes`).

## Build Steps
- [x] 1. Update `src/types/messaging.ts` to add `intent?: string` and `notes?: string | null` to `ExtractedCart`.
- [x] 2. Implement resilient `extractCartFromChat` client in `src/lib/intelligence/extract.ts` with `X-API-Key` auth, timeout, error fallback, and redacted logging (F-08).
- [x] 3. Wire inbound text message extraction in `src/app/api/webhooks/whatsapp/route.ts` and sanitize logging in `src/app/api/webhooks/telegram/route.ts`.
- [x] 4. Create unit test suite in `src/lib/intelligence/extract.test.ts` covering success, timeout, auth header, error fallback, and log redaction.
- [x] 5. Mark **F-08** as `fixed` in `blueprint/context/findings.md`, run `yarn check` and `yarn test` to verify zero regressions.

## Files & Areas
- `src/types/messaging.ts` [MODIFY]
- `src/lib/intelligence/extract.ts` [MODIFY]
- `src/app/api/webhooks/whatsapp/route.ts` [MODIFY]
- `src/app/api/webhooks/telegram/route.ts` [MODIFY]
- `src/lib/intelligence/extract.test.ts` [NEW]
- `blueprint/context/findings.md` [MODIFY]

## Data & Contracts
- **Extraction Request Payload:**
  - `tenant_id`: `string | null`
  - `message`: `NormalizedMessage` (`platform`, `external_id`, `sender_id`, `text`, `timestamp`)
- **Extraction Response (`ExtractedCart`):**
  - `items`: `Array<{ sku: string; quantity: number }>`
  - `confidence`: `number` (0.0 to 1.0)
  - `intent` (optional): `string`
  - `notes` (optional): `string | null`

## Testing
- Unit tests via `yarn test src/lib/intelligence/extract.test.ts`.
- Full project typecheck via `yarn check` (`tsc --noEmit`).
- Full project test suite via `yarn test` (`vitest run`).
