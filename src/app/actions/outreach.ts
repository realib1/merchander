'use server';

import { getURL } from '@/utils/url';
import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { evaluateAndProcessOutreach, OutreachEvaluationResult } from '@/lib/intelligence/outreach';

export interface ScanRemindersResult {
  success: boolean;
  scannedCount: number;
  processedCount: number;
  results: OutreachEvaluationResult[];
  error?: string;
}

export interface BroadcastBatchResult {
  success: boolean;
  batchId: string;
  milestone: string;
  recipientCount: number;
  results: OutreachEvaluationResult[];
  error?: string;
}

export interface BackInStockResult {
  success: boolean;
  variantId: string;
  waitlistCount: number;
  results: OutreachEvaluationResult[];
  error?: string;
}

export interface DeliveryUpdateActionResult {
  success: boolean;
  result?: OutreachEvaluationResult;
  error?: string;
}

/**
 * Scans pending payment orders older than minAgeHours (default 24h)
 * and evaluates proactive payment reminders for each.
 */
export async function scanPendingPaymentRemindersAction(params?: {
  minAgeHours?: number;
  forceBypassQuietHours?: boolean;
}): Promise<ScanRemindersResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, scannedCount: 0, processedCount: 0, results: [], error: 'Unauthorized' };
  }

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const minHours = params?.minAgeHours ?? 24;
    const cutoffDate = new Date(Date.now() - minHours * 60 * 60 * 1000).toISOString();

    // Fetch tenant settings for store name
    const { data: tenantSettings } = await supabase
      .from('tenant_settings')
      .select('store_name, store_currency')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const storeName = tenantSettings?.store_name || undefined;
    const storeCurrency = tenantSettings?.store_currency || 'GHS';

    // Query pending payment orders
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, customer_id, customer_name, customer_phone, created_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'pending_payment')
      .lte('created_at', cutoffDate)
      .order('created_at', { ascending: true });

    if (ordersErr) {
      console.error('[Outreach Action] Failed to query pending payment orders:', ordersErr);
      return { success: false, scannedCount: 0, processedCount: 0, results: [], error: ordersErr.message };
    }

    const eligibleOrders = orders || [];
    const results: OutreachEvaluationResult[] = [];

    for (const order of eligibleOrders) {
      const evalRes = await evaluateAndProcessOutreach({
        supabase,
        request: {
          tenantId,
          triggerType: 'payment_reminder',
          orderId: order.id,
          orderNumber: order.order_number || order.id.slice(0, 8),
          totalAmount: Number(order.total_amount) || 0,
          currency: storeCurrency,
          customerId: order.customer_id,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          storeName,
          forceBypassQuietHours: params?.forceBypassQuietHours,
        },
      });
      results.push(evalRes);
    }

    return {
      success: true,
      scannedCount: eligibleOrders.length,
      processedCount: results.filter((r) => r.status === 'dispatched' || r.status === 'queued').length,
      results,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Outreach Action] scanPendingPaymentRemindersAction failed:', msg);
    return { success: false, scannedCount: 0, processedCount: 0, results: [], error: msg };
  }
}

/**
 * Triggers batch milestone announcement outreach to all customers with orders in a pre-order batch.
 */
export async function broadcastBatchMilestoneAction(params: {
  batchId: string;
  milestone: string;
  forceBypassQuietHours?: boolean;
}): Promise<BroadcastBatchResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      batchId: params.batchId,
      milestone: params.milestone,
      recipientCount: 0,
      results: [],
      error: 'Unauthorized',
    };
  }

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    // Fetch batch details
    const { data: batch, error: batchErr } = await supabase
      .from('preorder_batches')
      .select('id, name, code, expected_arrival_start, expected_arrival_end')
      .eq('id', params.batchId)
      .eq('tenant_id', tenantId)
      .single();

    if (batchErr || !batch) {
      return {
        success: false,
        batchId: params.batchId,
        milestone: params.milestone,
        recipientCount: 0,
        results: [],
        error: 'Batch not found',
      };
    }

    const { data: tenantSettings } = await supabase
      .from('tenant_settings')
      .select('store_name, slug')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const storeName = tenantSettings?.store_name || undefined;
    const tenantSlug = tenantSettings?.slug || 'store';
    const appUrl = getURL();

    let expectedArrival: string | undefined;
    if (batch.expected_arrival_start && batch.expected_arrival_end) {
      expectedArrival = `${batch.expected_arrival_start} to ${batch.expected_arrival_end}`;
    }

    // Fetch orders in this batch
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, order_number, customer_id, customer_name, customer_phone')
      .eq('tenant_id', tenantId)
      .eq('batch_id', params.batchId);

    if (ordersErr) {
      return {
        success: false,
        batchId: params.batchId,
        milestone: params.milestone,
        recipientCount: 0,
        results: [],
        error: ordersErr.message,
      };
    }

    const batchOrders = orders || [];
    const results: OutreachEvaluationResult[] = [];

    for (const order of batchOrders) {
      const shortId = (order.order_number || order.id.slice(0, 8)).toUpperCase();
      const trackingUrl = `${appUrl}/store/${tenantSlug}/orders/${shortId}`;

      const res = await evaluateAndProcessOutreach({
        supabase,
        request: {
          tenantId,
          triggerType: 'batch_milestone',
          batchId: batch.id,
          batchName: batch.name,
          milestone: params.milestone,
          expectedArrival,
          trackingUrl,
          orderId: order.id,
          orderNumber: shortId,
          customerId: order.customer_id,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          storeName,
          isBulk: true,
          forceBypassQuietHours: params.forceBypassQuietHours,
        },
      });
      results.push(res);
    }

    return {
      success: true,
      batchId: params.batchId,
      milestone: params.milestone,
      recipientCount: batchOrders.length,
      results,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Outreach Action] broadcastBatchMilestoneAction failed:', msg);
    return {
      success: false,
      batchId: params.batchId,
      milestone: params.milestone,
      recipientCount: 0,
      results: [],
      error: msg,
    };
  }
}

