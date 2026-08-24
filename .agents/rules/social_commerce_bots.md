# Social Commerce Bot Rules (WhatsApp & Telegram)

## 1. WhatsApp Integration (Baileys Engine)

1. **Multi-Session Isolation**:
   - Every tenant connection operates in its own sandboxed Baileys socket instance.
   - Authentication states must NEVER be mixed across tenants.
2. **Rate Limiting & Safety**:
   - Enforce minimum delay of 3–5 seconds between automated group posts to prevent WhatsApp spam bans.
   - Cap maximum automated group posts per hour per tenant (e.g. max 10 posts/hr for Basic, 30 posts/hr for Pro).
3. **QR Pairing Flow**:
   - Stream QR code data via SSE/WebSocket directly to the authenticated merchant's dashboard.
   - Disconnect and clean up inactive pairing sockets after 120 seconds if unauthenticated.

---

## 2. Telegram Integration (Multi-Bot Engine)

1. **Token Storage**:
   - Telegram bot tokens (`123456:ABC-DEF...`) provided by merchants must be encrypted at rest in the database.
2. **Webhook Endpoint Security**:
   - Webhook URL format: `/v1/bots/telegram/webhook/{tenant_id}`.
   - Validate that incoming updates correspond to the registered bot token for that `tenant_id`.

---

## 3. Order Parsing & Confirmation Engine

1. **Format Handling**:
   - Support Ghanaian phone number variations: `024XXXXXXX`, `055XXXXXXX`, `020XXXXXXX`, `+23324XXXXXXX`.
   - Match item keywords against tenant's active product catalog.
2. **Default Payment Message**:
   - Every confirmed social order must trigger an automated response:
     > *"✅ Order {order_number} received! Total: GH₵{total_amount}.\n\n📱 Please send Mobile Money to: {momo_number} ({merchant_name})\nReference: {order_number}\n\nWe will prepare your order immediately once payment is confirmed!"*
