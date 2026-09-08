import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Json } from '@/types/supabase';
import { ActionTier } from '@/types/actions';
import {
  OutreachTriggerType,
  isGhanaQuietHours,
  evaluateFrequencyCap,
  formatPaymentReminderMessage,
  formatBatchMilestoneMessage,
  formatBackInStockMessage,
  formatDeliveryUpdateMessage,
  classifyOutreachSafety,
} from '@/utils/outreach';
import { normalizeGhanaPhone } from '@/utils/phone';
import { sendOutboundWhatsAppMessage } from '@/lib/channels/whatsapp/service';

export interface OutreachEvaluationRequest {
  tenantId: string;
  triggerType: OutreachTriggerType;
  // Identity identifiers
  customerId?: string | null;
  customerPhone?: string | null;
  customerName?: string | null;
  channelIdentityId?: string | null;
  // Trigger context
  orderId?: string;
  orderNumber?: string;
  totalAmount?: number;
  currency?: string;
  itemsSummary?: string;
  paymentInstructions?: string;
  batchId?: string;
  batchName?: string;
  milestone?: string;
  expectedArrival?: string;
  trackingUrl?: string;
  variantId?: string;
  productName?: string;
  variantName?: string;
  price?: number;
  storeUrl?: string;
  deliveryStatus?: string;
  deliveryAddress?: string;
  storeName?: string;
  isBulk?: boolean;
  hasUnresolvedIssue?: boolean;
  confidence?: number;
  // Flags for test / simulation
  forceBypassQuietHours?: boolean;
}

export interface OutreachEvaluationResult {
  success: boolean;
  status: 'dispatched' | 'queued' | 'suppressed' | 'skipped' | 'failed';
  tier?: ActionTier;
  actionId?: string;
  messageText?: string;
  reason?: string;
  nextAllowedAt?: Date;
}

/**
 * Core runtime evaluator for proactive customer outreach.
 * Enforces quiet hours, resolves WhatsApp channel identities, validates frequency caps,
 * applies Green / Yellow / Red action safety, and routes to either auto-dispatch or merchant queue.
 */
