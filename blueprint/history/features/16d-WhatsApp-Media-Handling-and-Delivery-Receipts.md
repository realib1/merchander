# Current Feature

**Feature 16d: WhatsApp Media Handling & Delivery Receipts**
**Status:** `verified`

## Goal
Enable Merchander to receive and persist media (images, audio, documents) sent by customers over WhatsApp, and track the delivery state (sent, delivered, read, failed) of outgoing messages via Meta's status webhooks.

## In Scope
- Listen for inbound `statuses` events on the webhook and update the corresponding `messages.status` via `external_id`.
- Listen for inbound media types (`image`, `audio`, `document`, `video`) on the webhook.
- Securely fetch the binary media from Meta Graph API using the Media ID.
- Upload the fetched media to a new Supabase Storage bucket (`message_media`).
- Update the `messages` table schema/content to include a reference to the stored media path.

## Out of Scope
- Actually rendering the media in a UI (no UI is being built for chat yet).
- Sending outbound media (we only built outbound text/template so far).
- Heavy processing or OCR on the inbound media (that belongs to the Intelligence Service later).

## Context & Constraints
- **Meta Media API:** Fetching media is a two-step process. First, query `/{media-id}` to get the URL, then fetch the URL with the Bearer token to get the binary data.
- **Storage:** Supabase Storage needs a new bucket `message_media`. RLS should restrict access to the tenant who owns the message.
- **Webhooks:** The WhatsApp webhook can batch both `messages` and `statuses` changes in a single payload.

## Build Steps
- [x] 1. Create a database migration to add the `message_media` Supabase Storage bucket and corresponding RLS policies for tenant isolation.
- [x] 2. Extend the inbound webhook parser (`src/lib/channels/whatsapp/webhook.ts`) to handle `statuses` entries and update `messages.status` by matching `external_id`.
- [x] 3. Add a `fetchWhatsAppMedia` client method in `src/lib/channels/whatsapp/api.ts` to retrieve the binary buffer from Meta.
- [x] 4. Update the inbound webhook handler to intercept media messages, download them via the API client, upload to Supabase Storage, and save the storage path in `messages.content`.
- [x] 5. Expand unit tests in `webhook.test.ts` and `api.test.ts` to verify status updates and media fetching logic.

## Files & Areas
- `supabase/migrations/[timestamp]_create_message_media_bucket.sql` [NEW]
- `src/lib/channels/whatsapp/webhook.ts` [MODIFY]
- `src/lib/channels/whatsapp/api.ts` [MODIFY]
- `src/lib/channels/whatsapp/types.ts` [MODIFY]
- `src/app/api/webhooks/whatsapp/route.ts` [MODIFY]

## Testing
- Automated unit tests covering the parsing of `statuses` and the mocked fetching of media buffers.
- Manual webhook simulation via cURL/Postman for the end-to-end flow of uploading a dummy image.