/**
 * Triggers back-in-stock alerts for customers waiting on product_waitlist for a given variant.
 */
export async function notifyBackInStockAction(params: {
  variantId: string;
  forceBypassQuietHours?: boolean;
}): Promise<BackInStockResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      variantId: params.variantId,
      waitlistCount: 0,
      results: [],
      error: 'Unauthorized',
    };
  }

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    // Fetch variant and product
    const { data: variant, error: varErr } = await supabase
      .from('product_variants')
      .select('id, name, price, product:products(id, name)')
      .eq('id', params.variantId)
      .single();

    if (varErr || !variant) {
      return {
        success: false,
        variantId: params.variantId,
        waitlistCount: 0,
        results: [],
        error: 'Product variant not found',
      };
    }

    const { data: tenantSettings } = await supabase
      .from('tenant_settings')
      .select('store_name, store_currency, slug')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const storeName = tenantSettings?.store_name || undefined;
    const storeCurrency = tenantSettings?.store_currency || 'GHS';
    const tenantSlug = tenantSettings?.slug || 'store';
    const appUrl = getURL();
    const productData = variant.product as unknown as { id: string; name: string } | null;
    const productName = productData?.name || 'Item';
    const storeUrl = productData ? `${appUrl}/store/${tenantSlug}/products/${productData.id}` : undefined;

    // Fetch waiting customers
    const { data: waitlist, error: waitlistErr } = await supabase
      .from('product_waitlist')
      .select('id, customer_name, phone, status')
      .eq('tenant_id', tenantId)
      .eq('variant_id', params.variantId)
      .eq('status', 'waiting');

    if (waitlistErr) {
      return {
        success: false,
        variantId: params.variantId,
        waitlistCount: 0,
        results: [],
        error: waitlistErr.message,
      };
    }

    const waitlistEntries = waitlist || [];
    const results: OutreachEvaluationResult[] = [];

    for (const entry of waitlistEntries) {
      const res = await evaluateAndProcessOutreach({
        supabase,
        request: {
          tenantId,
          triggerType: 'back_in_stock',
          variantId: variant.id,
          productName,
          variantName: variant.name,
          price: Number(variant.price),
          currency: storeCurrency,
          storeUrl,
          customerName: entry.customer_name,
          customerPhone: entry.phone,
          storeName,
          forceBypassQuietHours: params.forceBypassQuietHours,
        },
      });

      // If auto-dispatched, immediately transition waitlist status to 'notified'
      if (res.status === 'dispatched') {
        await supabase
          .from('product_waitlist')
          .update({ status: 'notified' })
          .eq('id', entry.id)
          .eq('tenant_id', tenantId);
      }

      results.push(res);
    }

    return {
      success: true,
      variantId: params.variantId,
      waitlistCount: waitlistEntries.length,
      results,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Outreach Action] notifyBackInStockAction failed:', msg);
    return {
      success: false,
      variantId: params.variantId,
      waitlistCount: 0,
      results: [],
      error: msg,
    };
  }
}

/**
 * Sends or queues an automated delivery status update for an order.
 */
export async function sendOrderDeliveryUpdateAction(params: {
  orderId: string;
  deliveryStatus: string;
  forceBypassQuietHours?: boolean;
}): Promise<DeliveryUpdateActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, order_number, customer_id, customer_name, customer_phone, delivery_address')
      .eq('id', params.orderId)
      .eq('tenant_id', tenantId)
      .single();

    if (orderErr || !order) {
      return { success: false, error: 'Order not found' };
    }

    const { data: tenantSettings } = await supabase
      .from('tenant_settings')
      .select('store_name, slug')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const storeName = tenantSettings?.store_name || undefined;
    const tenantSlug = tenantSettings?.slug || 'store';
    const appUrl = getURL();
    const shortId = (order.order_number || order.id.slice(0, 8)).toUpperCase();
    const trackingUrl = `${appUrl}/store/${tenantSlug}/orders/${shortId}`;

    const result = await evaluateAndProcessOutreach({
      supabase,
      request: {
        tenantId,
        triggerType: 'delivery_update',
        orderId: order.id,
        orderNumber: shortId,
        deliveryStatus: params.deliveryStatus,
        deliveryAddress: order.delivery_address || undefined,
        trackingUrl,
        customerId: order.customer_id,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        storeName,
        forceBypassQuietHours: params.forceBypassQuietHours,
      },
    });

    return { success: true, result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Outreach Action] sendOrderDeliveryUpdateAction failed:', msg);
    return { success: false, error: msg };
  }
}
