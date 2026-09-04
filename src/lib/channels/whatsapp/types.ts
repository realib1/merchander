export interface WhatsAppWebhookPayload {
  object: string;
  entry?: WhatsAppWebhookEntry[];
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookChange {
  value: WhatsAppWebhookValue;
  field: string;
}

export interface WhatsAppWebhookValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WhatsAppWebhookContact[];
  messages?: WhatsAppWebhookMessage[];
  statuses?: WhatsAppWebhookStatus[];
}

export interface WhatsAppWebhookContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface WhatsAppWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
  image?: { id: string; mime_type: string; sha256: string };
  audio?: { id: string; mime_type: string; sha256: string };
  document?: { id: string; mime_type: string; sha256: string; filename?: string };
  video?: { id: string; mime_type: string; sha256: string };
}

export interface WhatsAppWebhookStatus {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
}

// --- Outbound API Types ---

export interface WhatsAppOutboundRequestBase {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text' | 'template';
}

export interface WhatsAppOutboundTextRequest extends WhatsAppOutboundRequestBase {
  type: 'text';
  text: {
    preview_url?: boolean;
    body: string;
  };
}

export interface WhatsAppTemplateLanguage {
  code: string;
}

export interface WhatsAppTemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  text?: string;
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters: WhatsAppTemplateParameter[];
}

export interface WhatsAppOutboundTemplateRequest extends WhatsAppOutboundRequestBase {
  type: 'template';
  template: {
    name: string;
    language: WhatsAppTemplateLanguage;
    components?: WhatsAppTemplateComponent[];
  };
}

export type WhatsAppOutboundRequest = WhatsAppOutboundTextRequest | WhatsAppOutboundTemplateRequest;

export interface WhatsAppOutboundResponse {
  messaging_product: string;
  contacts: {
    input: string;
    wa_id: string;
  }[];
  messages: {
    id: string;
  }[];
}
