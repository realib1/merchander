'use server';

import { createClient } from '@/lib/supabase/server';
import { StorefrontTrackingOrder, OrderProgressStatus, StorefrontTrackingItem } from '@/types/storefront';
import { hashOrderToken } from '@/utils/order-token';
import { normalizeGhanaPhone } from '@/utils/phone';

interface TrackOrderInput {
  tenantSlug: string;
  orderIdOrShortId: string;
  token?: string | null;
  phone?: string | null;
}

interface TrackOrderResult {
  success: boolean;
  order?: StorefrontTrackingOrder;
  error?: string;
}

export interface CustomerOrderLookupResult {
  id: string;
  shortId: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  deliveryAddress: string;
  items: Array<{
    title: string;
    quantity: number;
    unitPrice: number;
  }>;
}

/**
 * Retrieves full order progress details with zero-friction passwordless security (valid token OR matching phone).
 */
export async function getStorefrontOrderTracking({
  tenantSlug,
  orderIdOrShortId,
  token,
  phone,
}: TrackOrderInput): Promise<TrackOrderResult> {
  const supabase = await createClient();

  try {
    if (!orderIdOrShortId || (!token && !phone)) {
      return {
        success: false,
        error: 'Tracking token or customer phone number is required to track this order.',
      };
    }

    // 1. Resolve tenant
    const { data: sfSettings } = await supabase
      .from('storefront_settings')
      .select('tenant_id, store_name, currency')
      .eq('slug', tenantSlug)
      .maybeSingle();

    let tenantId = sfSettings?.tenant_id;
    const currency = sfSettings?.currency || 'GHS';

    if (!tenantId) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, name')
        .ilike('name', tenantSlug.replace(/-/g, ' '))
        .maybeSingle();
      tenantId = tenant?.id;
    }

    if (!tenantId) {
      return { success: false, error: 'Store not found.' };
    }

    // 2. Lookup order
    const cleanId = orderIdOrShortId.replace(/^#+/, '').trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

    let query = supabase
      .from('orders')
      .select(
        `
        id, short_id, status, total_amount, delivery_address, notes, created_at, updated_at,
        customer_id, batch_id,
        customers (id, name, phone),
        preorder_batches (
          id, name, code, status, opens_at, closes_at, supplier_order_date,
          expected_arrival_start, expected_arrival_end, actual_arrival_date,
          freight_mode, origin_country, cargo_tracking_number, max_capacity, min_moq_target
        ),
        order_items (
          id, variant_id, quantity, unit_price, batch_id,
          product_variants (
            id, name,
            products (id, name, image_urls)
          )
        )
      `
      )
      .eq('tenant_id', tenantId);

    if (isUuid) {
      query = query.eq('id', cleanId);
    } else {
      query = query.ilike('short_id', `%${cleanId}%`);
    }

    const { data: orderData, error: orderErr } = await query.limit(1).maybeSingle();

    if (orderErr || !orderData) {
      return { success: false, error: 'Order not found.' };
    }

    const rawCust = Array.isArray(orderData.customers) ? orderData.customers[0] : orderData.customers;
    const orderCustomer = rawCust as unknown as { id: string; name: string; phone: string } | null;

    // 3. Security Verification: Token OR Phone
    let isAuthorized = false;

    if (token) {
      const tokenHash = hashOrderToken(token);
      const { data: validToken } = await supabase
        .from('order_access_tokens')
        .select('id')
        .eq('order_id', orderData.id)
        .eq('token_hash', tokenHash)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (validToken) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized && phone) {
      const normalizedQueryPhone = normalizeGhanaPhone(phone);
      if (normalizedQueryPhone && orderCustomer?.phone) {
        const normalizedOrderPhone = normalizeGhanaPhone(orderCustomer.phone);
        if (normalizedQueryPhone === normalizedOrderPhone) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return {
        success: false,
        error: 'Invalid order tracking credentials. Please verify your token or phone number.',
      };
    }

    // 4. Map items
    type RawOrderItem = {
      id: string;
      variant_id: string;
      quantity: number;
      unit_price: number;
      product_variants: {
        id: string;
        name: string | null;
        products: {
          id: string;
          name: string;
          image_urls: string[] | null;
        } | null;
      } | null;
    };

    const rawItems = (orderData.order_items || []) as unknown as RawOrderItem[];

    const items: StorefrontTrackingItem[] = rawItems.map((item) => {
      const p = item.product_variants?.products;
      const primaryImg = Array.isArray(p?.image_urls) && p.image_urls.length > 0 ? p.image_urls[0] : null;

      return {
        id: item.id,
        variantId: item.variant_id,
        productName: p?.name || 'Product',
        variantTitle: item.product_variants?.name || 'Standard',
        quantity: item.quantity,
        unitPrice: Number(item.unit_price) || 0,
        totalPrice: (Number(item.unit_price) || 0) * (Number(item.quantity) || 1),
        imageUrl: primaryImg,
      };
    });

    // 5. Look up shipments / waybill if available
    let waybill: StorefrontTrackingOrder['waybill'] = null;
    try {
      const { data: shipment } = await supabase
        .from('shipments')
        .select('tracking_number, carrier, estimated_delivery')
        .eq('tenant_id', tenantId)
        .limit(1)
        .maybeSingle();

      if (shipment) {
        waybill = {
          trackingNumber: shipment.tracking_number,
          courierName: shipment.carrier,
          estimatedDelivery: shipment.estimated_delivery || undefined,
        };
      }
    } catch {
      // Shipments table may not be joined to this order yet
    }

    const resultOrder: StorefrontTrackingOrder = {
      id: orderData.id,
      shortId: orderData.short_id || orderData.id.substring(0, 8).toUpperCase(),
      status: orderData.status as OrderProgressStatus,
      totalAmount: Number(orderData.total_amount) || 0,
      currency,
      deliveryAddress: orderData.delivery_address || 'Customer Pickup / Delivery',
      notes: orderData.notes || null,
      createdAt: orderData.created_at,
      updatedAt: orderData.updated_at,
      customerName: orderCustomer?.name || 'Customer',
      customerPhone: orderCustomer?.phone || '',
      batch: (orderData.preorder_batches as unknown as import('@/types/preorder').PreorderBatch) || null,
      items,
      waybill,
    };

    return {
      success: true,
      order: resultOrder,
    };
  } catch (err: unknown) {
    console.error('getStorefrontOrderTracking error:', err);
    return { success: false, error: 'Failed to retrieve order tracking information' };
  }
}

/**
 * Backward compatibility helper for simple order lookup by Order ID or phone query.
 */
export async function lookupCustomerOrder(
  tenantId: string,
  query: string
): Promise<{ order?: CustomerOrderLookupResult; error?: string }> {
  const supabase = await createClient();

  try {
    const cleanQuery = query.replace(/^#+/, '').trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery);
    const normalizedPhone = normalizeGhanaPhone(cleanQuery);

    let queryBuilder = supabase
      .from('orders')
      .select(
        `
        id, short_id, status, total_amount, delivery_address, created_at,
        customers (phone),
        order_items (
          quantity, unit_price,
          product_variants (name, products (name))
        )
      `
      )
      .eq('tenant_id', tenantId);

    if (isUuid) {
      queryBuilder = queryBuilder.eq('id', cleanQuery);
    } else if (normalizedPhone || /^(\+?233|0)[0-9]{8,10}$/.test(cleanQuery.replace(/[\s-]/g, ''))) {
      const rawDigits = cleanQuery.replace(/[^0-9]/g, '');
      const searchPhones = [cleanQuery];
      if (normalizedPhone) searchPhones.push(normalizedPhone);
      if (rawDigits.length >= 9) searchPhones.push(rawDigits.slice(-9)); // Match last 9 digits

      const { data: custs } = await supabase
        .from('customers')
        .select('id')
        .eq('tenant_id', tenantId)
        .or(searchPhones.map((p) => `phone.ilike.%${p}%`).join(','));

      const customerIds = custs?.map((c) => c.id) || [];
      if (customerIds.length === 0) return { error: 'No orders found matching this phone number.' };
      queryBuilder = queryBuilder.in('customer_id', customerIds).order('created_at', { ascending: false }).limit(1);
    } else {
      queryBuilder = queryBuilder.ilike('short_id', `%${cleanQuery}%`).order('created_at', { ascending: false });
    }

    const { data, error } = await queryBuilder.limit(1).maybeSingle();
    if (error || !data) return { error: 'Order not found. Please verify your order number or phone.' };

    type LookupItem = {
      quantity: number;
      unit_price: number;
      product_variants: {
        name: string | null;
        products: { name: string } | null;
      } | null;
    };

    const items = ((data.order_items || []) as unknown as LookupItem[]).map((it) => ({
      title: `${it.product_variants?.products?.name || 'Item'}${it.product_variants?.name ? ` (${it.product_variants.name})` : ''}`,
      quantity: it.quantity,
      unitPrice: Number(it.unit_price) || 0,
    }));

    const shortId = data.short_id || data.id.substring(0, 8).toUpperCase();

    return {
      order: {
        id: data.id,
        shortId,
        orderNumber: shortId,
        status: data.status,
        totalAmount: Number(data.total_amount) || 0,
        currency: 'GHS',
        createdAt: data.created_at,
        deliveryAddress: data.delivery_address || 'Standard Delivery',
        items,
      },
    };
  } catch (err) {
    console.error('lookupCustomerOrder error:', err);
    return { error: 'Failed to look up order' };
  }
}
