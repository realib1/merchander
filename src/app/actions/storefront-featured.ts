'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

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
