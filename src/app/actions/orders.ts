'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { extractMomoReference } from '@/utils/momo';
import { decrementInventory } from './products';

export type OrderStatus = 'draft' | 'pending_payment' | 'paid' | 'dispatched' | 'delivered' | 'cancelled';

/**
 * Transitions an order to a new status.
 * Contains side-effects (e.g., decrementing inventory when marked 'paid').
 */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  const supabase = await createClient();

  // Auth + tenant scoping (IDOR prevention)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantUser) throw new Error('Tenant not found');

  // 1. Get current order details — scoped to tenant
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', orderId)
    .eq('tenant_id', tenantUser.tenant_id)
    .single();


  if (fetchError || !order) {
    throw new Error('Order not found');
  }

  // 2. Perform the update
  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (updateError) {
    throw new Error('Failed to update order status');
  }

  // 3. Side effects based on new status
  if (newStatus === 'paid' && order.status !== 'paid') {
    // If moving to paid, decrement inventory for all items
    // (Assuming store_id is on the order)
    for (const item of order.items) {
      try {
        await decrementInventory(item.variant_id, order.store_id, item.quantity);
      } catch (err) {
        console.error(`Failed to decrement inventory for item ${item.id}`, err);
        // Note: In a production robust system, this should be a single database transaction.
        // We rely on the decrement_inventory RPC which is safe, but we're looping it here.
      }
    }
  }

  revalidatePath('/dashboard/orders');
  return { success: true, status: newStatus };
}

/**
 * Parses an incoming SMS message to reconcile a MoMo payment.
 */
export async function processMoMoPayment(orderId: string, smsText: string, amountPaid: number, provider: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantUser) throw new Error('Tenant not found');
  const tenantId = tenantUser.tenant_id;

  const transactionRef = extractMomoReference(smsText);

  if (!transactionRef) {
    throw new Error('Could not extract a valid transaction reference from the SMS text.');
  }

  // 1. Record the Payment
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      tenant_id: tenantId,
      order_id: orderId,
      provider: provider,
      transaction_ref: transactionRef,
      amount: amountPaid,
      status: 'completed'
    });

  if (paymentError) {
    // Unique constraint on (tenant_id, transaction_ref) prevents double processing
    throw new Error(`Failed to record payment: ${paymentError.message}`);
  }

  // 2. Auto-transition order to paid
  await updateOrderStatus(orderId, 'paid');

  revalidatePath('/dashboard/orders');
  return { success: true, transactionRef };
}
