import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { normalizeGhanaPhone } from '@/utils/phone';
import {
  calculateOrderTotals,
  formatOrderConfirmationMessage,
  formatOrderAssuranceNotice,
  buildGroundedOrderFacts,
  MatchedVariantData,
  ValidatedOrderItem,
} from '@/utils/orderCapture';

export interface CartExtractionItem {
  sku: string;
  quantity: number;
}

export interface CaptureOrderParams {
  supabase: SupabaseClient<Database>;
  tenantId: string;
  channelIdentityId?: string;
  customerId?: string | null;
  customerPhone: string;
  customerName?: string | null;
  items: CartExtractionItem[];
  deliveryFee?: number;
  deliveryAddress?: string | null;
}

export interface CapturedOrderSuccess {
  success: true;
  orderId: string;
  orderNumber: string;
  customerId: string;
  items: ValidatedOrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  currency: string;
  groundedFacts: string[];
  hasStockDeficit: boolean;
  warnings: string[];
  proposedReplyText: string;
  customerAssuranceNotice: string;
}

export interface CapturedOrderFailure {
  success: false;
  reason: 'no_items' | 'no_store' | 'no_matching_variants' | 'order_creation_failed';
  error: string;
  unmatchedSkus?: string[];
}

export type CapturedOrderResult = CapturedOrderSuccess | CapturedOrderFailure;

/**
 * Validates extracted cart items against live catalog variants and inventory in Supabase,
 * resolves the primary store and customer record, and creates a draft order with line items.
 */
