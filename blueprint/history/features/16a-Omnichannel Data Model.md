# Current Feature

**Feature 16a: Omnichannel Data Model & Identity Scaffolding**
**Status:** `verified`

## Goal
Establish the core channel-agnostic data foundation for all future social-commerce integrations. This involves creating the `channel_identities` and `messages` tables (dropping the `conversations` concept per the product pivot to an approval/exceptions queue) and building the robust `resolveChannelIdentity` utility to securely map external handles to Merchander customers.

## In Scope
- Database migrations for `channel_identities` and `messages` tables.
- RLS policies ensuring strict `tenant_id` isolation for both tables.
- Supabase Types generation.
- Server-side utility function: `resolveChannelIdentity(tenantId, channel, handle, name?)`.

## Out of Scope
- Creating the actual WhatsApp webhook route (handled in 16b).
- Meta Graph API outbound clients (handled in 16c).
- Any UI or chat inbox components (as the app does not rebuild a chat client).
- Forced merging of identities (unverified handles remain unresolved profiles).

## Context & Constraints
- **Data Isolation:** All operations must be scoped strictly by `tenant_id`.
- **Identity Resolution:** If a `channel_identity` with the given handle exists, return it. If not, create a new `channel_identity` without a linked `customer_id` (unresolved profile). We never blindly link a new WhatsApp number to an existing customer record by name alone; reliable signals (like exact verified phone number matching) must be used.

## Build Steps
- [x] 1. Create Supabase migration for `channel_identities` (channel, handle, customer_id) and `messages` (direction, status, content jsonb, external_id).
- [x] 2. Apply migration, ensure strict RLS policies, and run type generation (`yarn supabase gen types`).
- [x] 3. Create `src/lib/channels/identity.ts` exporting `resolveChannelIdentity`.
- [x] 4. Implement `resolveChannelIdentity` logic with precise deterministic queries against the tenant.
- [x] 5. Add unit tests for `resolveChannelIdentity` in `src/lib/channels/identity.test.ts`.

## Files & Areas
- `supabase/migrations/[TIMESTAMP]_create_omnichannel_tables.sql` [NEW]
- `src/types/supabase.ts` [MODIFY]
- `src/lib/channels/identity.ts` [NEW]
- `src/lib/channels/identity.test.ts` [NEW]

## Data & Contracts
- **`channel_identities`**: `id`, `tenant_id`, `customer_id` (nullable), `channel` (whatsapp, instagram, telegram), `channel_handle` (e.g. `233241234567`), `profile_name` (optional), `created_at`.
- **`messages`**: `id`, `tenant_id`, `channel_identity_id`, `direction` (inbound, outbound), `message_type` (text, template, media, interactive), `content` (jsonb), `status` (received, sent, delivered, read, failed), `external_id` (string), `created_at`.

## Testing
- Unit testing: `yarn test src/lib/channels/identity.test.ts`.
- Must test: 1) Existing identity match, 2) New unresolved identity creation, 3) Graceful handling of concurrent identical handle creation (upsert semantics).

## AI Notes
- Keep the `content` column as `jsonb` to allow flexibility across different channel message structures.
- Rely on `channel` + `channel_handle` as a unique constraint per tenant.
- Ensure `yarn test` passes completely before completing step 5.
