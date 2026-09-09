# Fix: WhatsApp Webhook Messages Insert Schema Mismatch & Deduplication

**Type:** Fix
**Status:** verified
**Fixes:** F-03

## The problem

Two critical mismatches exist between the WhatsApp webhook handler (`src/app/api/webhooks/whatsapp/route.ts`) and the omnichannel database schema defined in `supabase/migrations/20260904000056_create_omnichannel_tables.sql`:
1. **Deduplication Dead Branch**: The webhook insert error handler treats PostgreSQL error `23505` (`unique_violation`) as an idempotent duplicate, but the migration only created a plain non-unique index `idx_messages_external_id`. Because the index is not unique, duplicate inbound deliveries from Meta retries insert duplicate rows instead of triggering `23505`. Furthermore, the code does not stop downstream processing on a duplicate message, re-running cart extraction or AI replies.
2. **Message Type Enum Mismatch**: The PostgreSQL column `messages.type` uses enum `message_type` (`text`, `template`, `media`, `interactive`, `system`). However, `parseWhatsAppMessages` emits granular media types (`image`, `audio`, `document`, `video`, `other`). The webhook casts `msg.type as any`, causing any non-text inbound message to fail the database enum check (`22P02: invalid input value for enum message_type`), failing the insert and dropping the message.

## The fix

1. **Database Migration**:
   - Drop the non-unique index `public.idx_messages_external_id`.
   - Create a unique partial index `public.idx_messages_external_id_unique` on `public.messages(tenant_id, external_id) WHERE external_id IS NOT NULL;`.
2. **Webhook Message Type Mapping**:
   - Add a pure type mapper mapping `msg.type` (`'text'` -> `'text'`, `'image' | 'audio' | 'document' | 'video'` -> `'media'`, `'interactive'` -> `'interactive'`, `'template'` -> `'template'`) to align with `message_type` enum.
   - Preserve the specific media kind in `content.type`.
   - Remove the `as any` type assertion.
3. **Idempotency Flow**:
   - When message insert returns code `23505`, log duplicate skip and skip downstream extraction/dispatch for that message (`continue`).
4. **Unit Tests**:
   - Add tests in `src/app/api/webhooks/whatsapp/route.test.ts` verifying:
     - Inbound media messages (`image`, `document`, etc.) insert with `type: 'media'`.
     - Duplicate webhook delivery (`insertError.code === '23505'`) is safely skipped without triggering draft order creation or outbound replies.

## Build steps

- [x] **Step 1 - Unique Index Migration, Enum Mapping & Deduplication** - Add migration replacing `idx_messages_external_id` with a partial unique index, map WhatsApp media message types to `media` enum without `as any`, skip downstream dispatch on `23505` duplicate, and add unit tests. *Done when:* `yarn test src/app/api/webhooks/whatsapp/route.test.ts` passes, `yarn check` passes, and `yarn lint` passes.

## Verify

- Run `yarn test src/app/api/webhooks/whatsapp/route.test.ts` to confirm media insertion and `23505` duplicate handling pass.
- Run `yarn check` and `yarn lint` to ensure zero type errors and clean linting.
