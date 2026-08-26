'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getPurchaseOrders() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, supplier:suppliers(name, short_id)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching purchase orders:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function createPurchaseOrder(formData: FormData) {
  const supabase = await createClient();

  // Get tenant ID
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { data: null, error: 'Not authenticated' };
  
  const { data: tenantUsers } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', userData.user.id)
    .single();

  if (!tenantUsers) return { data: null, error: 'No tenant found' };

  const supplier_id = formData.get('supplier_id') as string;
  const tracking_number = formData.get('tracking_number') as string;
  const eta = formData.get('eta') as string;
  const supplier_cost = formData.get('supplier_cost') ? parseFloat(formData.get('supplier_cost') as string) : 0;
  const shipping_cost = formData.get('shipping_cost') ? parseFloat(formData.get('shipping_cost') as string) : 0;
  const import_cost = formData.get('import_cost') ? parseFloat(formData.get('import_cost') as string) : 0;

  const { data, error } = await supabase
    .from('purchase_orders')
    .insert([{ 
      tenant_id: tenantUsers.tenant_id,
      supplier_id, 
      tracking_number, 
      eta: eta || null, 
      status: 'draft',
      supplier_cost,
      shipping_cost,
      import_cost
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating purchase order:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/dashboard/purchasing');
  return { data, error: null };
}

export async function updatePurchaseOrder(id: string, formData: FormData) {
  const supabase = await createClient();

  const tracking_number = formData.get('tracking_number') as string;
  const eta = formData.get('eta') as string;
  const supplier_cost = formData.get('supplier_cost') ? parseFloat(formData.get('supplier_cost') as string) : 0;
  const shipping_cost = formData.get('shipping_cost') ? parseFloat(formData.get('shipping_cost') as string) : 0;
  const import_cost = formData.get('import_cost') ? parseFloat(formData.get('import_cost') as string) : 0;
  const status = formData.get('status') as string;

  const updatePayload: {
    tracking_number: string;
    supplier_cost: number;
    shipping_cost: number;
    import_cost: number;
    eta?: string;
    status?: string;
  } = {
    tracking_number,
    supplier_cost,
    shipping_cost,
    import_cost
  };

  if (eta) {
    updatePayload.eta = eta;
  }
  if (status) {
    updatePayload.status = status;
  }

  const { data, error } = await supabase
    .from('purchase_orders')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating purchase order:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/dashboard/purchasing');
  return { data, error: null };
}

export async function receivePurchaseOrder(purchaseOrderId: string, storeId: string) {
  const supabase = await createClient();

  // Fetch PO items
  const { data: items, error: itemsError } = await supabase
    .from('purchase_order_items')
    .select('variant_id, quantity')
    .eq('purchase_order_id', purchaseOrderId);

  if (itemsError) {
    console.error('Error fetching purchase order items:', itemsError);
    return { error: itemsError.message };
  }

  if (!items || items.length === 0) {
    return { error: 'Purchase order has no items to receive.' };
  }

  // Use the RPC to increment inventory
  const { error: rpcError } = await supabase.rpc('increment_inventory_batch', {
    items,
    target_store_id: storeId,
  });

  if (rpcError) {
    console.error('Error incrementing inventory:', rpcError);
    return { error: rpcError.message };
  }

  // Mark PO as received
  const { error: updateError } = await supabase
    .from('purchase_orders')
    .update({ status: 'received' })
    .eq('id', purchaseOrderId);

  if (updateError) {
    console.error('Error updating purchase order status:', updateError);
    return { error: updateError.message };
  }

  revalidatePath('/dashboard/purchasing');
  revalidatePath('/dashboard/inventory');
  return { error: null };
}
