'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { AIActionRecord, ActionTier, ActionStatus } from '@/types/actions';
import { sendOutboundWhatsAppMessage } from '@/lib/channels/whatsapp/service';
import { revalidatePath } from 'next/cache';

export interface GetApprovalsFilter {
  tier?: ActionTier;
  status?: ActionStatus;
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

    if (filters?.status) {
      query = query.eq('status', filters.status);
    } else {
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

    // 3. Mark action as executed in the queue
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
      .select('id, status')
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

    revalidatePath('/dashboard/conversations');
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Approvals Action] Reject action failed:', errorMsg);
    return { success: false, error: errorMsg };
  }
}
