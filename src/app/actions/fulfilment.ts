'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { normalizeGhanaPhone } from '@/utils/phone';
import { AssignRiderPayload, MarkDeliveredPayload } from '@/types/fulfilment';
import { resolveChannelIdentity } from '@/lib/channels/identity';
import { sendOutboundWhatsAppMessage } from '@/lib/channels/whatsapp/service';

export interface FulfilmentActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Assigns a rider / courier to an order and marks it as 'dispatched'.
 * Also sends an automated WhatsApp dispatch notification to the customer if phone is available.
 */
export async function assignOrderRiderAction(
  payload: AssignRiderPayload
): Promise<FulfilmentActionResult<{ orderId: string; status: string; dispatchedAt: string }>> {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // 2. Tenant check
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .single();

    if (!tenantUser) return { success: false, error: 'Tenant not found' };
    const tenantId = payload.tenantId || tenantUser.tenant_id;

    // 3. Fetch order with customer & store info
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, customer:customers(id, name, phone), store:stores(name)')
      .eq('id', payload.orderId)
      .eq('tenant_id', tenantId)
      .single();

    if (orderErr || !order) {
      return { success: false, error: 'Order not found' };
    }

    const normalizedRiderPhone = payload.riderPhone ? normalizeGhanaPhone(payload.riderPhone) : null;
    const dispatchedAt = new Date().toISOString();
    const fulfillmentMode = payload.fulfillmentMode || order.fulfillment_mode || 'delivery';

    // 4. Update order with dispatch & rider information
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        fulfillment_mode: fulfillmentMode,
        rider_name: payload.riderName?.trim() || null,
        rider_phone: normalizedRiderPhone || payload.riderPhone?.trim() || null,
        courier_name: payload.courierName?.trim() || null,
        tracking_number: payload.trackingNumber?.trim() || null,
        dispatch_notes: payload.dispatchNotes?.trim() || null,
        pickup_store_id: payload.pickupStoreId || null,
        delivery_zone_id: payload.deliveryZoneId || null,
        delivery_zone_name: payload.deliveryZoneName || null,
        status: 'dispatched',
        dispatched_at: dispatchedAt,
        updated_at: dispatchedAt,
      })
      .eq('id', payload.orderId)
      .eq('tenant_id', tenantId);

    if (updateErr) {
      return { success: false, error: 'Failed to assign rider and dispatch order' };
    }

    // 5. Automated Customer Notification (Fire and forget, swallowed on failure)
    try {
      const rawCustomer = order.customer as unknown as { id?: string; name?: string | null; phone?: string | null } | null;
      const rawStore = order.store as unknown as { name?: string | null } | null;
      const customerPhone = rawCustomer?.phone ? normalizeGhanaPhone(rawCustomer.phone) : null;
      const storeName = rawStore?.name || 'our store';
      const orderRef = order.short_id || order.id.slice(0, 8).toUpperCase();

      if (customerPhone) {
        let dispatchNotice = '';
        if (fulfillmentMode === 'pickup') {
          dispatchNotice = `Hello ${rawCustomer?.name || 'there'}! 📦\n\nYour order *#${orderRef}* from *${storeName}* is packed and ready for pickup!\n\nPlease visit the branch to collect your package.\nThank you! 🙏`;
        } else {
          const riderContact = payload.riderName
            ? `Rider: *${payload.riderName}*${payload.riderPhone ? ` (${payload.riderPhone})` : ''}`
            : payload.courierName
              ? `Courier: *${payload.courierName}*`
              : 'Our delivery team';

          dispatchNotice = `Hello ${rawCustomer?.name || 'there'}! 🛵\n\nGreat news! Your order *#${orderRef}* from *${storeName}* has been dispatched and is on its way to you!\n\n${riderContact}\n${payload.dispatchNotes ? `Note: ${payload.dispatchNotes}\n` : ''}\nPlease keep your phone nearby for delivery. Thank you! 🙏`;
        }

        const identity = await resolveChannelIdentity(supabase, tenantId, 'whatsapp', customerPhone, rawCustomer?.id);
        if (identity) {
          await sendOutboundWhatsAppMessage({
            supabase,
            tenantId,
            channelIdentityId: identity.id,
            to: customerPhone,
            messageType: 'text',
            text: dispatchNotice,
            metadata: {
              action_type: 'order_dispatch_notice',
              order_id: order.id,
              fulfillment_mode: fulfillmentMode,
              rider_name: payload.riderName || null,
            },
          });
        }
      }
    } catch (notifyErr) {
      console.warn('[Fulfilment] Outbound customer dispatch notification failed (non-blocking):', notifyErr);
    }

    revalidatePath('/dashboard/orders');
    revalidatePath(`/dashboard/orders/${payload.orderId}`);

    return {
      success: true,
      data: {
        orderId: payload.orderId,
        status: 'dispatched',
        dispatchedAt,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error assigning rider';
    return { success: false, error: message };
  }
}

