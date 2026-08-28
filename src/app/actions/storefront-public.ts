'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { StorefrontConfig, StorefrontPublicData, StoreOrderPayload } from '@/types/storefront';
import { generateStoreSlug } from '@/utils/storefront';

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Failed to process storefront order';
}

export async function getPublicStorefrontBySlug(slug: string): Promise<StorefrontPublicData | null> {
  const supabase = await createClient();

  try {
    let config: StorefrontConfig | null = null;

    // 1. Try looking up in storefront_settings
    try {
      const { data: sfData, error } = await supabase.from('storefront_settings').select('*').eq('slug', slug).single();

      if (!error && sfData) {
        config = sfData as StorefrontConfig;
      }
    } catch {
      // Table may not exist yet
    }

    // 2. Fallback: lookup by tenant name match
    if (!config) {
      const { data: allTenants } = await supabase.from('tenants').select('id, name');
      const matchingTenant = allTenants?.find((t) => generateStoreSlug(t.name) === slug);
      if (matchingTenant) {
        config = {
          tenant_id: matchingTenant.id,
          store_name: matchingTenant.name,
          slug,
          tagline: 'Online Catalog',
          bio: null,
          logo_url: null,
          banner_url: null,
          whatsapp_phone: null,
          instagram_handle: null,
          tiktok_handle: null,
          delivery_policy: 'Contact merchant for delivery terms',
          is_active: true,
          currency: 'GHS',
        };
      }
    }

    if (!config || !config.is_active) return null;

    const tenantId = config.tenant_id;

    // Fetch categories and published products in parallel
    const [categoriesRes, productsRes] = await Promise.all([
      supabase.from('categories').select('id, name').eq('tenant_id', tenantId).order('name'),
      supabase
        .from('products')
        .select(
          `
          id, name, description, category_id,
          categories(name),
          product_images(image_url, is_primary),
          product_variants(id, sku, title, price, cost_price, inventory(stock_level))
        `
        )
        .eq('tenant_id', tenantId)
        .order('name'),
    ]);

    const rawCategories = categoriesRes.data || [];
    const rawProducts = productsRes.data || [];

    const products = rawProducts.map((p) => {
      const primaryImg =
        p.product_images?.find((img) => img.is_primary)?.image_url || p.product_images?.[0]?.image_url || null;
      const variants = (p.product_variants || []).map((v) => {
        const stock = v.inventory?.reduce((sum, inv) => sum + (Number(inv.stock_level) || 0), 0) ?? 10;
        return {
          id: v.id,
          sku: v.sku,
          title: v.title || 'Standard',
          price: Number(v.price) || 0,
          cost_price: Number(v.cost_price) || 0,
          stock_quantity: stock,
          is_available: stock > 0,
        };
      });

      const prices = variants.map((v) => v.price);
      const min_price = prices.length > 0 ? Math.min(...prices) : 0;
      const max_price = prices.length > 0 ? Math.max(...prices) : 0;
      const total_stock = variants.reduce((sum, v) => sum + v.stock_quantity, 0);

      const categoryName = Array.isArray(p.categories)
        ? p.categories[0]?.name || 'General'
        : (p.categories as { name?: string } | null)?.name || 'General';

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        category_id: p.category_id,
        category_name: categoryName,
        image_url: primaryImg,
        is_featured: ((config?.featured_product_ids as string[]) || []).includes(p.id),
        min_price,
        max_price,
        total_stock,
        variants,
      };
    });

    const categories = rawCategories.map((c) => ({
      id: c.id,
      name: c.name,
      product_count: products.filter((p) => p.category_id === c.id).length,
    }));

    return {
      config,
      categories,
      products,
    };
  } catch (err) {
    console.error('Error fetching public storefront:', err);
    return null;
  }
}

export async function submitPublicStoreOrder(payload: StoreOrderPayload) {
  const supabase = await createClient();

  try {
    const { tenantId, customerName, customerPhone, deliveryAddress, paymentMethod, items } = payload;
    if (!items || items.length === 0) return { error: 'Cart is empty' };

    // 1. Find or create customer
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone', customerPhone)
      .single();

    let customerId = existingCustomer?.id;
    if (!customerId) {
      const { data: newCust, error: custErr } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
          name: customerName,
          phone: customerPhone,
        })
        .select('id')
        .single();
      if (custErr) throw custErr;
      customerId = newCust.id;
    }

    const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    // 2. Create order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        total_amount: totalAmount,
        status: 'pending_payment',
        channel: 'storefront',
        payment_method: paymentMethod,
        delivery_address: deliveryAddress,
        notes: payload.deliveryNotes || null,
      })
      .select('id')
      .single();

    if (orderErr) throw orderErr;

    // 3. Insert order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      variant_id: item.variantId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.unitPrice * item.quantity,
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
    if (itemsErr) throw itemsErr;

    revalidatePath('/dashboard/orders');
    return { success: true, orderId: order.id };
  } catch (err: unknown) {
    const message = extractErrorMessage(err);
    return { error: message };
  }
}
