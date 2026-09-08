export type ActionTier = 'green' | 'yellow' | 'red';

export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'cancelled';

export type ActionType = 'reply' | 'confirm_payment' | 'draft_order' | 'human_handoff';

export interface ProposedPayload {
  reply_text?: string;
  to?: string;
  customer_name?: string;
  customer_phone?: string;
  order_number?: string;
  items?: Array<{ sku: string; quantity: number }>;
  [key: string]: unknown;
}

export interface AIActionRecord {
  id: string;
  tenant_id: string;
  channel_identity_id: string;
  customer_id: string | null;
  action_type: ActionType;
  tier: ActionTier;
  status: ActionStatus;
  proposed_payload: ProposedPayload;
  grounded_facts: string[];
  confidence: number;
  escalation_reason: string | null;
  customer_notice_sent: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // Join fields from channel_identities / customers
  customer?: {
    id: string;
    name: string | null;
    phone: string | null;
  } | null;
  channel_identity?: {
    channel: string;
    channel_handle: string;
    profile_name: string | null;
  } | null;
}

export interface ActionSafetyClassification {
  tier: ActionTier;
  actionType: ActionType;
  autoDispatch: boolean;
  requiresHumanApproval: boolean;
  customerAssuranceNotice?: string;
  escalationReason?: string | null;
}
