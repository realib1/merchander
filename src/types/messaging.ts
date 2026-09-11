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
  intent?: string;
  notes?: string | null;
}

export interface ExtractionRequest {
  tenant_id?: string | null;
  message: NormalizedMessage;
}

export interface CustomerContext {
  customer_id?: string | null;
  phone_number?: string | null;
  name?: string | null;
}

export interface BusinessGroundingContext {
  aboutBusiness?: string | null;
  whatWeSell?: string | null;
  deliveryInfo?: string | null;
  returnPolicy?: string | null;
  customerPolicies?: string | null;
}

export interface AiAgentConfig {
  enabled?: boolean;
  mode?: 'assisted' | 'autonomous';
  responseTone?: 'friendly' | 'professional' | 'enthusiastic' | 'concise';
  safetyTier?: 'standard' | 'strict' | 'relaxed';
  groundingEnabled?: boolean;
}

export interface ReplyRequest {
  tenant_id?: string | null;
  message: NormalizedMessage;
  customer?: CustomerContext | null;
  grounding?: BusinessGroundingContext | null;
  agent_config?: AiAgentConfig | null;
}

export interface ReplyResponse {
  reply_text: string;
  intent: string;
  confidence: number;
  grounded_facts: string[];
  requires_human_approval: boolean;
  escalation_reason?: string | null;
}

