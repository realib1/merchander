export type Platform = 'whatsapp' | 'telegram' | 'web';

export interface NormalizedMessage {
  platform: Platform;
  external_id: string; // Message ID from the platform
  sender_id: string; // The phone number or user ID of the sender
  text: string;
  timestamp: string; // ISO 8601 string
}

// Extracted Cart Data returned by the Python Intelligence Brain
export interface ExtractedCart {
  items: Array<{
    sku: string;
    quantity: number;
  }>;
  confidence: number;
}
