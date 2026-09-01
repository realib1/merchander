'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

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
    price: number;
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
          id, name, image_urls,
          variants:product_variants(id, price, inventory:inventory_levels(quantity))
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
    const payments = customSettings.payments as Record<string, unknown> | undefined;
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
        price: minPrice,
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
      isHubtelConnected: Boolean(providers?.hubtel?.connected ?? true),
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' };
    }

    // 1. Update storefront_settings if exists, or insert with tenant defaults
    const { data: existingSf } = await supabase
      .from('storefront_settings')
      .select('id, store_name, slug')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (existingSf) {
      await supabase
        .from('storefront_settings')
        .update({ featured_product_ids: featuredIds })
        .eq('tenant_id', tenantId);
    } else {
      const { data: tenant } = await supabase.from('tenants').select('name').eq('id', tenantId).single();
      const defaultSlug = (tenant?.name || 'store')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      await supabase.from('storefront_settings').insert({
        tenant_id: tenantId,
        store_name: tenant?.name || 'Online Store',
        slug: defaultSlug || 'my-store',
        featured_product_ids: featuredIds,
      });
    }

    // 2. Also persist in tenant_settings settings_data
    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .single();

    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    await supabase
      .from('tenant_settings')
      .update({
        settings_data: {
          ...currentData,
          featured_product_ids: featuredIds,
        },
      })
      .eq('tenant_id', tenantId);

    revalidatePath('/dashboard/online-store');
    revalidatePath('/store/[slug]', 'page');
    return { success: true };
  } catch (err) {
    console.error('Error updating featured products:', err);
    return { success: false, error: 'Failed to update featured products' };
  }
}
