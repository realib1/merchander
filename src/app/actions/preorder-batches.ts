'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import {
  PreorderBatch,
  PreorderBatchFormData,
  PreorderBatchStatus,
  BatchProcurementSummary,
  BatchBroadcastRecipient,
  BatchConsolidatedItem,
} from '@/types/preorder';
import { revalidatePath } from 'next/cache';

/**
 * Fetches all preorder batches for the current authenticated merchant tenant
 */
export async function getTenantPreorderBatches(customTenantId?: string): Promise<PreorderBatch[]> {
  const supabase = await createClient();
  let tenantId = customTenantId;

  if (!tenantId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    const info = await getTenantInfo(supabase, user.id);
    tenantId = info.tenantId;
  }

  if (!tenantId) return [];

  try {
    const { data: batches, error } = await supabase
      .from('preorder_batches')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('opens_at', { ascending: false });

    if (error || !batches) {
      if (error && error.code !== 'PGRST116') {
        console.warn('Preorder batches not initialized or empty:', error.message || error);
      }
      return [];
    }

    const { data: mappings } = await supabase
      .from('product_preorder_batches')
      .select('batch_id, product_id')
      .eq('tenant_id', tenantId);

    const mappingByBatch: Record<string, string[]> = {};
    (mappings || []).forEach((m) => {
      if (!mappingByBatch[m.batch_id]) {
        mappingByBatch[m.batch_id] = [];
      }
      mappingByBatch[m.batch_id].push(m.product_id);
    });

    return batches.map((b) => {
      const assignedIds = mappingByBatch[b.id] || [];
      return {
        ...b,
        product_count: assignedIds.length,
        assigned_product_ids: assignedIds,
      };
    });
  } catch (err) {
    console.warn('Failed to load preorder batches:', err);
    return [];
  }
}

/**
 * Creates a new preorder procurement batch
 */
export async function createPreorderBatch(formData: PreorderBatchFormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { tenantId, role } = await getTenantInfo(supabase, user.id);
  if (role !== 'owner' && role !== 'admin') return { error: 'Insufficient permissions' };

  try {
    const { data: batch, error } = await supabase
      .from('preorder_batches')
      .insert({
        tenant_id: tenantId,
        name: formData.name.trim(),
        code: (formData.code || formData.name).trim().toUpperCase().replace(/\s+/g, '-'),
        status: 'OPEN',
        opens_at: formData.opens_at,
        closes_at: formData.closes_at,
        supplier_order_date: formData.supplier_order_date || null,
        expected_arrival_start: formData.expected_arrival_start,
        expected_arrival_end: formData.expected_arrival_end,
        freight_mode: formData.freight_mode || 'sea',
        origin_country: formData.origin_country || 'China',
        cargo_tracking_number: formData.cargo_tracking_number?.trim() || null,
        max_capacity: formData.max_capacity ? Number(formData.max_capacity) : null,
        min_moq_target: formData.min_moq_target ? Number(formData.min_moq_target) : null,
        notes: formData.notes?.trim() || null,
      })
      .select()
      .single();

    if (error || !batch) throw error;

    // Link initial products if provided
    if (formData.product_ids && formData.product_ids.length > 0) {
      const mappings = formData.product_ids.map((productId) => ({
        tenant_id: tenantId,
        batch_id: batch.id,
        product_id: productId,
        is_active: true,
      }));

      await supabase.from('product_preorder_batches').insert(mappings);
    }

    revalidatePath('/dashboard/inventory/batches');
    revalidatePath('/dashboard/products');
    return { success: true, batchId: batch.id };
  } catch (err) {
    console.error('Error creating preorder batch:', err);
    return { error: err instanceof Error ? err.message : 'Failed to create preorder batch' };
  }
}

/**
 * Updates batch metadata and lifecycle dates
 */
