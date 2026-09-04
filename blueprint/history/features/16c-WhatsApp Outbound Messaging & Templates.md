# Current Feature

**Feature 16c: WhatsApp Outbound Messaging & Templates**
**Status:** `verified`

## Goal
Build the API client to send outbound text and template messages back to WhatsApp users via the Meta Graph API. Integrate this with our `messages` table so that outbound messages are recorded locally alongside inbound messages.

## In Scope
- Create a Meta Graph API client for WhatsApp (`src/lib/channels/whatsapp/api.ts`).
- Functionality to send free-form text messages.
- Functionality to send template messages (used for starting conversations outside the 24h window).
- Database insertion of `outbound` messages into the `messages` table upon successful send.
- Error handling for failed sends (e.g. user blocked, token expired).

## Out of Scope
- Actually building the UI to trigger these messages.
- Downloading/uploading media.
- Implementing the integration settings database table (we will stub the credential retrieval).

## Context & Constraints
- **Graph API:** We must call `https://graph.facebook.com/v19.0/{phone_number_id}/messages`.
- **Authentication:** Requires a Bearer token (Meta App System User Token or Tenant specific token).
- **Tenant Routing:** Similar to 16b, we will use a stub `getTenantWhatsAppConfig(tenantId)` to provide the mock phone number ID and access token until the settings schema is fleshed out.
- **Message Types:** The client needs strict TypeScript definitions for the outbound payloads (text and template).

## Build Steps
- [x] 1. Define types for Meta Graph API outbound requests in `src/lib/channels/whatsapp/types.ts`.
- [x] 2. Create `src/lib/channels/whatsapp/api.ts` and implement `sendWhatsAppTextMessage` and `sendWhatsAppTemplateMessage` wrapping standard `fetch` calls.
- [x] 3. Create a unified `sendOutboundWhatsAppMessage` service that handles both sending to Meta and inserting the `outbound` record into `messages`.
- [x] 4. Add unit tests for the Graph API client (using mocked `fetch`) in `src/lib/channels/whatsapp/api.test.ts`.

## Files & Areas
- `src/lib/channels/whatsapp/types.ts` [MODIFY]
- `src/lib/channels/whatsapp/api.ts` [NEW]
- `src/lib/channels/whatsapp/api.test.ts` [NEW]

## Data & Contracts
- The Graph API client requires an access token and phone number ID.
- The `messages` table receives `direction: outbound`, `status: sent`, and the Meta response ID as `external_id`.

## Testing
- **Logic:** Unit test the API payload construction and mock the HTTP fetch.
- **Integration:** Ensure the db insertion correctly captures the `external_id` returned by Meta.
