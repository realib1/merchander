'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { normalizeGhanaPhone } from '@/utils/phone';

import { z } from 'zod';

const createOrderSchema = z.object({
  customerName: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  storeId: z.string().uuid("Invalid store ID"),
  deliveryAddress: z.string().optional(),
  deliveryFee: z.number().min(0).default(0),
  paymentMethod: z.enum(['momo', 'card_payment', 'cash_payment', 'cash_on_delivery']),
  items: z.array(z.object({
    variantId: z.string().uuid("Invalid variant ID"),
    quantity: z.number().int().positive("Quantity must be positive"),
    unitPrice: z.number().positive("Unit price must be positive")
  })).min(1, "Order must contain at least one item")
});

export async function createOrderAction(formData: FormData) {
  let parsedItems = [];
  try {
    const itemsJson = formData.get('items') as string;
    if (itemsJson) {
      parsedItems = JSON.parse(itemsJson);
    }
  } catch (_e) {
    return { error: 'Invalid items format' };
  }

  const rawData = {
    customerName: formData.get('customerName'),
    customerPhone: formData.get('customerPhone'),
    storeId: formData.get('storeId'),
    deliveryAddress: formData.get('deliveryAddress'),
    deliveryFee: parseFloat(formData.get('deliveryFee') as string) || 0,
    paymentMethod: formData.get('paymentMethod'),
    items: parsedItems
  };

  const validation = createOrderSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const data = validation.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantUser) return { error: 'Tenant not found' };
  const tenantId = tenantUser.tenant_id;

  // 1. Normalize phone and upsert customer
  // If no phone provided, use a default walk-in phone to satisfy DB constraints
  const rawPhone = data.customerPhone && data.customerPhone.trim() !== '' ? data.customerPhone : '0000000000';
  const rawName = data.customerName && data.customerName.trim() !== '' ? data.customerName : 'Walk-in Customer';
  const normalizedPhone = normalizeGhanaPhone(rawPhone) || rawPhone; // Fallback to raw if parsing fails
  
  // Find existing customer
  let customerId = '';
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('phone', normalizedPhone)
    .single();

  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const { data: newCustomer, error: custError } = await supabase
      .from('customers')
      .insert({
        tenant_id: tenantId,
        name: rawName,
        phone: normalizedPhone
      })
      .select('id')
      .single();
      
    if (custError || !newCustomer) return { error: 'Failed to create customer' };
    customerId = newCustomer.id;
  }

  // 2. Calculate Total
  const itemsTotal = data.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const totalAmount = itemsTotal + data.deliveryFee;

  const actionType = formData.get('action') as string;
  const initialStatus = actionType === 'draft' ? 'draft' : 'pending_payment';

  // 3. Insert Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      tenant_id: tenantId,
      store_id: data.storeId,
      customer_id: customerId,
      status: initialStatus,
      total_amount: totalAmount,
      delivery_address: data.deliveryAddress,
      delivery_fee: data.deliveryFee
    })
    .select('id')
    .single();

  if (orderError || !order) return { error: 'Failed to create order' };

  // 4. Insert Order Items
  const orderItemsInsert = data.items.map(item => ({
    order_id: order.id,
    variant_id: item.variantId,
    quantity: item.quantity,
    unit_price: item.unitPrice
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsInsert);

  if (itemsError) return { error: 'Failed to add items to order' };

  // 5. Insert Payment Record
  if (data.paymentMethod) {
    const paymentStatus = (data.paymentMethod === 'cash_payment' || data.paymentMethod === 'card_payment') ? 'completed' : 'pending';
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        tenant_id: tenantId,
        order_id: order.id,
        provider: data.paymentMethod,
        amount: totalAmount,
        status: paymentStatus
      });
    if (paymentError) return { error: 'Failed to create payment record' };
  }

  revalidatePath('/dashboard/orders');
  redirect('/dashboard/orders');
}