export async function updatePreorderBatch(batchId: string, formData: Partial<PreorderBatchFormData>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { error } = await supabase
      .from('preorder_batches')
      .update({
        name: formData.name?.trim(),
        code: formData.code?.trim().toUpperCase(),
        opens_at: formData.opens_at,
        closes_at: formData.closes_at,
        supplier_order_date: formData.supplier_order_date || null,
        expected_arrival_start: formData.expected_arrival_start,
        expected_arrival_end: formData.expected_arrival_end,
        freight_mode: formData.freight_mode,
        origin_country: formData.origin_country,
        cargo_tracking_number: formData.cargo_tracking_number?.trim() || null,
        max_capacity: formData.max_capacity ? Number(formData.max_capacity) : null,
        min_moq_target: formData.min_moq_target ? Number(formData.min_moq_target) : null,
        notes: formData.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId);

    if (error) throw error;

    if (formData.product_ids !== undefined) {
      await supabase.from('product_preorder_batches').delete().eq('batch_id', batchId);
      if (formData.product_ids.length > 0) {
        const { tenantId } = await getTenantInfo(supabase, user.id);
        const mappings = formData.product_ids.map((productId) => ({
          tenant_id: tenantId,
          batch_id: batchId,
          product_id: productId,
          is_active: true,
        }));
        await supabase.from('product_preorder_batches').insert(mappings);
      }
    }

    revalidatePath('/dashboard/inventory/batches');
    return { success: true };
  } catch (err) {
    console.error('Error updating preorder batch:', err);
    return { error: 'Failed to update batch' };
  }
}

/**
 * Transitions the batch through its procurement lifecycle states
 */
export async function updateBatchLifecycleStatus(
  batchId: string,
  status: PreorderBatchStatus,
  actualArrivalDate?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'ARRIVED' && actualArrivalDate) {
      updatePayload.actual_arrival_date = actualArrivalDate;
    }

    const { error } = await supabase.from('preorder_batches').update(updatePayload).eq('id', batchId);
    if (error) throw error;

    revalidatePath('/dashboard/inventory/batches');
    return { success: true };
  } catch (err) {
    console.error('Error updating batch status:', err);
    return { error: 'Failed to update batch lifecycle status' };
  }
}

/**
 * Calculates consolidated supplier Purchase Order summary grouped by variant
 */
export async function getBatchConsolidatedProcurement(batchId: string): Promise<BatchProcurementSummary | null> {
  const supabase = await createClient();

  const { data: batch } = await supabase.from('preorder_batches').select('*').eq('id', batchId).single();
  if (!batch) return null;

  const { data: orderItems } = await supabase
    .from('order_items')
    .select(
      `
      id,
      quantity,
      unit_price,
      product_variant_id,
      order_id,
      product_variants (
        id,
        title,
        sku,
        cost_price,
        products (
          id,
          name
        )
      )
    `
    )
    .eq('batch_id', batchId);

  const itemMap = new Map<string, BatchConsolidatedItem>();
  const orderSet = new Set<string>();
  let totalUnits = 0;
  let totalEstimatedRevenue = 0;

  if (orderItems) {
    for (const item of orderItems) {
      const variant = item.product_variants as unknown as {
        id: string;
        title: string;
        sku: string | null;
        cost_price: number | null;
        products: { id: string; name: string };
      };
      if (!variant) continue;

      orderSet.add(item.order_id);
      totalUnits += item.quantity;
      totalEstimatedRevenue += Number(item.unit_price) * item.quantity;

      const key = variant.id;
      const existing = itemMap.get(key);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalCustomerAmount += Number(item.unit_price) * item.quantity;
      } else {
        itemMap.set(key, {
          productId: variant.products?.id || '',
          productName: variant.products?.name || 'Product',
          variantId: variant.id,
          variantTitle: variant.title || 'Standard',
          sku: variant.sku,
          totalQuantity: item.quantity,
          costPrice: variant.cost_price,
          unitPrice: Number(item.unit_price),
          totalCustomerAmount: Number(item.unit_price) * item.quantity,
        });
      }
    }
  }

  return {
    batch,
    items: Array.from(itemMap.values()),
    totalOrders: orderSet.size,
    totalUnits,
    totalEstimatedRevenue,
  };
}

/**
 * Fetches customer broadcast recipient list for WhatsApp milestone updates
 */
export async function getBatchCustomerBroadcastList(batchId: string): Promise<BatchBroadcastRecipient[]> {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from('orders')
    .select(
      `
      id,
      customer_name,
      customer_phone,
      order_number,
      tenants (
        slug
      )
    `
    )
    .eq('batch_id', batchId);

  if (!orders) return [];

  return orders.map((o) => {
    const tenantSlug = (o.tenants as unknown as { slug: string })?.slug || 'store';
    const shortId = o.id.slice(0, 6).toUpperCase();
    return {
      orderId: o.id,
      orderShortId: shortId,
      customerName: o.customer_name || 'Customer',
      customerPhone: o.customer_phone || '',
      itemsSummary: `Pre-Order #${shortId}`,
      trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/store/${tenantSlug}/orders/${shortId}`,
    };
  });
}
