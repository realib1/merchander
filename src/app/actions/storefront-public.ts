'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { StorefrontConfig, StorefrontPublicData } from '@/types/storefront';
import { generateStoreSlug } from '@/utils/storefront';

async function getStorefrontSupabase() {
  try {
    return createAdminClient();
  } catch {
    return await createClient();
  }
}

export async function getPublicStorefrontBySlug(slug: string): Promise<StorefrontPublicData | null> {
  const supabase = await getStorefrontSupabase();

  try {
    let config: StorefrontConfig | null = null;

    // 1. Try looking up in storefront_settings
    try {
      const { data: sfData, error } = await supabase.from('storefront_settings').select('*').eq('slug', slug).single();

      if (!error && sfData) {
        config = sfData as StorefrontConfig;
      }
    } catch {
      // Table may not exist yet or error
    }

    // 2. Fallback: lookup by tenant name match or ID
    if (!config) {
      const { data: allTenants } = await supabase.from('tenants').select('id, name');
      const matchingTenant = allTenants?.find((t) => generateStoreSlug(t.name) === slug || t.id.slice(0, 8) === slug);
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
          delivery_policy: 'Fast delivery across Ghana',
          is_active: true,
          currency: 'GHS',
        };
      }
    }

    if (!config || !config.is_active) return null;

    const tenantId = config.tenant_id;

    // Fetch categories, published products, and tenant settings in parallel
    const [categoriesRes, productsRes, settingsRes] = await Promise.all([
      supabase.from('product_categories').select('id, name').eq('tenant_id', tenantId).order('name'),
      supabase
        .from('products')
        .select(
          `
          id, name, description, category_id, specifications, image_urls, availability_status, preorder_shipping_mode,
          category:product_categories(id, name),
          variants:product_variants(id, sku, name, price, cost_price, compare_at_price, inventory:inventory_levels(quantity))
        `
        )
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('tenant_settings')
        .select('trading_name, logo_url, brand_primary_color, brand_secondary_color, settings_data')
        .eq('tenant_id', tenantId)
        .maybeSingle(),
    ]);

    // Resilient batch lookup (optional extension, does not block product loading)
    const activeBatchesByProductId: Record<string, import('@/types/preorder').PreorderBatch> = {};
    let allActiveBatches: import('@/types/preorder').PreorderBatch[] = [];
    try {
      // 1. Fetch all currently open/active batches for the store
      const { data: tenantBatches } = await supabase
        .from('preorder_batches')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('closes_at', { ascending: true });

      if (tenantBatches && tenantBatches.length > 0) {
        allActiveBatches = tenantBatches as unknown as import('@/types/preorder').PreorderBatch[];
      }

      // 2. Fetch product-to-batch associations
      const { data: batchLinks } = await supabase
        .from('product_preorder_batches')
        .select('product_id, batch_id, is_active')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (batchLinks && batchLinks.length > 0) {
        const batchIds = Array.from(new Set(batchLinks.map((b) => b.batch_id).filter(Boolean)));
        if (batchIds.length > 0) {
          const batchesMap = new Map((allActiveBatches || []).map((b) => [b.id, b]));
          for (const link of batchLinks) {
            const b = batchesMap.get(link.batch_id);
            if (b) {
              activeBatchesByProductId[link.product_id] = b;
            }
          }
        }
      }
    } catch {
      // Graceful fallback if batch tables are not yet present or query fails
    }

    const tenantSettings = settingsRes.data as Record<string, unknown> | null;
    const customData = (tenantSettings?.settings_data as Record<string, unknown> | null) || {};
    const social = (customData.social as Record<string, string> | undefined) || {};

    if (!config.primary_color) {
      config.primary_color =
        (tenantSettings?.brand_primary_color as string) || (customData.brand_primary_color as string) || '#3b82f6';
    }
    if (!config.secondary_color) {
      config.secondary_color =
        (tenantSettings?.brand_secondary_color as string) || (customData.brand_secondary_color as string) || '#1e40af';
    }
    if (!config.logo_url) {
      config.logo_url = (tenantSettings?.logo_url as string) || (customData.logo_url as string) || null;
    }
    if (!config.banner_url) {
      config.banner_url = (tenantSettings?.banner_url as string) || (customData.banner_url as string) || null;
    }
    if (!config.whatsapp_phone) {
      config.whatsapp_phone = (tenantSettings?.support_phone as string) || social.whatsapp || null;
    }
    if (!config.instagram_handle) {
      config.instagram_handle = social.instagram || null;
    }
    if (!config.tiktok_handle) {
      config.tiktok_handle = social.tiktok || null;
    }
    if (!config.delivery_policy) {
      config.delivery_policy = (customData.delivery_policy as string) || null;
    }

    // Extract real configured payment methods from Dashboard Payment Settings
    const paymentSettings = (customData.payment_settings as Record<string, unknown> | undefined) || {};
    const methods = (paymentSettings.methods as Record<string, boolean> | undefined) || {};
    const p2pAccounts = (paymentSettings.p2p_accounts as Array<{ type?: string; active?: boolean }> | undefined) || [];

    const acceptedMethods: import('@/types/storefront').AcceptedPaymentMethod[] = [];

    const enableMomo = methods.mobileMoney ?? paymentSettings.enableMtnMomo ?? true;
    const hasMtn =
      p2pAccounts.some((a: { type?: string }) => a.type === 'mtn_momo') ||
      paymentSettings.enableMtnMomo === true ||
      p2pAccounts.length === 0;
    const hasTelecel =
      p2pAccounts.some((a: { type?: string }) => a.type === 'telecel_cash') ||
      paymentSettings.enableTelecelCash === true;
    const hasAtMoney =
      p2pAccounts.some((a: { type?: string }) => a.type === 'at_money') || paymentSettings.enableAtMoney === true;

    if (enableMomo) {
      if (hasMtn) {
        acceptedMethods.push({ id: 'mtn_momo', name: 'MTN MoMo', type: 'mtn_momo', dotColor: '#FFCC00' });
      }
      if (hasTelecel) {
        acceptedMethods.push({ id: 'telecel_cash', name: 'Telecel Cash', type: 'telecel_cash', dotColor: '#E60000' });
      }
      if (hasAtMoney) {
        acceptedMethods.push({ id: 'at_money', name: 'AT Money', type: 'at_money', dotColor: '#0066CC' });
      }
      if (acceptedMethods.length === 0) {
        acceptedMethods.push({ id: 'momo', name: 'Mobile Money', type: 'mtn_momo', dotColor: '#FFCC00' });
      }
    }

    const enableCards = methods.card ?? paymentSettings.enableCards ?? false;
    if (enableCards) {
      acceptedMethods.push({ id: 'card', name: 'Visa / Mastercard', type: 'card', dotColor: '#10B981' });
    }

    const enableBank = methods.bankTransfer ?? p2pAccounts.some((a: { type?: string }) => a.type === 'bank');
    if (enableBank) {
      acceptedMethods.push({ id: 'bank_transfer', name: 'Bank Transfer', type: 'bank_transfer', dotColor: '#6366F1' });
    }

    const enableCash = methods.cash ?? paymentSettings.enableCod ?? true;
    if (enableCash) {
      acceptedMethods.push({ id: 'cash', name: 'Cash on Delivery', type: 'cash', dotColor: '#F59E0B' });
    }

    config.accepted_payment_methods = acceptedMethods;
    config.p2p_accounts = p2pAccounts as NonNullable<import('@/types/storefront').StorefrontConfig['p2p_accounts']>;
    config.payment_instructions = (paymentSettings.paymentInstructions as string) || null;

    const rawCategories = categoriesRes.data || [];
    const rawProducts = productsRes.data || [];

    const products = rawProducts.map((p) => {
      const primaryImg = Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls[0] : null;
      const variants = (p.variants || []).map((v) => {
        const invArray = Array.isArray(v.inventory) ? v.inventory : v.inventory ? [v.inventory] : [];
        const stock = invArray.reduce(
          (sum: number, inv: { quantity?: number }) => sum + (Number(inv?.quantity) || 0),
          0
        );
        return {
          id: v.id,
          sku: v.sku,
          title: v.name || 'Standard',
          price: Number(v.price) || 0,
          cost_price: Number(v.cost_price) || 0,
          compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
          stock_quantity: stock,
          is_available: stock > 0,
        };
      });

      const prices = variants.map((v) => v.price);
      const min_price = prices.length > 0 ? Math.min(...prices) : 0;
      const max_price = prices.length > 0 ? Math.max(...prices) : 0;
      const total_stock = variants.reduce((sum, v) => sum + v.stock_quantity, 0);

      const categoryName = Array.isArray(p.category)
        ? p.category[0]?.name || 'General'
        : (p.category as { name?: string } | null)?.name || 'General';

      const activeBatch = activeBatchesByProductId[p.id] || null;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        category_id: p.category_id,
        category_name: categoryName,
        image_url: primaryImg,
        image_urls: Array.isArray(p.image_urls) ? (p.image_urls as string[]).filter(Boolean) : [],
        is_featured: Array.isArray(config?.featured_product_ids)
          ? (config?.featured_product_ids as string[]).includes(p.id)
          : false,
        min_price,
        max_price,
        total_stock,
        availability_status: p.availability_status || 'AVAILABLE',
        preorder_shipping_mode: p.preorder_shipping_mode || 'included',
        specifications: (p.specifications as Array<{ key: string; value: string }>) || [],
        active_batch: activeBatch,
        variants,
      };
    });

    const categories = rawCategories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: generateStoreSlug(c.name),
      product_count: products.filter((p) => p.category_id === c.id).length,
    }));

    return {
      config,
      categories,
      products,
      activeBatches: allActiveBatches,
    };
  } catch (err) {
    console.error('Error loading public storefront:', err);
    return null;
  }
}
