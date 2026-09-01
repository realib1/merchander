'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import { BranchData, BranchInput, InterBranchTransferInput, BulkInterBranchTransferInput } from '@/types/branches';

/**
 * Fetches all physical branches & locations for the active tenant
 */
export async function getTenantBranches(): Promise<BranchData[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    const [storesRes, inventoryRes, ordersRes] = await Promise.all([
      supabase
        .from('stores')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('is_primary', { ascending: false })
        .order('name'),
      supabase.from('inventory_levels').select('store_id, quantity'),
      supabase.from('orders').select('store_id'),
    ]);

    const stores = storesRes.data || [];
    const inventory = inventoryRes.data || [];
    const orders = ordersRes.data || [];

    // Map metrics per store
    return stores.map((s) => {
      const storeInventory = inventory.filter((inv) => inv.store_id === s.id);
      const totalUnitsCount = storeInventory.reduce((sum, inv) => sum + (Number(inv.quantity) || 0), 0);
      const totalProductsCount = storeInventory.length;
      const totalOrdersCount = orders.filter((o) => o.store_id === s.id).length;

      return {
        id: s.id,
        tenant_id: s.tenant_id,
        name: s.name,
        location: s.location,
        is_primary: Boolean(s.is_primary),
        phone: s.phone,
        whatsapp_phone: s.whatsapp_phone,
        street_address: s.street_address,
        city: s.city,
        region: s.region,
        landmark: s.landmark,
        digital_address: s.digital_address,
        operating_hours: Array.isArray(s.operating_hours) ? s.operating_hours : [],
        pickup_enabled: s.pickup_enabled ?? true,
        created_at: s.created_at,
        updated_at: s.updated_at,
        totalUnitsCount,
        totalProductsCount,
        totalOrdersCount,
      };
    });
  } catch (err) {
    console.error('Error fetching tenant branches:', err);
    return [];
  }
}

/**
 * Creates a new branch for the tenant
 */
export async function createBranch(
  input: BranchInput
): Promise<{ success: boolean; error?: string; branch?: BranchData }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') {
      return { success: false, error: 'Only owners and admins can create branches' };
    }

    if (!input.name.trim()) {
      return { success: false, error: 'Branch name is required' };
    }

    // If marked as primary, unset other primary branches
    if (input.is_primary) {
      await supabase.from('stores').update({ is_primary: false }).eq('tenant_id', tenantId);
    }

    const { data: newStore, error } = await supabase
      .from('stores')
      .insert({
        tenant_id: tenantId,
        name: input.name.trim(),
        location: input.city || input.street_address || null,
        is_primary: Boolean(input.is_primary),
        phone: input.phone || null,
        whatsapp_phone: input.whatsapp_phone || null,
        street_address: input.street_address || null,
        city: input.city || null,
        region: input.region || null,
        landmark: input.landmark || null,
        digital_address: input.digital_address || null,
        operating_hours: input.operating_hours || [],
        pickup_enabled: input.pickup_enabled ?? true,
      })
      .select()
      .single();

    if (error || !newStore) {
      return { success: false, error: error?.message || 'Failed to create branch' };
    }

    revalidatePath('/dashboard/settings/branches');
    revalidatePath('/dashboard', 'layout');
    return { success: true, branch: newStore as BranchData };
  } catch (err) {
    console.error('Error creating branch:', err);
    return { success: false, error: 'Failed to create branch' };
  }
}

/**
 * Updates an existing branch
 */
