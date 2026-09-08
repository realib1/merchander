import { ActionSafetyClassification, ActionType } from '@/types/actions';

export interface ClassifyActionSafetyParams {
  intent: string;
  confidence: number;
  requires_human_approval?: boolean;
  escalation_reason?: string | null;
}

export const PAYMENT_ASSURANCE_NOTICE =
  'Thank you for letting us know! Please hold on briefly while our team verifies your payment on our merchant account.';

export const ORDER_ASSURANCE_NOTICE =
  'Thank you! We have received your order request and our team is preparing it for confirmation.';

export const GENERAL_YELLOW_ASSURANCE_NOTICE =
  'Thank you for reaching out! A member of our team is reviewing your inquiry and will confirm with you shortly.';

export const HUMAN_HANDOFF_NOTICE =
  'Understood! I am notifying our store team right now. A representative will attend to you shortly.';

/**
 * Classifies an AI interaction into Green, Yellow, or Red action safety tiers.
 *
 * - Green: Factual grounded Q&A with high confidence (>= 0.85). Dispatched immediately to customer.
 * - Yellow: Actions with commercial or financial weight (payments, draft orders, low stock, medium confidence).
 *   Placed in the merchant approval queue while dispatching an immediate customer assurance notice.
 * - Red: Explicit customer requests for a human agent, disputes, complaints, or low confidence (< 0.50).
 *   Halts automated messaging, sends human handoff notice, and records an urgent exception.
 */
export function classifyActionSafety(
  params: ClassifyActionSafetyParams
): ActionSafetyClassification {
  const confidence = typeof params.confidence === 'number' && !isNaN(params.confidence) ? params.confidence : 0;
  const intent = (params.intent || '').toLowerCase().trim();
  const escalationReason = params.escalation_reason || null;
  const requiresHumanApproval = Boolean(params.requires_human_approval);

  // 1. Red Tier: Explicit human escalation, complaints/disputes, or low confidence
  const isExplicitHumanRequest =
    intent === 'human_agent' ||
    Boolean(escalationReason?.toLowerCase().includes('human')) ||
    Boolean(escalationReason?.toLowerCase().includes('dispute')) ||
    Boolean(escalationReason?.toLowerCase().includes('complaint'));

  const isLowConfidence = confidence < 0.50;

  if (isExplicitHumanRequest || isLowConfidence) {
    return {
      tier: 'red',
      actionType: 'human_handoff',
      autoDispatch: false,
      requiresHumanApproval: true,
      customerAssuranceNotice: HUMAN_HANDOFF_NOTICE,
      escalationReason:
        escalationReason || (isLowConfidence ? `Low AI confidence (${(confidence * 100).toFixed(0)}%)` : 'Human agent requested'),
    };
  }

  // 2. Yellow Tier: Payment claims, draft order proposals, or medium confidence / human approval flags
  const isPaymentAction =
    intent === 'confirm_payment' ||
    intent === 'payment' ||
    Boolean(escalationReason?.toLowerCase().includes('payment'));

  const isOrderAction =
    intent === 'draft_order' ||
    intent === 'create_order' ||
    Boolean(escalationReason?.toLowerCase().includes('order draft'));

  const isMediumConfidence = confidence >= 0.50 && confidence < 0.85;

  if (isPaymentAction || isOrderAction || requiresHumanApproval || isMediumConfidence) {
    let actionType: ActionType = 'reply';
    let assuranceNotice = GENERAL_YELLOW_ASSURANCE_NOTICE;

    if (isPaymentAction) {
      actionType = 'confirm_payment';
      assuranceNotice = PAYMENT_ASSURANCE_NOTICE;
    } else if (isOrderAction) {
      actionType = 'draft_order';
      assuranceNotice = ORDER_ASSURANCE_NOTICE;
    }

    return {
      tier: 'yellow',
      actionType,
      autoDispatch: false,
      requiresHumanApproval: true,
      customerAssuranceNotice: assuranceNotice,
      escalationReason:
        escalationReason ||
        (isPaymentAction
          ? 'Payment claim requires merchant verification'
          : isOrderAction
          ? 'Order creation requires merchant approval'
          : `Medium AI confidence (${(confidence * 100).toFixed(0)}%)`),
    };
  }

  // 3. Green Tier: High-confidence grounded replies
  return {
    tier: 'green',
    actionType: 'reply',
    autoDispatch: true,
    requiresHumanApproval: false,
    customerAssuranceNotice: undefined,
    escalationReason: null,
  };
}
