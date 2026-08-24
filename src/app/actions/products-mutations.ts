'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Product } from './products-queries';

/**
 * Update a product's base details.
 */
export async function updateProduct(productId: string, updates: Partial<Product>) {
  const supabase = await createClient();

  // Auth + tenant scoping (IDOR prevention)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) throw new Error('Tenant not found');

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .eq('tenant_id', tenantUser.tenant_id)
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating product:', error);
    throw new Error('Failed to update product');
  }

  revalidatePath('/dashboard/products');
  return data;
}

/**
 * Delete a product and cascade to all its variants and inventory.
 */
export async function deleteProduct(productId: string) {
  const supabase = await createClient();

  // Auth + tenant scoping (IDOR prevention)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) throw new Error('Tenant not found');

  const { error } = await supabase.from('products').delete().eq('id', productId).eq('tenant_id', tenantUser.tenant_id);

  if (error) {
    console.error('Error deleting product:', error);
    throw new Error('Failed to delete product');
  }

  revalidatePath('/dashboard/products');
  return { success: true };
}

/**
 * Bulk archive multiple products.
 */
export async function bulkArchiveProducts(productIds: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) throw new Error('Tenant not found');

  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .in('id', productIds)
    .eq('tenant_id', tenantUser.tenant_id);

  if (error) {
    console.error('Error archiving products:', error);
    throw new Error('Failed to archive products');
  }

  revalidatePath('/dashboard/products');
  return { success: true };
}

/**
 * Bulk delete multiple products.
 */
export async function bulkDeleteProducts(productIds: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) throw new Error('Tenant not found');

  const { error } = await supabase.from('products').delete().in('id', productIds).eq('tenant_id', tenantUser.tenant_id);

  if (error) {
    console.error('Error deleting products:', error);
    throw new Error('Failed to delete products');
  }

  revalidatePath('/dashboard/products');
  return { success: true };
}
