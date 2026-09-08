'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { AIActionRecord, ActionTier, ActionStatus, ApprovalsQueueMetrics } from '@/types/actions';
import { sendOutboundWhatsAppMessage } from '@/lib/channels/whatsapp/service';
import { revalidatePath } from 'next/cache';

export interface GetApprovalsFilter {
  tier?: ActionTier;
  status?: ActionStatus | 'all';
  limit?: number;
}

/**
 * Retrieves actions from the ai_action_queue for the current tenant.
 */
export async function getPendingApprovals(
  filters?: GetApprovalsFilter
): Promise<AIActionRecord[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    let query = supabase
      .from('ai_action_queue')
      .select(`
        *,
        channel_identity:channel_identities(channel, channel_handle, profile_name),
        customer:customers(id, name, phone)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (filters?.tier) {
      query = query.eq('tier', filters.tier);
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    } else if (!filters?.status) {
      query = query.eq('status', 'pending');
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(50);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Approvals Action] Failed to fetch queue:', error);
      return [];
    }

    return (data || []) as unknown as AIActionRecord[];
  } catch (err) {
    console.error('[Approvals Action] Error fetching approvals:', err);
    return [];
  }
}

/**
 * Approves a queued AI action, dispatches the outbound message via the originating channel,
 * and marks the action status as 'executed'.
 */
export async function approveAction(
  actionId: string,
  editedPayload?: { reply_text?: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    // 1. Fetch action and verify ownership
    const { data: action, error: fetchErr } = await supabase
      .from('ai_action_queue')
      .select(`
        *,
        channel_identity:channel_identities(id, channel, channel_handle)
      `)
      .eq('id', actionId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchErr || !action) {
      return { success: false, error: 'Action not found or unauthorized' };
    }

    if (action.status !== 'pending') {
      return { success: false, error: `Action is already ${action.status}` };
    }

    const proposed = (action.proposed_payload as Record<string, unknown>) || {};
    const textToSend = editedPayload?.reply_text || (proposed.reply_text as string) || '';
    const toHandle =
      (proposed.to as string) ||
      (proposed.customer_phone as string) ||
      action.channel_identity?.channel_handle;

    if (!textToSend) {
      return { success: false, error: 'No message text available to send' };
    }

    // 2. Dispatch outbound message on the originating channel
    if (action.channel_identity?.channel === 'whatsapp' && toHandle) {
      await sendOutboundWhatsAppMessage({
        supabase,
        tenantId,
        channelIdentityId: action.channel_identity_id,
        to: toHandle,
        messageType: 'text',
        text: textToSend,
        metadata: {
          action_id: action.id,
          action_type: action.action_type,
          tier: action.tier,
          approved_by: user.id,
          was_edited: Boolean(editedPayload?.reply_text),
        },
      });
    }

    // 3. If this is a draft_order action, transition the draft order to pending_payment
    const orderId = proposed.order_id as string | undefined;
    if (action.action_type === 'draft_order' && orderId) {
      const { error: orderStatusErr } = await supabase
        .from('orders')
        .update({
          status: 'pending_payment',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('tenant_id', tenantId);

      if (orderStatusErr) {
        console.warn(
          '[Approvals Action] Failed to transition draft order to pending_payment:',
          orderStatusErr
        );
      } else {
        revalidatePath('/dashboard/orders');
      }
    }

    // 3b. If this is a proactive_outreach action, handle side-effects (waitlist status, batch notifications)
    if (action.action_type === 'proactive_outreach') {
      const triggerType = proposed.trigger_type as string | undefined;
      const variantId = proposed.variant_id as string | undefined;
      const batchId = proposed.batch_id as string | undefined;

      // Update waitlist entry to notified
      if (triggerType === 'back_in_stock' && variantId) {
        const phone = (proposed.customer_phone as string) || (proposed.to as string);
        if (phone) {
          await supabase
            .from('product_waitlist')
            .update({ status: 'notified' })
            .eq('tenant_id', tenantId)
            .eq('variant_id', variantId)
            .eq('phone', phone)
            .eq('status', 'waiting');
        }
      }

      // Record in preorder_batch_notifications
      if (triggerType === 'batch_milestone' && batchId) {
        await supabase.from('preorder_batch_notifications').insert({
          tenant_id: tenantId,
          batch_id: batchId,
          milestone: (proposed.milestone as string) || 'IN_TRANSIT',
          channel: 'whatsapp',
          recipient_count: 1,
          message_template: textToSend,
          status: 'sent',
          sent_by: user.id,
        });
      }
    }

    // 4. Mark action as executed in the queue
    const updatedPayload = editedPayload?.reply_text
      ? { ...proposed, reply_text: editedPayload.reply_text, edited_by_merchant: true }
      : proposed;

    const { error: updateErr } = await supabase
      .from('ai_action_queue')
      .update({
        status: 'executed',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        proposed_payload: updatedPayload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', actionId)
      .eq('tenant_id', tenantId);

    if (updateErr) {
      console.error('[Approvals Action] Failed to update action status:', updateErr);
      return { success: false, error: 'Failed to update action status' };
    }

    revalidatePath('/dashboard/conversations');
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Approvals Action] Approve action failed:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Rejects a queued AI action and records an optional rejection reason.
 */
export async function rejectAction(
  actionId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    const { data: action, error: fetchErr } = await supabase
      .from('ai_action_queue')
      .select('id, status, action_type, proposed_payload')
      .eq('id', actionId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchErr || !action) {
      return { success: false, error: 'Action not found or unauthorized' };
    }

    if (action.status !== 'pending') {
      return { success: false, error: `Action is already ${action.status}` };
    }

    const { error: updateErr } = await supabase
      .from('ai_action_queue')
      .update({
        status: 'rejected',
        rejection_reason: reason || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', actionId)
      .eq('tenant_id', tenantId);

    if (updateErr) {
      console.error('[Approvals Action] Failed to reject action:', updateErr);
      return { success: false, error: 'Failed to update action status' };
    }

    // If this is a draft_order action, transition the draft order to cancelled
    const proposed = (action.proposed_payload as Record<string, unknown>) || {};
    const orderId = proposed.order_id as string | undefined;
    if (action.action_type === 'draft_order' && orderId) {
      const { error: orderStatusErr } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('tenant_id', tenantId);

      if (orderStatusErr) {
        console.warn(
          '[Approvals Action] Failed to transition draft order to cancelled:',
          orderStatusErr
        );
      } else {
        revalidatePath('/dashboard/orders');
      }
    }

    revalidatePath('/dashboard/conversations');
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Approvals Action] Reject action failed:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Computes queue KPI metrics for the current tenant.
 */
export async function getApprovalsQueueMetrics(): Promise<ApprovalsQueueMetrics> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      pendingYellowCount: 0,
      urgentRedCount: 0,
      executedTodayCount: 0,
      avgConfidencePct: 0,
    };
  }

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { data: actions, error } = await supabase
      .from('ai_action_queue')
      .select('tier, status, confidence, updated_at')
      .eq('tenant_id', tenantId);

    if (error || !actions) {
      console.error('[Approvals Action] Failed to fetch metrics:', error);
      return {
        pendingYellowCount: 0,
        urgentRedCount: 0,
        executedTodayCount: 0,
        avgConfidencePct: 0,
      };
    }

    let pendingYellowCount = 0;
    let urgentRedCount = 0;
    let executedTodayCount = 0;
    let pendingConfidenceSum = 0;
    let pendingCount = 0;

    for (const act of actions) {
      if (act.status === 'pending') {
        if (act.tier === 'yellow') pendingYellowCount++;
        if (act.tier === 'red') urgentRedCount++;
        pendingConfidenceSum += Number(act.confidence) || 0;
        pendingCount++;
      }
      if (act.status === 'executed' && act.updated_at && new Date(act.updated_at) >= startOfToday) {
        executedTodayCount++;
      }
    }

    const avgConfidencePct =
      pendingCount > 0 ? Math.round((pendingConfidenceSum / pendingCount) * 100) : 100;

    return {
      pendingYellowCount,
      urgentRedCount,
      executedTodayCount,
      avgConfidencePct,
    };
  } catch (err) {
    console.error('[Approvals Action] Error fetching metrics:', err);
    return {
      pendingYellowCount: 0,
      urgentRedCount: 0,
      executedTodayCount: 0,
      avgConfidencePct: 0,
    };
  }
}

/**
 * Resolves a Red tier urgent exception after merchant manual takeover.
 */
export async function resolveRedException(
  actionId: string,
  resolutionNote?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    const { data: action, error: fetchErr } = await supabase
      .from('ai_action_queue')
      .select('id, tier, status, proposed_payload')
      .eq('id', actionId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchErr || !action) {
      return { success: false, error: 'Action not found or unauthorized' };
    }

    if (action.status !== 'pending') {
      return { success: false, error: `Action is already ${action.status}` };
    }

    const proposed = (action.proposed_payload as Record<string, unknown>) || {};
    const updatedPayload = {
      ...proposed,
      resolution_note: resolutionNote || 'Resolved via merchant WhatsApp takeover',
      resolved_via_takeover: true,
    };

    const { error: updateErr } = await supabase
      .from('ai_action_queue')
      .update({
        status: 'executed',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        proposed_payload: updatedPayload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', actionId)
      .eq('tenant_id', tenantId);

    if (updateErr) {
      console.error('[Approvals Action] Failed to resolve red exception:', updateErr);
      return { success: false, error: 'Failed to update action status' };
    }

    revalidatePath('/dashboard/conversations');
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Approvals Action] Resolve red exception failed:', errorMsg);
    return { success: false, error: errorMsg };
  }
}
