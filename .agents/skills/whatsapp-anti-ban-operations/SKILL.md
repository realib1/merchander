---
name: whatsapp-anti-ban-operations
description: >-
  Use this skill when implementing WhatsApp message broadcasting, socket reconnection,
  anti-ban rate limiting, human typing delays, or session recovery.
---

# WhatsApp Anti-Ban & Session Reliability Guide

This skill provides safeguards and protocols to keep merchant WhatsApp accounts healthy and prevent automated spam bans from Meta.

---

## 1. Core Anti-Ban Rules

1. **Jittered Broadcasting Delays**:
   - Never broadcast messages to multiple groups in a tight loop.
   - Insert a random delay of **4 to 9 seconds** between consecutive group posts.

2. **Simulate Human Presence**:
   - Before sending a message to a chat/group, send a `composing` presence update for 1.5–3 seconds:
```typescript
import { WASocket, delay } from "@whiskeysockets/baileys";

export async function sendHumanLikeMessage(
  sock: WASocket,
  jid: string,
  content: { text?: string; image?: Buffer; caption?: string }
) {
  // 1. Send "typing..." presence
  await sock.presenceSubscribe(jid);
  await sock.sendPresenceUpdate("composing", jid);

  // 2. Realistic human delay (1500ms - 3000ms)
  const typingDelay = Math.floor(Math.random() * 1500) + 1500;
  await delay(typingDelay);

  // 3. Clear presence & send
  await sock.sendPresenceUpdate("paused", jid);
  return await sock.sendMessage(jid, content);
}
```

3. **Capped Broadcasting Limits per Tier**:
   - **Free Plan**: Max 5 group posts per hour.
   - **Basic Plan**: Max 15 group posts per hour.
   - **Pro Plan**: Max 30 group posts per hour (with min 6-second interval).

---

## 2. Session Recovery & Automatic Reconnects

```typescript
import { DisconnectReason } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";

export function shouldReconnectSession(error: any): boolean {
  const statusCode = (error as Boom)?.output?.statusCode;
  
  if (statusCode === DisconnectReason.loggedOut) {
    // Merchant logged out from WhatsApp device settings; require fresh QR scan
    return false;
  }
  
  if (statusCode === DisconnectReason.restartRequired || statusCode === DisconnectReason.connectionLost) {
    // Transient network drop; reconnect automatically
    return true;
  }
  
  return true;
}
```
