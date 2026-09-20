'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { updateFeaturedProductIds as updateFeaturedProductIdsImpl } from './storefront-featured';

export interface StorefrontOverviewData {
  productsCount: number;
  ordersCount: number;
  totalGmv: number;
  currency: string;
  isHubtelConnected: boolean;
  isPaystackConnected: boolean;
  allProducts: Array<{
    id: string;
    name: string;
    description?: string | null;
    price: number;
    comparePrice?: number | null;
    stock: number;
    imageUrl: string | null;
    isFeatured: boolean;
  }>;
  featuredProductIds: string[];
}

/**
 * Fetches live production metrics and catalog data for the Online Store dashboard
 */
export async function getStorefrontOverview(): Promise<StorefrontOverviewData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    const [productsRes, ordersRes, settingsRes, sfRes] = await Promise.all([
      supabase
        .from('products')
        .select(
          `
          id, name, description, image_urls,
          variants:product_variants(id, price, compare_at_price, inventory:inventory_levels(quantity))
        `
        )
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name'),
      supabase.from('orders').select('id, total_amount, status, created_at').eq('tenant_id', tenantId),
      supabase.from('tenant_settings').select('settings_data, store_currency').eq('tenant_id', tenantId).single(),
      supabase.from('storefront_settings').select('featured_product_ids').eq('tenant_id', tenantId).maybeSingle(),
    ]);

    const rawProducts = productsRes.data || [];
    const rawOrders = ordersRes.data || [];
    const customSettings = (settingsRes.data?.settings_data as Record<string, unknown> | null) || {};
    const payments = (customSettings.payment_settings || customSettings.payments) as Record<string, unknown> | undefined;
    const providers = payments?.providers as Record<string, { connected?: boolean }> | undefined;

    const featuredIds: string[] = Array.isArray(sfRes.data?.featured_product_ids)
      ? (sfRes.data?.featured_product_ids as string[])
      : Array.isArray(customSettings.featured_product_ids)
        ? (customSettings.featured_product_ids as string[])
        : [];

    const formattedProducts = rawProducts.map((p) => {
      const primaryImg = Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls[0] : null;
      const variants = Array.isArray(p.variants) ? p.variants : [];
      const minPrice = variants.length > 0 ? Math.min(...variants.map((v) => Number(v.price) || 0)) : 0;
      const comparePrices = variants.map((v) => Number(v.compare_at_price) || 0).filter((cp) => cp > 0);
      const comparePrice = comparePrices.length > 0 ? Math.min(...comparePrices) : null;
      const totalStock = variants.reduce(
        (sum: number, v: { inventory?: Array<{ quantity?: number }> | { quantity?: number } }) => {
          const invArray = Array.isArray(v.inventory) ? v.inventory : v.inventory ? [v.inventory] : [];
          return sum + invArray.reduce((s: number, inv) => s + (Number(inv?.quantity) || 0), 0);
        },
        0
      );

      return {
        id: p.id,
        name: p.name,
        description: (p as { description?: string | null }).description || null,
        price: minPrice,
        comparePrice,
        stock: totalStock,
        imageUrl: primaryImg,
        isFeatured: featuredIds.includes(p.id),
      };
    });

    const totalGmv = rawOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    return {
      productsCount: rawProducts.length,
      ordersCount: rawOrders.length,
      totalGmv,
      currency: settingsRes.data?.store_currency || 'GHS',
      isHubtelConnected: Boolean(providers?.hubtel?.connected),
      isPaystackConnected: Boolean(providers?.paystack?.connected),
      allProducts: formattedProducts,
      featuredProductIds: featuredIds,
    };
  } catch (err) {
    console.error('Error fetching storefront overview:', err);
    return null;
  }
}

/**
 * Updates the list of pinned/featured product IDs on the storefront
 */
export async function updateFeaturedProductIds(featuredIds: string[]): Promise<{ success: boolean; error?: string }> {
  return updateFeaturedProductIdsImpl(featuredIds);
}
