# WhatsApp webhook auth + message-media tenant isolation

**Type:** Fix

**Status:** verified

**Fixes:** F-01, F-02

## The problem

Two P1 trust-boundary defects in the feature-16 WhatsApp/omnichannel code, both
shipped on `main`.

### F-01 - webhook signature and verify-token are not effectively enforced

`src/app/api/webhooks/whatsapp/route.ts` reads `process.env.META_APP_SECRET`,
`process.env.META_VERIFY_TOKEN`, and `process.env.META_ACCESS_TOKEN`. But
`.env.example` documents the WhatsApp secrets as `WHATSAPP_APP_SECRET` and
`WHATSAPP_VERIFY_TOKEN` (and never documents an access token). Configure the app
exactly per `.env.example` and all three are `undefined`:

- `META_APP_SECRET` -> `''` (line 9). `verifyWhatsAppSignature`
  (`src/lib/channels/whatsapp/webhook.ts:20`) passes that into
  `crypto.createHmac('sha256', '')`, a valid keyed HMAC. An attacker who knows
  the body computes `HMAC-SHA256('', body)`, sends it as `x-hub-signature-256`,
  and `timingSafeEqual` returns true. Forged payloads are then written to
  `messages` / `channel_identities` / storage via the service-role client.
- `META_VERIFY_TOKEN` -> the hardcoded literal `'merchander_webhook_verify_token'`
  (line 19), a secret in source, so the GET subscription handshake is
  completable by anyone.
- `META_ACCESS_TOKEN` -> `''`, silently disabling media fetch.

The Telegram route already does this right (`secretTokenValid` returns false when
the expected token is unset), and `src/utils/webhook-signature.ts` already
exports `verifyMetaSignature` (rejects an empty/undefined secret, constant-time)
and `timingSafeStringEqual`, both with full unit tests. The WhatsApp route uses
neither and instead relies on a weaker duplicate helper.

### F-02 - message-media storage bucket is not tenant-scoped

`supabase/migrations/20260904004435_create_message_media_bucket.sql` makes the
bucket private but both policies gate only on
`bucket_id = 'message-media' and auth.role() = 'authenticated'`. Objects live at
`${tenantId}/whatsapp/${messageId}.${ext}` and hold customer-sent WhatsApp media
(photos, documents, voice notes - often PII). Any signed-in merchant can
`list` / `download` another tenant's media by path, and can `upload`
(`upsert: true`) over any path. Latent only because the webhook does not write
media yet (blocked by the mock routing in F-04), but the policy ships on `main`.

## The fix

### F-01

- In `route.ts`: read `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`,
  `WHATSAPP_ACCESS_TOKEN` (names `.env.example` documents / will document).
- POST: verify with `verifyMetaSignature(rawBody, signature, appSecret)` from
  `@/utils/webhook-signature`. It already returns false for an empty/undefined
  secret, so an unconfigured deploy rejects every request (401) instead of
  accepting forged ones.
- GET: compare `hub.verify_token` to `WHATSAPP_VERIFY_TOKEN` with
  `timingSafeStringEqual`, and return 403 when the env var is unset. No literal
  fallback.
- Delete the now-unused `verifyWhatsAppSignature` from
  `src/lib/channels/whatsapp/webhook.ts` and its `describe` block from
  `webhook.test.ts` (this is the helper-duplication half of F-06; the unused
  outbound module in F-06 stays open). `parseWhatsAppMessages` /
  `parseWhatsAppStatuses` and their tests are untouched.
- Add `WHATSAPP_ACCESS_TOKEN` to `.env.example` under the existing Channel
  Webhooks block.

### F-02

- New migration: drop both `message-media` policies and recreate them scoped to
  the caller's tenant via `(storage.foldername(name))[1]` matched against
  `public.tenant_users` by `auth.uid()`. SELECT and INSERT both tenant-scoped
  (INSERT kept for future merchant-uploaded outbound media; the webhook writes
  as service_role and bypasses RLS regardless).

### Must not break

- The Telegram webhook route and `src/utils/webhook-signature.ts` are untouched.
- Service-role webhook writes (`messages`, `channel_identities`, storage
  `upload`) still work - `service_role` bypasses RLS, and the new storage
  policies do not use `RESTRICTIVE`.
- `verifyMetaSignature` compares the full `sha256=<hex>` header (the old helper
  split the prefix first); both are correct. WhatsApp POST always carries a body,
  so the helper's non-empty-`rawBody` guard does not reject real traffic.
