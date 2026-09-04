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
  type: 'text' | 'image' | 'audio' | 'document' | 'video' | 'other';
  text?: string;
  mediaId?: string;
  mimeType?: string;
  timestamp: string;
}

/**
 * Extracts text and media messages from a webhook payload.
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
        const contact = value.contacts?.find((c) => c.wa_id === msg.from);
        
        let type: ParsedWhatsAppMessage['type'] = 'other';
        let text: string | undefined;
        let mediaId: string | undefined;
        let mimeType: string | undefined;

        if (msg.type === 'text' && msg.text?.body) {
          type = 'text';
          text = msg.text.body;
        } else if (msg.type === 'image' && msg.image) {
          type = 'image';
          mediaId = msg.image.id;
          mimeType = msg.image.mime_type;
        } else if (msg.type === 'audio' && msg.audio) {
          type = 'audio';
          mediaId = msg.audio.id;
          mimeType = msg.audio.mime_type;
        } else if (msg.type === 'document' && msg.document) {
          type = 'document';
          mediaId = msg.document.id;
          mimeType = msg.document.mime_type;
        } else if (msg.type === 'video' && msg.video) {
          type = 'video';
          mediaId = msg.video.id;
          mimeType = msg.video.mime_type;
        } else {
          continue; // Unsupported message type
        }

        messages.push({
          phoneNumberId,
          from: msg.from,
          profileName: contact?.profile?.name,
          messageId: msg.id,
          type,
          text,
          mediaId,
          mimeType,
          timestamp: msg.timestamp,
        });
      }
    }
  }

  return messages;
}

export interface ParsedWhatsAppStatus {
  phoneNumberId: string;
  messageId: string;
  status: string;
  timestamp: string;
  recipientId: string;
}

/**
 * Extracts all status updates from a webhook payload.
 */
export function parseWhatsAppStatuses(payload: WhatsAppWebhookPayload): ParsedWhatsAppStatus[] {
  const statuses: ParsedWhatsAppStatus[] = [];
  
  if (payload.object !== 'whatsapp_business_account' || !payload.entry) {
    return statuses;
  }

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field !== 'messages') continue;
      
      const value = change.value;
      if (!value.statuses || value.statuses.length === 0) continue;

      const phoneNumberId = value.metadata.phone_number_id;
      
      for (const status of value.statuses) {
        statuses.push({
          phoneNumberId,
          messageId: status.id,
          status: status.status,
          timestamp: status.timestamp,
          recipientId: status.recipient_id,
        });
      }
    }
  }

  return statuses;
}