/**
 * Marks an order as 'delivered' with delivered_at timestamp and customer delivery confirmation.
 */
export async function markOrderDeliveredAction(
  payload: MarkDeliveredPayload
): Promise<FulfilmentActionResult<{ orderId: string; status: string; deliveredAt: string }>> {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // 2. Tenant check
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .single();

    if (!tenantUser) return { success: false, error: 'Tenant not found' };
    const tenantId = payload.tenantId || tenantUser.tenant_id;

    // 3. Fetch current order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, customer:customers(id, name, phone), store:stores(name)')
      .eq('id', payload.orderId)
      .eq('tenant_id', tenantId)
      .single();

    if (orderErr || !order) {
      return { success: false, error: 'Order not found' };
    }

    const deliveredAt = new Date().toISOString();

    // 4. Update status to delivered
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status: 'delivered',
        delivered_at: deliveredAt,
        updated_at: deliveredAt,
      })
      .eq('id', payload.orderId)
      .eq('tenant_id', tenantId);

    if (updateErr) {
      return { success: false, error: 'Failed to mark order as delivered' };
    }

    // 5. Automated Customer Completion Notice (Fire and forget)
    try {
      const rawCustomer = order.customer as unknown as { id?: string; name?: string | null; phone?: string | null } | null;
      const rawStore = order.store as unknown as { name?: string | null } | null;
      const customerPhone = rawCustomer?.phone ? normalizeGhanaPhone(rawCustomer.phone) : null;
      const storeName = rawStore?.name || 'our store';
      const orderRef = order.short_id || order.id.slice(0, 8).toUpperCase();

      if (customerPhone) {
        const deliveredNotice = `Hello ${rawCustomer?.name || 'there'}! 🎉\n\nYour order *#${orderRef}* from *${storeName}* has been marked as delivered / collected!\n\nWe hope you love your purchase. If you have any questions or feedback, simply reply to this message.\n\nThank you for shopping with us! ✨`;

        const identity = await resolveChannelIdentity(supabase, tenantId, 'whatsapp', customerPhone, rawCustomer?.id);
        if (identity) {
          await sendOutboundWhatsAppMessage({
            supabase,
            tenantId,
            channelIdentityId: identity.id,
            to: customerPhone,
            messageType: 'text',
            text: deliveredNotice,
            metadata: {
              action_type: 'order_delivered_notice',
              order_id: order.id,
            },
          });
        }
      }
    } catch (notifyErr) {
      console.warn('[Fulfilment] Outbound delivery completion notification failed (non-blocking):', notifyErr);
    }

    revalidatePath('/dashboard/orders');
    revalidatePath(`/dashboard/orders/${payload.orderId}`);

    return {
      success: true,
      data: {
        orderId: payload.orderId,
        status: 'delivered',
        deliveredAt,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error marking order delivered';
    return { success: false, error: message };
  }
}