- `parseWhatsAppMessages` / `parseWhatsAppStatuses` output and tests unchanged.
- No `src/types/supabase.ts` regen needed (storage policies are not `public`
  schema tables).
- `npx supabase db reset --local` still applies the full migration chain
  cleanly.

## Build steps

- [x] **Step 1 - F-01: enforce webhook auth with the shared helpers.** In
  `route.ts` switch to `WHATSAPP_APP_SECRET` / `WHATSAPP_VERIFY_TOKEN` /
  `WHATSAPP_ACCESS_TOKEN`, verify POST with `verifyMetaSignature`, verify GET
  with `timingSafeStringEqual` + 403-when-unset (no literal), delete
  `verifyWhatsAppSignature` from `webhook.ts` and its test block, add
  `WHATSAPP_ACCESS_TOKEN` to `.env.example`. Done when: `yarn check` + `yarn lint`
  + `yarn build` + `yarn test` clean; a local check shows an empty/absent secret
  makes both GET and POST reject, and a correctly signed body with the real
  secret is accepted.
- [x] **Step 2 - F-02: tenant-scope the message-media policies.** Add
  `supabase/migrations/<ts>_scope_message_media_to_tenant.sql` that drops and
  recreates the SELECT and INSERT policies tenant-scoped. Done when:
  `npx supabase db reset --local` applies clean, and a local script confirms an
  authenticated client for tenant A cannot select/insert an object under tenant
  B's folder while the service-role client still can.

## Verify

- `yarn lint`, `yarn check`, `yarn build`, `yarn test` all clean.
- `npx supabase db reset --local` runs the whole chain without error.
- F-01 local check: POST with a body signed by `WHATSAPP_APP_SECRET` = 200; POST
  with a forged `sha256=` (empty-key HMAC) = 401; GET with the wrong / no
  `hub.verify_token` = 403; GET with the right token = echoes the challenge.
- F-02 local check: with two seeded tenants, an anon client authenticated as
  tenant A gets 0 rows / a policy error reading or writing `B/whatsapp/x.jpg`,
  and the service-role client succeeds.
- Code review: `grep -n "META_\|merchander_webhook_verify_token" src/app/api/webhooks/whatsapp/route.ts`
  returns nothing; `grep -rn "verifyWhatsAppSignature" src/` returns nothing.

## Findings

### whatsapp-webhook-auth-media-rls/F-01 [P1] closed - WhatsApp webhook signature and verify-token are not effectively enforced

**File:** src/app/api/webhooks/whatsapp/route.ts:9
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** The route reads `process.env.META_APP_SECRET`,
`process.env.META_VERIFY_TOKEN`, and `process.env.META_ACCESS_TOKEN`, but
`.env.example` documents the WhatsApp secrets as `WHATSAPP_APP_SECRET` /
`WHATSAPP_VERIFY_TOKEN` (and never documents an access token). An operator who
configures the app exactly per `.env.example` leaves all three `undefined`:
- `META_APP_SECRET` falls back to `''` (line 9). `verifyWhatsAppSignature`
  (`src/lib/channels/whatsapp/webhook.ts:20`) passes that straight into
  `crypto.createHmac('sha256', '')`, which is a valid keyed HMAC. An attacker
  who knows the body computes `HMAC-SHA256('', body)` and sends it as
  `x-hub-signature-256`; `timingSafeEqual` then returns true. The POST handler
  authenticates forged payloads and writes them to `messages` /
  `channel_identities` / storage via the service-role client.
- `META_VERIFY_TOKEN` falls back to the hardcoded literal
  `'merchander_webhook_verify_token'` (line 19), a secret committed in source, so
  the GET subscription handshake is completable by anyone.
