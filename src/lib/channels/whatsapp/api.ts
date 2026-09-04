import {
  WhatsAppOutboundRequest,
  WhatsAppOutboundResponse,
  WhatsAppTemplateComponent
} from './types';

const GRAPH_API_VERSION = 'v19.0';
const GRAPH_API_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class WhatsAppAPIError extends Error {
  constructor(public status: number, public data: unknown) {
    super(`WhatsApp API Error ${status}: ${JSON.stringify(data)}`);
    this.name = 'WhatsAppAPIError';
  }
}

/**
 * Core function to send an outbound request to Meta Graph API.
 */
async function sendWhatsAppRequest(
  phoneNumberId: string,
  accessToken: string,
  payload: WhatsAppOutboundRequest
): Promise<WhatsAppOutboundResponse> {
  const url = `${GRAPH_API_BASE_URL}/${phoneNumberId}/messages`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new WhatsAppAPIError(response.status, errorData);
  }

  return response.json();
}

/**
 * Sends a free-form text message to a WhatsApp user.
 */
export async function sendWhatsAppTextMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
): Promise<WhatsAppOutboundResponse> {
  return sendWhatsAppRequest(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { body: text },
  });
}

/**
 * Sends a pre-approved template message to a WhatsApp user.
 */
export async function sendWhatsAppTemplateMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  templateName: string,
  languageCode: string = 'en_US',
  components?: WhatsAppTemplateComponent[]
): Promise<WhatsAppOutboundResponse> {
  return sendWhatsAppRequest(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components && components.length > 0 ? { components } : {})
    }
  });
}