export async function captureDraftOrderFromCart(
  params: CaptureOrderParams
): Promise<CapturedOrderResult> {
  const { supabase, tenantId } = params;

  // 1. Basic validation
  if (!params.items || params.items.length === 0) {
    return {
      success: false,
      reason: 'no_items',
      error: 'No items provided in extracted cart',
    };
  }

  // 2. Resolve primary store for the tenant
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('is_primary', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (storeError || !store) {
    return {
      success: false,
      reason: 'no_store',
      error: 'No active store found for tenant to capture order',
    };
  }

  // 3. Query matching product variants
  const requestedSkus = params.items.map((i) => i.sku.trim());
  const { data: variants, error: varError } = await supabase
    .from('product_variants')
    .select(`
      id,
      sku,
      name,
      price,
      product:products!inner(
        id,
        name,
        tenant_id,
        availability_status
      ),
      inventory_levels(quantity, store_id)
    `)
    .eq('product.tenant_id', tenantId)
    .in('sku', requestedSkus);

  if (varError) {
    console.error('[Order Capture] Variant query error:', varError);
    return {
      success: false,
      reason: 'order_creation_failed',
      error: `Failed to query product variants: ${varError.message}`,
    };
  }

  const variantList = (variants || []) as unknown as Array<{
    id: string;
    sku: string;
    name: string | null;
    price: number;
    product: {
      id: string;
      name: string;
      tenant_id: string;
      availability_status?: string | null;
    };
    inventory_levels?: Array<{ quantity: number; store_id: string }>;
  }>;

  // Build lookup by SKU (uppercase)
  const variantMap = new Map<string, typeof variantList[0]>();
  for (const v of variantList) {
    variantMap.set(v.sku.toUpperCase(), v);
  }

  // Match items and gather quantities
  const matchedForCalculation: Array<{ variant: MatchedVariantData; quantity: number }> = [];
  const unmatchedSkus: string[] = [];

  for (const item of params.items) {
    const skuKey = item.sku.trim().toUpperCase();
    const matched = variantMap.get(skuKey);

    if (!matched) {
      unmatchedSkus.push(item.sku);
      continue;
    }

    // Calculate available stock at the primary store (or sum all stores if store_id not matched)
    const storeLevels = matched.inventory_levels || [];
    const primaryLevel = storeLevels.find((lvl) => lvl.store_id === store.id);
    const availableStock = primaryLevel
      ? primaryLevel.quantity
      : storeLevels.reduce((acc, lvl) => acc + (lvl.quantity || 0), 0);

    const isPreorder =
      matched.product.availability_status?.toLowerCase() === 'pre_order' ||
      matched.product.availability_status?.toLowerCase() === 'preorder';

    matchedForCalculation.push({
      variant: {
        id: matched.id,
        sku: matched.sku,
        name: matched.name || 'Default',
        productName: matched.product.name,
        price: Number(matched.price),
        availableStock,
        isPreorder,
      },
      quantity: item.quantity,
    });
  }

  if (matchedForCalculation.length === 0) {
    return {
      success: false,
      reason: 'no_matching_variants',
      error: 'None of the extracted items matched real catalog variants',
      unmatchedSkus,
    };
  }

  // 4. Calculate totals and stock warnings
  const calculation = calculateOrderTotals(matchedForCalculation, params.deliveryFee || 0);

  // 5. Ensure customer record exists
  let finalCustomerId = params.customerId;
  const rawPhone = params.customerPhone && params.customerPhone.trim() !== '' ? params.customerPhone : '0000000000';
  const cleanPhone = normalizeGhanaPhone(rawPhone) || rawPhone;

  if (!finalCustomerId) {
    const { data: existingCust } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (existingCust) {
      finalCustomerId = existingCust.id;
    } else {
      const { data: newCust, error: newCustErr } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
          name: params.customerName || 'WhatsApp Customer',
          phone: cleanPhone,
        })
        .select('id')
        .single();

      if (newCustErr || !newCust) {
        console.error('[Order Capture] Failed to create customer:', newCustErr);
        return {
          success: false,
          reason: 'order_creation_failed',
          error: 'Failed to create customer record for order',
        };
      }
      finalCustomerId = newCust.id;
    }

    if (finalCustomerId && params.channelIdentityId) {
      await supabase
        .from('channel_identities')
        .update({ customer_id: finalCustomerId })
        .eq('id', params.channelIdentityId);
    }
  }

  // 6. Insert row in orders table with status = 'draft'
  const { data: order, error: orderInsertErr } = await supabase
    .from('orders')
    .insert({
      tenant_id: tenantId,
      store_id: store.id,
      customer_id: finalCustomerId,
      status: 'draft',
      total_amount: calculation.totalAmount,
      delivery_address: params.deliveryAddress || null,
      delivery_fee: calculation.deliveryFee,
      sales_channel: 'whatsapp',
      attribution_source: 'whatsapp',
    })
    .select('id, short_id')
    .single();

  if (orderInsertErr || !order) {
    console.error('[Order Capture] Failed to insert draft order:', orderInsertErr);
    return {
      success: false,
      reason: 'order_creation_failed',
      error: `Failed to insert draft order: ${orderInsertErr?.message}`,
    };
  }

  // 7. Insert line items into order_items table
  const orderItemsData = calculation.items.map((item) => ({
    order_id: order.id,
    variant_id: item.variantId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
  }));

  const { error: itemsInsertErr } = await supabase.from('order_items').insert(orderItemsData);

  if (itemsInsertErr) {
    console.error('[Order Capture] Failed to insert order items:', itemsInsertErr);
    // Cleanup draft order if items failed
    await supabase.from('orders').delete().eq('id', order.id);
    return {
      success: false,
      reason: 'order_creation_failed',
      error: `Failed to insert order items: ${itemsInsertErr.message}`,
    };
  }

  // 8. Build confirmation copy and grounded facts
  const orderNumber = (order as { short_id?: string }).short_id || `ORD-${order.id.slice(0, 6).toUpperCase()}`;

  const proposedReplyText = formatOrderConfirmationMessage({
    customerName: params.customerName,
    orderNumber,
    items: calculation.items,
    totalAmount: calculation.totalAmount,
    deliveryFee: calculation.deliveryFee,
    currency: 'GHS',
  });

  const groundedFacts = buildGroundedOrderFacts(calculation.items, store.name);
  groundedFacts.unshift(`Draft Order #${orderNumber} created at ${store.name}`);

  const customerAssuranceNotice = formatOrderAssuranceNotice();

  return {
    success: true,
    orderId: order.id,
    orderNumber,
    customerId: finalCustomerId,
    items: calculation.items,
    subtotal: calculation.subtotal,
    deliveryFee: calculation.deliveryFee,
    totalAmount: calculation.totalAmount,
    currency: 'GHS',
    groundedFacts,
    hasStockDeficit: calculation.hasStockDeficit,
    warnings: calculation.warnings,
    proposedReplyText,
    customerAssuranceNotice,
  };
}
