'use server';

import { getURL } from '@/utils/url';
import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import {
  PreorderBatchStatus,
  BatchBroadcastRecipient,
  BatchMilestoneBroadcast,
} from '@/types/preorder';
import { formatBatchMilestoneMessage } from '@/utils/preorder-batch';
import { toWhatsAppMsisdn } from '@/utils/phone';
import { revalidatePath } from 'next/cache';

/**
 * Fetch all customer recipients who ordered in a specific preorder batch
 */
export async function getBatchBroadcastRecipientsAction(
  batchId: string
): Promise<{
  recipients: Array<BatchBroadcastRecipient & { rawPhone: string; whatsappUrl: string }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { recipients: [], error: 'Not authenticated' };
    }

    const { data: batch } = await supabase
      .from('preorder_batches')
      .select('id, name, code, expected_arrival_start, expected_arrival_end')
      .eq('id', batchId)
      .single();

    if (!batch) {
      return { recipients: [], error: 'Batch not found' };
    }

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(
        `
        id,
        order_number,
        customer_name,
        customer_phone,
        total_amount,
        tenants (
          slug
        )
      `
      )
      .eq('batch_id', batchId);

    if (ordersError || !orders) {
      return { recipients: [] };
    }

    const appUrl = getURL();

    const recipients = orders
      .map((o) => {
        const waMsisdn = toWhatsAppMsisdn(o.customer_phone);
        if (!waMsisdn) return null;

        const tenantSlug = (o.tenants as unknown as { slug: string })?.slug || 'store';
        const shortId = (o.order_number || o.id.slice(0, 6)).toUpperCase();
        const trackingUrl = `${appUrl}/store/${tenantSlug}/orders/${shortId}`;

        const baseRecipient: BatchBroadcastRecipient = {
          orderId: o.id,
          orderShortId: shortId,
          customerName: o.customer_name || 'Customer',
          customerPhone: o.customer_phone || '',
          itemsSummary: `Pre-Order #${shortId}`,
          trackingUrl,
        };

        const defaultMsg = formatBatchMilestoneMessage(
          batch as unknown as import('@/types/preorder').PreorderBatch,
          baseRecipient,
          'IN_TRANSIT'
        );

        const whatsappUrl = `https://wa.me/${waMsisdn}?text=${encodeURIComponent(defaultMsg)}`;

        return {
          ...baseRecipient,
          rawPhone: o.customer_phone || '',
          whatsappUrl,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return { recipients };
  } catch (err) {
    console.error('Error in getBatchBroadcastRecipientsAction:', err);
    return {
      recipients: [],
      error: err instanceof Error ? err.message : 'Failed to fetch batch recipients',
    };
  }
}

/**
 * Dispatch or log a milestone broadcast notification to all batch customer recipients
 */
export async function dispatchBatchMilestoneBroadcastAction(params: {
  batchId: string;
  milestone: PreorderBatchStatus;
  channel: 'whatsapp' | 'sms' | 'email';
  customMessageTemplate?: string;
}): Promise<{
  success?: boolean;
  recipientCount?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') {
      return { error: 'Insufficient permissions' };
    }

    const { data: batch } = await supabase
      .from('preorder_batches')
      .select('*')
      .eq('id', params.batchId)
      .single();

    if (!batch) {
      return { error: 'Batch not found' };
    }

    const { recipients, error: recError } = await getBatchBroadcastRecipientsAction(params.batchId);
    if (recError) {
      return { error: recError };
    }

    const template =
      params.customMessageTemplate ||
      formatBatchMilestoneMessage(
        batch,
        {
          orderId: 'ORDER_ID',
          orderShortId: 'SHORT_ID',
          customerName: '{{customer_name}}',
          customerPhone: '{{phone}}',
          itemsSummary: '{{items}}',
          trackingUrl: '{{tracking_link}}',
        },
        params.milestone
      );

    // Insert broadcast log into preorder_batch_notifications
    const { error: logError } = await supabase.from('preorder_batch_notifications').insert({
      tenant_id: tenantId,
      batch_id: params.batchId,
      milestone: params.milestone,
      channel: params.channel,
      recipient_count: recipients.length,
      message_template: template,
      status: 'sent',
      sent_by: user.id,
      created_at: new Date().toISOString(),
    });

    if (logError) {
      console.warn('Could not record in preorder_batch_notifications:', logError.message);
    }

    // Also record merchant notification
    await supabase.from('tenant_notifications').insert({
      tenant_id: tenantId,
      title: `Batch Milestone Notification: ${params.milestone}`,
      message: `Dispatched ${params.milestone} milestone broadcast to ${recipients.length} customer(s) for ${batch.name}.`,
      type: 'system',
      is_read: false,
    });

    revalidatePath('/dashboard/inventory/batches');
    return { success: true, recipientCount: recipients.length };
  } catch (err) {
    console.error('Error dispatching batch broadcast:', err);
    return {
      error: err instanceof Error ? err.message : 'Failed to dispatch milestone notification',
    };
  }
}

/**
 * Fetch past broadcast notification history for a batch
 */
export async function getBatchBroadcastHistoryAction(
  batchId: string
): Promise<{ history: BatchMilestoneBroadcast[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('preorder_batch_notifications')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });

    if (error) {
      return { history: [] };
    }

    return { history: (data || []) as BatchMilestoneBroadcast[] };
  } catch {
    return { history: [] };
  }
}
