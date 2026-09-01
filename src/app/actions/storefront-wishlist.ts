'use server';

import { createClient } from '@/lib/supabase/server';
import { normalizeGhanaPhone } from '@/utils/phone';

interface SyncWishlistInput {
  tenantSlug: string;
  phone: string;
  productIds: string[];
}

interface SavedProductItem {
  id: string;
  name: string;
  minPrice: number;
  maxPrice: number;
  imageUrl: string | null;
  totalStock: number;
  isAvailable: boolean;
}

interface SyncWishlistResult {
  success: boolean;
  totalSaved: number;
  savedProducts?: SavedProductItem[];
  error?: string;
}

/**
 * Merges anonymous guest saved product IDs into the database customer profile.
 */
export async function syncGuestWishlist({
  tenantSlug,
  phone,
  productIds,
}: SyncWishlistInput): Promise<SyncWishlistResult> {
  const supabase = await createClient();

  try {
    const normalizedPhone = normalizeGhanaPhone(phone);
    if (!normalizedPhone) {
      return { success: false, totalSaved: 0, error: 'Invalid phone number format.' };
    }

    // 1. Resolve tenant
    const { data: sfSettings } = await supabase
      .from('storefront_settings')
      .select('tenant_id')
      .eq('slug', tenantSlug)
      .maybeSingle();

    const tenantId = sfSettings?.tenant_id;
    if (!tenantId) {
      return { success: false, totalSaved: 0, error: 'Store not found.' };
    }

    // 2. Find or create customer
    const { data: existingCust } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone', normalizedPhone)
      .maybeSingle();

    let customerId = existingCust?.id;
    if (!customerId) {
      const { data: newCust, error: custErr } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
          phone: normalizedPhone,
        })
        .select('id')
        .single();
      if (custErr) throw custErr;
      customerId = newCust.id;
    }

    // 3. Insert saved products
    if (productIds.length > 0) {
      const rows = productIds.map((pid) => ({
        tenant_id: tenantId,
        customer_id: customerId,
        product_id: pid,
      }));

      await supabase.from('customer_saved_items').upsert(rows, {
        onConflict: 'tenant_id,customer_id,product_id',
      });
    }

    // 4. Fetch all saved products for this customer
    const { data: savedRecords } = await supabase
      .from('customer_saved_items')
      .select(
        `
        product_id,
        products (
          id, name,
          product_images (image_url, is_primary),
          product_variants (price, inventory (stock_level))
        )
      `
      )
      .eq('tenant_id', tenantId)
      .eq('customer_id', customerId);

    type RawSavedRow = {
      product_id: string;
      products: {
        id: string;
        name: string;
        product_images: Array<{ image_url: string; is_primary: boolean }> | null;
        product_variants: Array<{
          price: number;
          inventory: Array<{ stock_level: number }> | null;
        }> | null;
      } | null;
    };

    const rawRows = (savedRecords || []) as unknown as RawSavedRow[];

    const savedProducts: SavedProductItem[] = rawRows
      .filter((r) => r.products !== null)
      .map((r) => {
        const p = r.products!;
        const primaryImg =
          p.product_images?.find((img) => img.is_primary)?.image_url || p.product_images?.[0]?.image_url || null;
        const prices = (p.product_variants || []).map((v) => Number(v.price) || 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

        const totalStock = (p.product_variants || []).reduce((acc, v) => {
          const invSum = (v.inventory || []).reduce((s, inv) => s + (Number(inv.stock_level) || 0), 0);
          return acc + invSum;
        }, 0);

        return {
          id: p.id,
          name: p.name,
          minPrice,
          maxPrice,
          imageUrl: primaryImg,
          totalStock,
          isAvailable: totalStock > 0,
        };
      });

    return {
      success: true,
      totalSaved: savedProducts.length,
      savedProducts,
    };
  } catch (err: unknown) {
    console.error('syncGuestWishlist error:', err);
    return { success: false, totalSaved: 0, error: 'Failed to sync wishlist items' };
  }
}
