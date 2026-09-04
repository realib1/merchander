import crypto from 'crypto';
import { WhatsAppWebhookPayload } from './types';

/**
 * Verifies the Meta webhook signature.
 * @param payload - Raw body string
 * @param signatureHeader - X-Hub-Signature-256 header value
 * @param appSecret - Meta App Secret
 * @returns true if valid
 */
export function verifyWhatsAppSignature(
  payload: string,
  signatureHeader: string | null | undefined,
  appSecret: string
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }
  const signature = signatureHeader.split('sha256=')[1];
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload, 'utf8')
    .digest('hex');
  
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    // timingSafeEqual throws if buffer lengths mismatch
    return false;
  }
}

export interface ParsedWhatsAppMessage {
  phoneNumberId: string;
  from: string;
  profileName?: string;
  messageId: string;
  text: string;
  timestamp: string;
}

/**
 * Extracts all text messages from a webhook payload.
 */
export function parseWhatsAppMessages(payload: WhatsAppWebhookPayload): ParsedWhatsAppMessage[] {
  const messages: ParsedWhatsAppMessage[] = [];
  
  if (payload.object !== 'whatsapp_business_account' || !payload.entry) {
    return messages;
  }

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field !== 'messages') continue;
      
      const value = change.value;
      if (!value.messages || value.messages.length === 0) continue;

      const phoneNumberId = value.metadata.phone_number_id;
      
      for (const msg of value.messages) {
        if (msg.type !== 'text' || !msg.text?.body) continue; // Only handling text for now

        const contact = value.contacts?.find((c) => c.wa_id === msg.from);
        
        messages.push({
          phoneNumberId,
          from: msg.from,
          profileName: contact?.profile?.name,
          messageId: msg.id,
          text: msg.text.body,
          timestamp: msg.timestamp,
        });
      }
    }
  }

  return messages;
}