export async function evaluateAndProcessOutreach({
  supabase,
  request,
}: {
  supabase: SupabaseClient<Database>;
  request: OutreachEvaluationRequest;
}): Promise<OutreachEvaluationResult> {
  const { tenantId, triggerType } = request;

  // 1. Enforce Ghana quiet hours (unless explicitly bypassed by operator/simulation)
  if (!request.forceBypassQuietHours && isGhanaQuietHours()) {
    return {
      success: true,
      status: 'suppressed',
      reason: 'Suppressed by Ghana quiet hours policy (21:00 - 08:00 UTC).',
    };
  }

  // 2. Resolve WhatsApp channel identity
  let channelIdentityId = request.channelIdentityId || null;
  let channelHandle = request.customerPhone || null;
  let resolvedCustomerId = request.customerId || null;
  let profileName = request.customerName || null;

  if (channelIdentityId) {
    const { data: identity } = await supabase
      .from('channel_identities')
      .select('id, channel, channel_handle, customer_id, profile_name')
      .eq('id', channelIdentityId)
      .eq('tenant_id', tenantId)
      .single();

    if (identity) {
      channelHandle = identity.channel_handle;
      resolvedCustomerId = identity.customer_id || resolvedCustomerId;
      profileName = identity.profile_name || profileName;
    }
  } else if (channelHandle) {
    const normalized = normalizeGhanaPhone(channelHandle) || channelHandle;
    const { data: identity } = await supabase
      .from('channel_identities')
      .select('id, channel, channel_handle, customer_id, profile_name')
      .eq('tenant_id', tenantId)
      .eq('channel', 'whatsapp')
      .or(`channel_handle.eq.${normalized},channel_handle.eq.${channelHandle}`)
      .order('last_seen_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (identity) {
      channelIdentityId = identity.id;
      channelHandle = identity.channel_handle;
      resolvedCustomerId = identity.customer_id || resolvedCustomerId;
      profileName = identity.profile_name || profileName;
    }
  }

  if (!channelIdentityId || !channelHandle) {
    return {
      success: false,
      status: 'skipped',
      reason: 'No active WhatsApp channel identity found for customer.',
    };
  }

  // 3. Check for existing pending action in ai_action_queue (idempotency / deduplication)
  let existingActionQuery = supabase
    .from('ai_action_queue')
    .select('id, proposed_payload')
    .eq('tenant_id', tenantId)
    .eq('channel_identity_id', channelIdentityId)
    .eq('action_type', 'proactive_outreach')
    .eq('status', 'pending');

  if (request.orderId) {
    existingActionQuery = existingActionQuery.contains('proposed_payload', { order_id: request.orderId });
  } else if (request.batchId) {
    existingActionQuery = existingActionQuery.contains('proposed_payload', { batch_id: request.batchId });
  } else if (request.variantId) {
    existingActionQuery = existingActionQuery.contains('proposed_payload', { variant_id: request.variantId });
  }

  const { data: existingActions } = await existingActionQuery.limit(1);
  if (existingActions && existingActions.length > 0) {
    return {
      success: true,
      status: 'skipped',
      reason: 'A pending proactive outreach action for this context already exists in the queue.',
      actionId: existingActions[0].id,
    };
  }

  // 4. Frequency cap & cooldown checks
  const oneDayAgoIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('created_at')
    .eq('tenant_id', tenantId)
    .eq('channel_identity_id', channelIdentityId)
    .eq('direction', 'outbound')
    .gte('created_at', oneDayAgoIso)
    .order('created_at', { ascending: false });

  const messagesSentInLast24h = recentMessages?.length || 0;
  const lastContactedAt = recentMessages && recentMessages.length > 0 ? recentMessages[0].created_at : null;

  // Count prior reminders for this specific order if payment_reminder
  let totalRemindersSent = 0;
  if (request.orderId && triggerType === 'payment_reminder') {
    const { count } = await supabase
      .from('ai_action_queue')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('channel_identity_id', channelIdentityId)
      .eq('action_type', 'proactive_outreach')
      .contains('proposed_payload', { trigger_type: 'payment_reminder', order_id: request.orderId })
      .eq('status', 'executed');

    totalRemindersSent = count || 0;
  }

  const capResult = evaluateFrequencyCap({
    lastContactedAt,
    messagesSentInLast24h,
    totalRemindersSent,
  });

  if (!capResult.allowed) {
    return {
      success: true,
      status: 'suppressed',
      reason: capResult.reason,
      nextAllowedAt: capResult.nextAllowedAt,
    };
  }

  // 5. Generate formatted copy and grounded facts
  let messageText = '';
  const groundedFacts: string[] = [];
  const customerDisplayName = profileName || request.customerName || 'Customer';

  switch (triggerType) {
    case 'payment_reminder': {
      messageText = formatPaymentReminderMessage({
        customerName: customerDisplayName,
        orderNumber: request.orderNumber || 'N/A',
        totalAmount: request.totalAmount || 0,
        currency: request.currency || 'GHS',
        itemsSummary: request.itemsSummary,
        paymentInstructions: request.paymentInstructions,
        storeName: request.storeName,
      });
      groundedFacts.push(
        `Order #${request.orderNumber || 'N/A'} is pending payment for ${request.currency || 'GHS'} ${(request.totalAmount || 0).toFixed(2)}.`,
        `Customer: ${customerDisplayName} (${channelHandle}).`,
        `Reminder #${totalRemindersSent + 1} of 3.`
      );
      break;
    }
    case 'batch_milestone': {
      messageText = formatBatchMilestoneMessage({
        customerName: customerDisplayName,
        batchName: request.batchName || 'Pre-Order Batch',
        milestone: request.milestone || 'IN_TRANSIT',
        expectedArrival: request.expectedArrival,
        trackingUrl: request.trackingUrl,
        storeName: request.storeName,
      });
      groundedFacts.push(
        `Pre-order batch "${request.batchName || 'Pre-Order Batch'}" progressed to milestone ${request.milestone || 'IN_TRANSIT'}.`,
        `Recipient: ${customerDisplayName} (${channelHandle}).`
      );
      break;
    }
    case 'back_in_stock': {
      messageText = formatBackInStockMessage({
        customerName: customerDisplayName,
        productName: request.productName || 'Product',
        variantName: request.variantName,
        price: request.price,
        currency: request.currency,
        storeUrl: request.storeUrl,
        storeName: request.storeName,
      });
      groundedFacts.push(
        `Product "${request.productName || 'Product'}"${request.variantName ? ` (${request.variantName})` : ''} has been replenished.`,
        `Customer on waitlist: ${customerDisplayName} (${channelHandle}).`
      );
      break;
    }
    case 'delivery_update': {
      messageText = formatDeliveryUpdateMessage({
        customerName: customerDisplayName,
        orderNumber: request.orderNumber || 'N/A',
        deliveryStatus: request.deliveryStatus || 'shipped',
        address: request.deliveryAddress,
        trackingUrl: request.trackingUrl,
        storeName: request.storeName,
      });
      groundedFacts.push(
        `Order #${request.orderNumber || 'N/A'} fulfillment status updated to ${request.deliveryStatus || 'shipped'}.`,
        `Recipient: ${customerDisplayName} (${channelHandle}).`
      );
      break;
    }
  }

  // 6. Classify Action Safety
  const safety = classifyOutreachSafety({
    triggerType,
    isBulk: Boolean(request.isBulk),
    hasUnresolvedIssue: Boolean(request.hasUnresolvedIssue),
    totalAmount: request.totalAmount,
    confidence: request.confidence ?? 0.95,
  });

  if (safety.tier === 'red') {
    return {
      success: true,
      status: 'suppressed',
      tier: 'red',
      reason: safety.escalationReason || 'Blocked by Red tier action safety check.',
    };
  }

  // 7. Green Tier: Immediate Outbound Dispatch
  if (safety.tier === 'green') {
    try {
      await sendOutboundWhatsAppMessage({
        supabase,
        tenantId,
        channelIdentityId,
        to: channelHandle,
        messageType: 'text',
        text: messageText,
        metadata: {
          trigger_type: triggerType,
          order_id: request.orderId,
          batch_id: request.batchId,
          variant_id: request.variantId,
          auto_dispatched: true,
        },
      });

      return {
        success: true,
        status: 'dispatched',
        tier: 'green',
        messageText,
      };
    } catch (sendErr) {
      console.error('[Outreach Intelligence] Green auto-dispatch failed, falling back to Yellow queue:', sendErr);
      // Fallback to queuing if direct dispatch fails
    }
  }

  // 8. Yellow Tier: Insert into ai_action_queue
  const proposedPayload: Record<string, unknown> = {
    trigger_type: triggerType,
    reply_text: messageText,
    to: channelHandle,
    customer_name: customerDisplayName,
    customer_phone: channelHandle,
    order_id: request.orderId,
    order_number: request.orderNumber,
    total_amount: request.totalAmount,
    currency: request.currency || 'GHS',
    batch_id: request.batchId,
    batch_name: request.batchName,
    milestone: request.milestone,
    variant_id: request.variantId,
    product_name: request.productName,
    variant_name: request.variantName,
    delivery_status: request.deliveryStatus,
    tracking_url: request.trackingUrl,
  };

  const { data: queuedAction, error: queueErr } = await supabase
    .from('ai_action_queue')
    .insert({
      tenant_id: tenantId,
      channel_identity_id: channelIdentityId,
      customer_id: resolvedCustomerId,
      action_type: 'proactive_outreach',
      tier: 'yellow',
      status: 'pending',
      proposed_payload: proposedPayload as unknown as Json,
      grounded_facts: groundedFacts as unknown as Json,
      confidence: request.confidence ?? 0.9,
      escalation_reason: safety.escalationReason || 'Proactive outreach requires merchant review',
    })
    .select('id')
    .single();

  if (queueErr) {
    console.error('[Outreach Intelligence] Failed to enqueue action:', queueErr);
    return {
      success: false,
      status: 'failed',
      reason: queueErr.message,
    };
  }

  return {
    success: true,
    status: 'queued',
    tier: 'yellow',
    actionId: queuedAction?.id,
    messageText,
    reason: safety.escalationReason || undefined,
  };
}
