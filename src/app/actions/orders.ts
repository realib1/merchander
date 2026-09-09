'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { extractMomoReference } from '@/utils/momo';
// removed unused decrementInventory

export type OrderStatus = 'draft' | 'pending_payment' | 'paid' | 'dispatched' | 'delivered' | 'cancelled';

/**
 * Transitions an order to a new status.
 * Contains side-effects (e.g., decrementing inventory when marked 'paid').
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ success: boolean; status?: OrderStatus; error?: string }> {
  try {
    const supabase = await createClient();

    // Auth + tenant scoping (IDOR prevention)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!tenantUser) return { success: false, error: 'Tenant not found' };

    // 1. Get current order details - scoped to tenant
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', orderId)
      .eq('tenant_id', tenantUser.tenant_id)
      .single();

    if (fetchError || !order) {
      return { success: false, error: 'Order not found' };
    }

    // 2. Perform the update
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (updateError) {
      return { success: false, error: 'Failed to update order status' };
    }

    // 3. Side effects based on new status
    if (newStatus === 'paid' && order.status !== 'paid') {
      const itemsToDecrement = order.items.map((item: { variant_id: string; quantity: number }) => ({
        variant_id: item.variant_id,
        store_id: order.store_id,
        quantity: item.quantity,
      }));

      try {
        const { error: batchError } = await supabase.rpc('decrement_inventory_batch', {
          p_items: itemsToDecrement,
          p_tenant_id: tenantUser.tenant_id,
        });
        if (batchError) throw batchError;
      } catch (err) {
        console.error(`Failed to batch decrement inventory for order ${orderId}`, err);
      }
    }

    revalidatePath('/dashboard/orders');
    return { success: true, status: newStatus };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}

/**
 * Parses an incoming SMS message to reconcile a MoMo payment.
 */
export async function processMoMoPayment(
  orderId: string,
  smsText: string,
  amountPaid: number = 0,
  provider: string = 'mtn'
): Promise<{ success: boolean; transactionRef?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!tenantUser) return { success: false, error: 'Tenant not found' };
    const tenantId = tenantUser.tenant_id;

    const transactionRef = extractMomoReference(smsText);

    if (!transactionRef) {
      return { success: false, error: 'Could not extract a valid transaction reference from the SMS text.' };
    }

    const providerMap: Record<string, string> = {
      mtn: 'mtn_momo',
      mtn_momo: 'mtn_momo',
      telecel: 'telecel_cash',
      telecel_cash: 'telecel_cash',
      at: 'at_money',
      at_money: 'at_money',
    };
    const resolvedProvider = providerMap[provider] || 'mtn_momo';

    // 1. Record the Payment
    const { error: paymentError } = await supabase.from('payments').insert({
      tenant_id: tenantId,
      order_id: orderId,
      provider: resolvedProvider,
      transaction_ref: transactionRef,
      amount: amountPaid,
      fee: 0,
      net_amount: amountPaid,
      status: 'completed',
    });

    if (paymentError) {
      return { success: false, error: `Failed to record payment: ${paymentError.message}` };
    }

    // 2. Auto-transition order to paid
    await updateOrderStatus(orderId, 'paid');

    revalidatePath('/dashboard/orders');
    return { success: true, transactionRef };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}

export async function getKanbanOrders(status: OrderStatus, offset: number, limit: number = 10, query?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  let queryBuilder = supabase
    .from('orders')
    .select(
      `
      *,
      items:order_items(*, variant:product_variants(*, product:products(name))),
      customer:customers!left(name, phone)
    `
    )
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (query) {
    const cleanQuery = query.replace(/^#+/, '').trim();
    if (cleanQuery) {
      // Basic search for Kanban Load More
      const { data: matchingCustomers } = await supabase
        .from('customers')
        .select('id')
        .or(`name.ilike.%${cleanQuery}%,phone.ilike.%${cleanQuery}%`);
      const customerIds = matchingCustomers?.map((c) => c.id) || [];
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery);

      const filterClauses: string[] = [`short_id.ilike.%${cleanQuery}%`];
      if (isUuid) {
        filterClauses.push(`id.eq.${cleanQuery}`);
      }
      if (customerIds.length > 0) {
        filterClauses.push(`customer_id.in.(${customerIds.join(',')})`);
      }

      queryBuilder = queryBuilder.or(filterClauses.join(','));
    }
  }

  const { data, error } = await queryBuilder.range(offset, offset + limit - 1);
  if (error) {
    console.error('Error fetching kanban orders:', error);
    throw new Error('Failed to fetch more orders');
  }

  return data as unknown[]; // Map to expected Order format on client
}
