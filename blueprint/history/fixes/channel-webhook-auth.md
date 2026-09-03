# Current Feature

**Title:** Authenticate the WhatsApp and Telegram inbound webhooks

**Type:** Fix

**Status:** verified

**Source:** `/audit full` on 2026-09-03, findings F-09 and F-10 (archived as
`unauthenticated-boundary-p0s/F-09` and `/F-10`, accepted-deferred to this fix).
F-06 (Paystack subscription amount) was in the original cluster but is entangled
with F-11 and moves to that work; see "Out of scope".

## The problem

Two of the four inbound webhook routes accept unauthenticated traffic.

| ID | Route | Defect |
|---|---|---|
| F-09 | `api/webhooks/whatsapp/route.ts` | `POST` parses and acts on the body with no `X-Hub-Signature-256` check, so anyone can post fabricated inbound messages. The `GET` handshake compares against `VERIFY_TOKEN`, which falls back to the literal `'merchander_verify_token'` committed at line 8 when the env var is unset. |
| F-10 | `api/webhooks/telegram/route.ts` | The secret-token check is guarded by `process.env.NODE_ENV === 'production'`, so every preview and staging deployment accepts unsigned traffic. `TELEGRAM_SECRET_TOKEN` falls back to the literal `'merchander_telegram_token'` committed at line 6. |

Both handlers currently only call the `extractCartFromChat` stub and
`console.log`, so the live blast radius is small. But features 16 to 21 build
directly on this boundary, and a committed-literal fallback plus a skipped check
is the wrong state to build on.

Neither route has any env vars documented in `.env.example`.

## The fix

Verify authenticity before parsing the body, fail closed when the secret is not
configured, and delete every hardcoded fallback secret.

- **WhatsApp:** verify `X-Hub-Signature-256` as `sha256=` + HMAC-SHA256 of the
  raw request body keyed with the Meta app secret (`WHATSAPP_APP_SECRET`), using
  a constant-time compare. The `GET` handshake requires `WHATSAPP_VERIFY_TOKEN`
  with no literal fallback. Both return 403 when their secret is missing.
- **Telegram:** compare `X-Telegram-Bot-Api-Secret-Token` against
  `TELEGRAM_SECRET_TOKEN` on every request, constant-time, and return 403 when
  the env var is unset. No literal fallback.
- Document `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, and
  `TELEGRAM_SECRET_TOKEN` in `.env.example`.

Must not break:

- The Meta `GET` subscribe handshake still echoes `hub.challenge` for a correct
  token.
- A verified payload still reaches `extractCartFromChat` exactly as now; the
  normalization and the 200-always response for a *processed* event are
  unchanged.
- The Paystack and Hubtel routes are not touched.
- `yarn test`, `yarn lint`, `yarn check`, `yarn build` all green.

## Build steps

- [x] 1. **Pure signature helper with a test.** Add
  `src/utils/webhook-signature.ts` exporting
  `verifyMetaSignature(rawBody: string, signatureHeader: string | null, appSecret: string | undefined): boolean`:
  computes `sha256=<hmac-sha256 hex>` and compares to the header in constant
  time, returns `false` on any missing input or length mismatch. Ship
  `src/utils/webhook-signature.test.ts` covering a valid signature, a tampered
  body, a missing header, and a missing secret.
  *Done when:* `yarn test` includes the new file and passes.

- [x] 2. **WhatsApp route.** Read the raw body once with `await request.text()`.
  In `POST`, call `verifyMetaSignature(rawBody, request.headers.get('x-hub-signature-256'), process.env.WHATSAPP_APP_SECRET)`
  before `JSON.parse`; return 403 on failure. In `GET`, drop the
  `'merchander_verify_token'` fallback and return 403 when
  `WHATSAPP_VERIFY_TOKEN` is unset or the token does not match.
  *Done when:* a POST with a wrong or absent `x-hub-signature-256` gets 403 and
  never calls `extractCartFromChat`; a correctly signed body still does; the GET
  handshake still echoes the challenge for a valid token.

- [x] 3. **Telegram route.** Remove the `NODE_ENV === 'production'` guard and the
  `'merchander_telegram_token'` fallback. Compare
  `x-telegram-bot-api-secret-token` to `process.env.TELEGRAM_SECRET_TOKEN` in
  constant time on every request; return 403 when the header is wrong or the env
  var is unset. Do this before `request.json()`.
  *Done when:* any POST without the exact secret header gets 403 regardless of
  `NODE_ENV`; a POST with the right header proceeds.

- [x] 4. **Document the env vars.** Add a `# --- Channel Webhooks ---` block to
  `.env.example` with `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, and
  `TELEGRAM_SECRET_TOKEN`, each with a placeholder value and a one-line comment.
  *Done when:* `grep -E 'WHATSAPP_APP_SECRET|WHATSAPP_VERIFY_TOKEN|TELEGRAM_SECRET_TOKEN' .env.example` returns all three.

## Verify

- `yarn test` (new signature test green), `yarn lint`, `yarn check`, `yarn build`.
- Grep: no `'merchander_verify_token'` or `'merchander_telegram_token'` literal
  remains in `src/`.
- WhatsApp POST: `curl` the local route with a body and no signature header ->
  403. With `X-Hub-Signature-256: sha256=<correct hmac>` -> processed. GET with
  `hub.verify_token` unset in env -> 403.
- Telegram POST: `curl` with no `X-Telegram-Bot-Api-Secret-Token` -> 403 even
  with `NODE_ENV` unset. With the right header -> 200.

## Out of scope

- **F-06** (Paystack subscription webhook trusts `metadata.tier` / amount).
  Cannot be fixed here: `initiateSubscriptionUpgradePayment` prices from its own
  `starter | pro | enterprise` matrix, which does not match `platform_plans`, so
  the webhook has nothing correct to validate `data.amount` against until F-11
  picks one subscription model. F-06 moves to the F-11 work.
- F-07, F-08, F-12 (platform-console consolidation follow-ups).
