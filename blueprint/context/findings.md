# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-03 [P2] open - messages insert path does not match the omnichannel schema

**File:** src/app/api/webhooks/whatsapp/route.ts:101
**Found:** 2026-09-03 by /audit (scope: full; lens: correctness)
**Why it matters:** Two mismatches between the webhook and
`20260904000056_create_omnichannel_tables.sql`:
- The insert error handler treats `23505` as an idempotent duplicate
  (`external_id` already seen), but the migration creates only a **plain** index
  `idx_messages_external_id`, not a unique one. Meta retries deliveries
  aggressively, so duplicate inbound rows will accumulate and the dedup branch
  is dead.
- `messages.type` is enum `('text','template','media','interactive','system')`,
  but `parseWhatsAppMessages` emits `'image' | 'audio' | 'document' | 'video' |
  'other'`. The insert casts `msg.type as any` (line 109), so every non-text
  message fails the enum check (`22P02`), is logged, and is dropped.
**Suggested fix:** Add a unique index on `(tenant_id, external_id)` (partial,
`WHERE external_id IS NOT NULL`). Map the parser's media kinds to the `media`
enum value before insert and keep the specific kind in `content.type` (already
set). Drop the `as any`.
**Resolution:**

### F-04 [P2] open - WhatsApp inbound routing and outbound config are hardcoded mocks on a live route

**File:** src/app/api/webhooks/whatsapp/route.ts:54
**Found:** 2026-09-03 by /audit (scope: full; lens: quality)
**Why it matters:** `tenantId = msg.phoneNumberId === '123' ? 'tenant-123' :
'unknown'` with a `continue` on `'unknown'`, so the registered production route
silently discards 100% of real inbound WhatsApp messages, and the `'123'` branch
would insert a non-UUID `tenant_id`. `getTenantWhatsAppConfig`
(`src/lib/channels/whatsapp/service.ts:9`) likewise returns
`{ phoneNumberId: 'mock-phone-id', accessToken: 'mock-access-token' }` for
`'tenant-123'` and throws otherwise. Mock scaffolding merged to `main` inside a
live API route with no feature flag.
**Suggested fix:** Implement the real `phone_number_id -> tenant` lookup against
the channel-connection settings table (or gate the route off until it exists).
Same for `getTenantWhatsAppConfig`.
**Resolution:**

### F-05 [P2] fixed - sendChatMessage is a no-op that reports success

**File:** src/app/actions/conversations.ts:121
**Found:** 2026-09-03 by /audit (scope: full; lens: quality)
**Why it matters:** `sendChatMessage` calls `revalidatePath` and returns
`{ success: true, message: {...synthetic...} }` without persisting anything or
calling any channel API. `ChatStreamView.handleSend`
(`src/app/dashboard/conversations/components/ChatStreamView.tsx:72`) optimistically
appends the text with `status: 'sent'`, so a merchant replying to a WhatsApp /
Telegram / Instagram thread sees a delivered-looking message that never reaches
the customer. `project-overview.md` already flags the conversations view as a
scaffold pending the 16-21 rework; this is the write-path half of that.
**Suggested fix:** As part of the 16-21 rework, either wire this to the real
outbound path (Green/Yellow/Red gated) or make the composer clearly inert
(disabled, "not yet connected") instead of faking a successful send.
**Resolution:** Fixed in Feature 19b. Decommissioned `ChatStreamView.tsx` and removed synthetic `sendChatMessage`. Reframed `/dashboard/conversations` into a genuine Approvals & Exceptions queue where merchant actions call `approveAction` (dispatches real outbound WhatsApp messages via `sendOutboundWhatsAppMessage` with tenant audit records) and `rejectAction`.

### F-06 [P3] open - duplicate WhatsApp signature helper and unused outbound module

**File:** src/lib/channels/whatsapp/webhook.ts:11
**Found:** 2026-09-03 by /audit (scope: full; lens: quality)
**Why it matters:** `verifyWhatsAppSignature` duplicates `verifyMetaSignature`
(`src/utils/webhook-signature.ts`) and is the weaker copy (no empty-secret
guard - see F-01). Separately, `sendOutboundWhatsAppMessage` and
`getTenantWhatsAppConfig` in `src/lib/channels/whatsapp/service.ts` have no
callers outside their test file.
**Suggested fix:** Delete `verifyWhatsAppSignature` and use `verifyMetaSignature`
(folds into F-01). Keep the outbound module only if feature 21 lands soon;
otherwise remove it until it is wired.
**Resolution:**

### F-07 [P3] fixed - product.ts and waybill.ts logic has no unit tests

**File:** src/utils/product.ts:6
**Found:** 2026-09-03 by /audit (scope: full; lens: tests)
**Why it matters:** The logic test gate is on and scoped to `src/utils/`.
`product.ts` (`calculateTotalStock`, `calculateTotalUnitsSold` with its
draft/cancelled exclusion, `getVariantPriceRange`, `generateSKU` initials /
padding / random-digit rules) and `waybill.ts` (`generateDispatchSlip`, a pure
formatter) are pure and easily assertable but have no `*.test.ts`. The F-14
backfill picked a five-module subset and skipped these.
**Suggested fix:** Add focused `*.test.ts` for both, covering branch behaviour
(status filter, empty inputs, single vs multi-word names, id vs no-id SKU).
**Resolution:** Fixed in Feature 23. Added comprehensive unit test suites in `src/utils/waybill.test.ts` (10 tests covering delivery, pickup, COD vs paid, GhanaPost GPS, and WhatsApp dispatch formatting) and `src/utils/product.test.ts` (13 tests covering stock calculations, units sold filtering, price ranges, and SKU generation).

### F-08 [P3] fixed - customer message content written to application logs in cleartext

**File:** src/lib/intelligence/extract.ts:10
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** `console.log(\`[AI Brain Interface] Extracting intent from
${message.platform} message: "${message.text}"\`)` logs the full inbound customer
message body; the Telegram route logs the extracted cart. Customer message
content (addresses, phone numbers, payment details) lands in platform logs that
have a broader access boundary than the tenant.
**Suggested fix:** Drop the message body from the log line (log platform +
external id + length), or gate it behind a debug flag that is off in production.
**Resolution:** Fixed in Feature 17c. `extractCartFromChat` now logs only sanitized metadata (platform, external ID, message length, and tenant ID), omitting raw message text. Webhook handlers (`whatsapp` and `telegram`) log structured extraction metrics (intent, item count, confidence) without dumping customer PII or raw cart payloads. Covered by unit tests in `src/lib/intelligence/extract.test.ts`.

