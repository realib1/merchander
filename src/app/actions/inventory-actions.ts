'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Safely decrement inventory for a specific store and variant.
 * Calls our custom PostgreSQL RPC.
 */
export async function decrementInventory(variantId: string, storeId: string, amount: number) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('decrement_inventory', {
    p_variant_id: variantId,
    p_store_id: storeId,
    p_amount: amount,
  });

  if (error) {
    console.error('Error decrementing inventory:', error);
    throw new Error(error.message || 'Failed to decrement inventory');
  }

  revalidatePath('/dashboard/inventory');
  return { success: true };
}

/**
 * Set exact inventory for a variant at a specific store.
 * Useful for receiving new stock shipments.
 */
export async function setInventory(variantId: string, storeId: string, quantity: number) {
  const supabase = await createClient();

  // Dual-layer security: explicit auth check + RLS
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('inventory_levels')
    .upsert(
      { variant_id: variantId, store_id: storeId, quantity, updated_at: new Date().toISOString() },
      { onConflict: 'variant_id, store_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error setting inventory:', error);
    throw new Error('Failed to set inventory level');
  }

  revalidatePath('/dashboard/inventory');
  return data;
}

export async function getInventoryMetrics() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('get_inventory_metrics');

  if (error) {
    console.error('Error fetching inventory metrics:', error);
    throw new Error('Failed to fetch inventory metrics');
  }

  return data as {
    totalUnits: number;
    totalVariants: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
}

export async function getInventory(
  query?: string,
  categoryFilter: string = 'All categories',
  statusFilter: string = 'All statuses',
  page: number = 1,
  pageSize: number = 15,
  sortBy: string = 'product_name',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let queryBuilder = supabase
    .from('inventory_view')
    .select('*', { count: 'exact' })
    .order(sortBy, { ascending: sortOrder === 'asc' });

  if (query) {
    queryBuilder = queryBuilder.or(`product_name.ilike.%${query}%,variant_name.ilike.%${query}%,sku.ilike.%${query}%`);
  }

  if (categoryFilter && categoryFilter !== 'All categories') {
    if (categoryFilter === 'Uncategorized') {
      queryBuilder = queryBuilder.is('category_name', null);
    } else {
      queryBuilder = queryBuilder.eq('category_name', categoryFilter);
    }
  }

  if (statusFilter && statusFilter !== 'All statuses') {
    if (statusFilter === 'In stock') {
      queryBuilder = queryBuilder.gte('quantity', 10);
    } else if (statusFilter === 'Low stock') {
      queryBuilder = queryBuilder.gt('quantity', 0).lt('quantity', 10);
    } else if (statusFilter === 'Out of stock') {
      queryBuilder = queryBuilder.eq('quantity', 0);
    }
  }

  const { data, count, error } = await queryBuilder.range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error('Error fetching inventory:', error);
    throw new Error('Failed to fetch inventory');
  }

  // Get distinct categories for the filter dropdown (ideally we should have a categories table query, but this works)
  const { data: categoriesData } = await supabase.from('product_categories').select('name');
  const categories = ['All categories', ...(categoriesData?.map((c) => c.name) || []), 'Uncategorized'];

  return { data, count: count || 0, categories };
}