export async function updateBranch(
  branchId: string,
  input: BranchInput
): Promise<{ success: boolean; error?: string }> {
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

    if (input.is_primary) {
      await supabase.from('stores').update({ is_primary: false }).eq('tenant_id', tenantId);
    }

    const { error } = await supabase
      .from('stores')
      .update({
        name: input.name.trim(),
        location: input.city || input.street_address || null,
        is_primary: Boolean(input.is_primary),
        phone: input.phone || null,
        whatsapp_phone: input.whatsapp_phone || null,
        street_address: input.street_address || null,
        city: input.city || null,
        region: input.region || null,
        landmark: input.landmark || null,
        digital_address: input.digital_address || null,
        operating_hours: input.operating_hours || [],
        pickup_enabled: input.pickup_enabled ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', branchId)
      .eq('tenant_id', tenantId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/settings/branches');
    revalidatePath('/dashboard', 'layout');
    return { success: true };
  } catch (err) {
    console.error('Error updating branch:', err);
    return { success: false, error: 'Failed to update branch' };
  }
}

/**
 * Deletes a branch safely
 */
export async function deleteBranch(branchId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') {
      return { success: false, error: 'Only owners and admins can delete branches' };
    }

    const { data: store } = await supabase
      .from('stores')
      .select('is_primary, name')
      .eq('id', branchId)
      .eq('tenant_id', tenantId)
      .single();

    if (!store) return { success: false, error: 'Branch not found' };
    if (store.is_primary) {
      return {
        success: false,
        error: 'Cannot delete the designated Primary Headquarters branch. Set another branch as primary first.',
      };
    }

    const { error } = await supabase.from('stores').delete().eq('id', branchId).eq('tenant_id', tenantId);
    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/settings/branches');
    revalidatePath('/dashboard', 'layout');
    return { success: true };
  } catch (err) {
    console.error('Error deleting branch:', err);
    return { success: false, error: 'Failed to delete branch' };
  }
}

/**
 * Sets a specific branch as the Primary Headquarters
 */
export async function setPrimaryBranch(branchId: string): Promise<{ success: boolean; error?: string }> {
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

    await supabase.from('stores').update({ is_primary: false }).eq('tenant_id', tenantId);
    await supabase.from('stores').update({ is_primary: true }).eq('id', branchId).eq('tenant_id', tenantId);

    revalidatePath('/dashboard/settings/branches');
    revalidatePath('/dashboard', 'layout');
    return { success: true };
  } catch (err) {
    console.error('Error setting primary branch:', err);
    return { success: false, error: 'Failed to set primary branch' };
  }
}

/**
 * Transfers stock units of a product variant between two branches atomically
 */
export async function transferBranchStock(
  input: InterBranchTransferInput
): Promise<{ success: boolean; error?: string }> {
  return transferBulkBranchStock({
    sourceStoreId: input.sourceStoreId,
    targetStoreId: input.targetStoreId,
    items: [{ variantId: input.variantId, quantity: input.quantity }],
  });
}

/**
 * Transfers multiple product variants in bulk between two branches atomically
 */
export async function transferBulkBranchStock(
  input: BulkInterBranchTransferInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'No items selected for transfer' };
    }

    for (const item of input.items) {
      if (item.quantity <= 0) continue;

      const { error: rpcError, data: result } = await supabase.rpc('transfer_inventory_between_branches', {
        p_source_store_id: input.sourceStoreId,
        p_target_store_id: input.targetStoreId,
        p_variant_id: item.variantId,
        p_quantity: item.quantity,
      });

      if (rpcError) {
        return { success: false, error: rpcError.message };
      }

      const res = result as { success: boolean; error?: string };
      if (!res.success) {
        return { success: false, error: res.error || 'Failed to transfer stock' };
      }
    }

    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/settings/branches');
    return { success: true };
  } catch (err) {
    console.error('Error in transferBulkBranchStock:', err);
    return { success: false, error: 'Failed to transfer bulk stock' };
  }
}

/**
 * Returns available pickup-enabled branches for public storefront checkout
 */
export async function getPublicStorefrontBranches(slug: string): Promise<
  Array<{
    id: string;
    name: string;
    street_address: string | null;
    city: string | null;
    landmark: string | null;
    phone: string | null;
    digital_address: string | null;
  }>
> {
  const supabase = await createClient();

  try {
    const { data: sfData } = await supabase.from('storefront_settings').select('tenant_id').eq('slug', slug).single();

    if (!sfData?.tenant_id) return [];

    const { data: branches } = await supabase
      .from('stores')
      .select('id, name, street_address, city, landmark, phone, digital_address')
      .eq('tenant_id', sfData.tenant_id)
      .eq('pickup_enabled', true)
      .order('is_primary', { ascending: false })
      .order('name');

    return branches || [];
  } catch (err) {
    console.error('Error fetching storefront pickup branches:', err);
    return [];
  }
}
