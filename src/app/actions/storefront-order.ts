'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { StoreOrderPayload, StoreOrderResponse } from '@/types/storefront';
import { normalizeGhanaPhone } from '@/utils/phone';
import { generateOrderAccessToken, hashOrderToken, buildStorefrontTrackingUrl } from '@/utils/order-token';

const orderPayloadSchema = z.object({
  tenantSlug: z.string().min(1, 'Store identifier is required'),
  customerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  customerPhone: z.string().min(8, 'Phone number is too short').max(20),
  customerEmail: z.string().email().optional().or(z.literal('')),
  deliveryAddress: z.string().min(1, 'Address is required').max(300),
  deliveryNotes: z.string().max(500).optional().or(z.literal('')),
  fulfillmentMode: z.enum(['delivery', 'pickup']).optional(),
  pickupStoreId: z.string().uuid().optional(),
  paymentMethod: z.enum(['whatsapp', 'mtn_momo', 'telecel_cash', 'cash_on_delivery', 'card']),
  batchId: z.string().uuid().optional().nullable(),
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().positive('Quantity must be greater than 0'),
        batchId: z.string().uuid().optional().nullable(),
      })
    )
    .min(1, 'Cart cannot be empty'),
});

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  if (err instanceof Error) return err.message;
  return 'Failed to process order';
}

/**
 * Places a public storefront order with progressive identity resolution and cryptographic tracking token.
 */
export async function submitStorefrontOrder(payload: StoreOrderPayload): Promise<StoreOrderResponse> {
  const supabase = createAdminClient();

  try {
    const validation = orderPayloadSchema.safeParse(payload);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0].message };
    }

    const val = validation.data;

    // 1. Normalize Ghana phone number
    const normalizedPhone = normalizeGhanaPhone(val.customerPhone);
    if (!normalizedPhone) {
      return {
        success: false,
        error: 'Please enter a valid Ghana phone number (e.g. 024 123 4567 or +233 24 123 4567)',
      };
    }

    // 1a. Resolve the tenant from the storefront slug. The browser must never
    // choose which workspace an order lands in.
    const { data: storefront } = await supabase
      .from('storefront_settings')
      .select('tenant_id')
      .eq('slug', val.tenantSlug)
      .maybeSingle();

    const tenantId = storefront?.tenant_id;
    if (!tenantId) {
      return { success: false, error: 'Store not found.' };
    }

    // 1b. Price the order from the catalogue. Variants are fetched scoped to the
    // resolved tenant, so a variant id from another store resolves to nothing.
    const variantIds = Array.from(new Set(val.items.map((item) => item.variantId)));
    const { data: variantRows, error: variantErr } = await supabase
      .from('product_variants')
      .select('id, price, products!inner(tenant_id)')
      .in('id', variantIds)
      .eq('products.tenant_id', tenantId);

    if (variantErr) {
      console.error('Error loading variants for storefront order:', variantErr);
      return { success: false, error: 'Could not price this order. Please try again.' };
    }

    const priceByVariant = new Map<string, number>(
      (variantRows || []).map((row) => [row.id as string, Number(row.price) || 0])
    );

    const unpriced = variantIds.filter((id) => !priceByVariant.has(id));
    if (unpriced.length > 0) {
      return { success: false, error: 'One or more items are no longer available in this store.' };
    }

    const pricedItems = val.items.map((item) => ({
      ...item,
      unitPrice: priceByVariant.get(item.variantId) as number,
    }));

    // 2. Upsert customer in customers table (scoped to tenant)
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, short_id')
      .eq('tenant_id', tenantId)
      .eq('phone', normalizedPhone)
      .maybeSingle();

    let customerId = existingCustomer?.id;
    if (!customerId) {
      const { data: newCustomer, error: custErr } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
          name: val.customerName.trim(),
          phone: normalizedPhone,
          email: val.customerEmail || null,
        })
        .select('id, short_id')
        .single();

      if (custErr) {
        console.error('Error creating customer:', custErr);
        throw custErr;
      }
      customerId = newCustomer.id;
    }

    // 3. Upsert identity into customer_identities
    try {
      await supabase.from('customer_identities').upsert(
        {
          tenant_id: tenantId,
          customer_id: customerId,
          channel: 'storefront',
          identifier: normalizedPhone,
          profile_data: {
            name: val.customerName.trim(),
            last_delivery_address: val.deliveryAddress.trim(),
          },
          is_verified: false,
        },
        { onConflict: 'tenant_id,channel,identifier' }
      );
    } catch (identityErr) {
      console.warn('customer_identities upsert non-critical warning:', identityErr);
    }

    // 4. Resolve branch store for the tenant
    let storeId: string | null = val.pickupStoreId || null;
    if (!storeId) {
      const { data: primaryStore } = await supabase
        .from('stores')
        .select('id')
        .eq('tenant_id', tenantId)
        .order('is_primary', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (primaryStore) {
        storeId = primaryStore.id;
      } else {
        const { data: createdStore } = await supabase
          .from('stores')
          .insert({
            tenant_id: tenantId,
            name: 'Main Store',
            is_primary: true,
          })
          .select('id')
          .single();
        storeId = createdStore?.id || null;
      }
    }

    const totalAmount = pricedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    // 5. Create Order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenantId,
        store_id: storeId,
        customer_id: customerId,
        batch_id: val.batchId || null,
        total_amount: totalAmount,
        status: val.paymentMethod === 'cash_on_delivery' ? 'pending_payment' : 'draft',
        sales_channel: 'storefront',
        payment_method: val.paymentMethod,
        delivery_address: val.deliveryAddress.trim(),
        notes: val.deliveryNotes?.trim() || null,
        fulfillment_mode: val.fulfillmentMode || 'delivery',
      })
      .select('id, short_id')
      .single();

    if (orderErr) {
      console.error('Error inserting order:', orderErr);
      throw orderErr;
    }

    // 6. Insert Order Items
    const orderItems = pricedItems.map((item) => ({
      order_id: order.id,
      variant_id: item.variantId,
      batch_id: item.batchId || val.batchId || null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
    if (itemsErr) {
      console.error('Error inserting order items:', itemsErr);
      throw itemsErr;
    }

    // 7. Generate and record cryptographic order access token
    const rawToken = generateOrderAccessToken();
    const tokenHash = hashOrderToken(rawToken);

    try {
      await supabase.from('order_access_tokens').insert({
        tenant_id: tenantId,
        order_id: order.id,
        token_hash: tokenHash,
      });
    } catch (tokenErr) {
      console.warn('order_access_tokens insert warning:', tokenErr);
    }

    const slug = val.tenantSlug;
    const trackingUrl = buildStorefrontTrackingUrl(
      '',
      slug,
      order.short_id || order.id.slice(0, 8).toUpperCase(),
      rawToken
    );

    revalidatePath('/dashboard/orders');
    revalidatePath(`/store/${slug}`);

    return {
      success: true,
      orderId: order.id,
      orderShortId: order.short_id || undefined,
      trackingToken: rawToken,
      trackingUrl,
    };
  } catch (err: unknown) {
    console.error('submitStorefrontOrder error:', err);
    return {
      success: false,
      error: extractErrorMessage(err),
    };
  }
}