- `META_ACCESS_TOKEN` falls back to `''`, silently disabling media fetch.
The sibling Telegram route does this correctly: `secretTokenValid` returns
`false` when the expected token is unset, and the canonical
`verifyMetaSignature` in `src/utils/webhook-signature.ts` already rejects an
empty `appSecret`. The WhatsApp route uses neither.
**Suggested fix:** Read the same names `.env.example` documents
(`WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`; add `WHATSAPP_ACCESS_TOKEN` to
`.env.example`). Replace `verifyWhatsAppSignature` with the shared
`verifyMetaSignature` (it rejects an empty/undefined secret). Reject the request
with 5xx/misconfig when the secret or verify token is unset rather than falling
back to `''` or a literal. Remove the hardcoded verify-token default.
**Resolution:** Fixed in fix/whatsapp-webhook-auth-media-rls.
`src/app/api/webhooks/whatsapp/route.ts` now reads `WHATSAPP_APP_SECRET` /
`WHATSAPP_VERIFY_TOKEN` / `WHATSAPP_ACCESS_TOKEN` (names `.env.example`
documents). POST verifies with `verifyMetaSignature` from
`@/utils/webhook-signature`, which returns false for an empty/undefined secret,
so an unconfigured deploy 401s every request instead of accepting forged ones.
GET compares `hub.verify_token` with `timingSafeStringEqual` and 403s when
`WHATSAPP_VERIFY_TOKEN` is unset - the `'merchander_webhook_verify_token'`
literal is gone. The weaker duplicate `verifyWhatsAppSignature` and its test
block were deleted from `src/lib/channels/whatsapp/webhook.ts` /
`webhook.test.ts` (the helper-dup half of F-06; the unused outbound module in
F-06 stays open). `WHATSAPP_ACCESS_TOKEN` added to `.env.example`.
`check`/`lint`/`build` clean; `test` 270 (was 273; the 3 removed cases are
covered by the existing `verifyMetaSignature` suite).
Re-reviewed 2026-09-03 by /audit (scope: current; branch
`fix/whatsapp-webhook-auth-media-rls`, base `7a03603`). `route.ts` reads the
documented names; `verifyMetaSignature(rawBody, sig, WHATSAPP_APP_SECRET)` with
`WHATSAPP_APP_SECRET: string | undefined` - the helper's `!appSecret` guard
returns false, so an unset secret 401s every POST (proven by
`webhook-signature.test.ts` line 38). GET: `!!WHATSAPP_VERIFY_TOKEN && !!token &&
timingSafeStringEqual(...)` - 403s when unset, no literal remains
(`grep "merchander_webhook_verify_token"` clean). `verifyWhatsAppSignature` fully
gone (`grep -rn "verifyWhatsAppSignature" src/` empty), `crypto` import removed
from `webhook.ts`. No new defect; the string re-encoding of `rawBody` for HMAC is
unchanged from before and matches the Telegram route pattern. Closed.

### whatsapp-webhook-auth-media-rls/F-02 [P1] closed - message-media storage bucket is readable and writable by every authenticated user

**File:** supabase/migrations/20260904004435_create_message_media_bucket.sql:8
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** The bucket is private (`public: false`), but both policies
gate only on `bucket_id = 'message-media' and auth.role() = 'authenticated'`,
with no check that `(storage.foldername(name))[1]` matches the caller's tenant.
Objects are written at `${tenantId}/whatsapp/${messageId}.${ext}` and hold
customer-sent WhatsApp media (photos, documents, voice notes - frequently PII).
Any signed-in merchant on the platform can `list`/`download` another tenant's
media by path, and can `upload` (the webhook uses `upsert: true`) to any path,
overwriting another tenant's objects. This is latent only because the webhook
does not write media yet (F-04 blocks it), but the policy ships on `main`.
**Suggested fix:** Scope both policies to the caller's tenant via the
`tenant_users` lookup on `(storage.foldername(name))[1]::uuid`, matching the
tenant-scoped pattern used elsewhere. Keep service-role (webhook) writes working
(it bypasses RLS).
**Resolution:** Fixed in fix/whatsapp-webhook-auth-media-rls. New migration
`20260904120000_scope_message_media_to_tenant.sql` drops both
`auth.role() = 'authenticated'` policies and recreates SELECT + INSERT scoped to
`(storage.foldername(name))[1] in (select tenant_id::text from public.tenant_users
where user_id = auth.uid())`. Verified against the local DB: a merchant
authenticated for tenant A is DENIED upload under tenant B's folder (`new row
violates row-level security policy`) and sees 0 rows listing tenant B's folder,
while their own folder works and the service-role client still writes both.
`npx supabase db reset --local` applies the whole chain clean; no
`src/types/supabase.ts` change (storage policies are not `public`-schema tables).
Re-reviewed 2026-09-03 by /audit (scope: current). The two `drop policy if
exists` names match `20260904004435` exactly; the new predicate is the same
`tenant_id in (select ... from tenant_users where user_id = auth.uid())` form
every tenant table in the schema uses. Live re-check on the reset DB: merchant
for tenant A -> upload to tenant B folder DENIED, list tenant B folder 0 rows,
own folder OK, service_role writes both. UPDATE/DELETE stay default-deny for
authenticated (unchanged from the original migration; webhook `upsert` runs as
service_role). No new defect. Closed.
