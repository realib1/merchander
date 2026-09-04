# Current Feature

**Feature 16b: WhatsApp Webhook & Inbound Parsing**
**Status:** `verified`

## Goal
Establish the inbound connection to Meta's WhatsApp Cloud API. We need an endpoint (`/api/webhooks/whatsapp`) that satisfies Meta's webhook verification challenge (GET) and securely receives and parses incoming user messages (POST), storing them in the `messages` table against the correct `channel_identity`.

## In Scope
- Webhook verification (GET request with `hub.challenge`).
- Webhook payload processing (POST request).
- Security: Meta `X-Hub-Signature-256` verification.
- Payload Parsing: Extracting the sender's phone number (handle), profile name, and text message content.
- Database: Calling `resolveChannelIdentity` to fetch/create the profile, then inserting an `inbound` message into the `messages` table.

## Out of Scope
- Sending outbound replies (handled in 16c).
- Downloading or parsing rich media attachments like images or documents (handled in 16d).
- Updating message statuses based on delivery receipts (handled in 16d).
- Handling webhook events for anything other than `messages` (e.g. template approvals).

## Context & Constraints
- **Tenant Routing:** The webhook receives a generic payload from Meta. We need a way to map the WhatsApp Business Account ID (`waba_id`) or Phone Number ID to a specific Merchander `tenant_id`. For this iteration, we will look up the tenant by matching the `whatsapp_phone_number_id` stored in the tenant's integration settings.
- **Security:** We must strictly verify the signature using the tenant's (or platform's) Meta App Secret to prevent spoofing.
- **Idempotency:** Webhooks can be retried. The `messages.external_id` (Meta's `wamid`) has a unique index (created in 16a) which will naturally prevent duplicate message processing.

## Build Steps
- [x] 1. Define types for WhatsApp webhook payloads in `src/lib/channels/whatsapp/types.ts`.
- [x] 2. Create utility functions in `src/lib/channels/whatsapp/webhook.ts` to verify the `X-Hub-Signature-256` and parse the payload.
- [x] 3. Create the webhook route at `src/app/api/webhooks/whatsapp/route.ts`. Implement the GET handler for `hub.challenge`.
- [x] 4. Implement the POST handler: verify signature, find `tenant_id` by phone number ID, resolve identity, and insert `messages`.
- [x] 5. Add unit tests for the webhook parsing and signature verification logic in `src/lib/channels/whatsapp/webhook.test.ts`.

## Files & Areas
- `src/lib/channels/whatsapp/types.ts` [NEW]
- `src/lib/channels/whatsapp/webhook.ts` [NEW]
- `src/app/api/webhooks/whatsapp/route.ts` [NEW]
- `src/lib/channels/whatsapp/webhook.test.ts` [NEW]

## Data & Contracts
- The `messages` table will receive a `content` object like `{ text: "Hello" }` and `external_id` set to the `wamid` from Meta.
- The `channel_identity` will use `channel: 'whatsapp'` and `channel_handle: sender.wa_id`.

## Testing
- **Logic:** Unit test the payload parser and signature verifier.
- **API:** Ensure the GET route correctly echoes back the challenge.
- **Idempotency:** Verify that duplicate `wamid`s are handled gracefully (ignored).

## AI Notes
- Keep `src/app/api/webhooks/whatsapp/route.ts` slim; push logic to `src/lib/channels/whatsapp/`.
- Handle Meta's batch payloads: a single webhook POST may contain multiple `entry` objects, each with multiple `changes`. Iterate correctly.
