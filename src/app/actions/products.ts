'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Type definitions for our basic catalog shapes
export type Product = {
  id?: string;
  name: string;
  description?: string;
  is_active?: boolean;
};

export type ProductVariant = {
  id?: string;
  product_id?: string;
  sku: string;
  name?: string;
  price: number;
  compare_at_price?: number;
};

/**
 * Fetch all products for the current tenant.
 * RLS ensures we only get our own products.
 */
export async function getProducts(query?: string) {
  const supabase = await createClient();

  let queryBuilder = supabase
    .from('products')
    .select(`
      *,
      variants:product_variants(*, inventory_levels(*))
    `)
    .order('created_at', { ascending: false });

  if (query) {
    queryBuilder = queryBuilder.ilike('name', `%${query}%`);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }

  return data;
}

/**
 * Create a new product with its variants.
 * Requires tenant_id to be passed in, or handled by a trigger/RLS default.
 * Assuming the client provides the tenant_id for now until we set up default DB logic.
 */
export async function createProduct(
  tenantId: string,
  productData: Product,
  variantsData: ProductVariant[]
) {
  const supabase = await createClient();

  // 1. Insert Product
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      tenant_id: tenantId,
      name: productData.name,
      description: productData.description,
      is_active: productData.is_active ?? true,
    })
    .select()
    .single();

  if (productError || !product) {
    console.error('Error creating product:', productError);
    throw new Error('Failed to create product');
  }

  // 2. Insert Variants
  if (variantsData.length > 0) {
    const variantsToInsert = variantsData.map((v) => ({
      ...v,
      product_id: product.id,
    }));

    const { error: variantsError } = await supabase
      .from('product_variants')
      .insert(variantsToInsert);

    if (variantsError) {
      console.error('Error creating variants:', variantsError);
      // Depending on strictness, we might want to delete the product here (rollback)
      // For now, throw.
      throw new Error('Failed to create product variants');
    }
  }

  revalidatePath('/dashboard/products');
  return product;
}

/**
 * Safely decrement inventory for a specific store and variant.
 * Calls our custom PostgreSQL RPC.
 */
export async function decrementInventory(
  variantId: string,
  storeId: string,
  amount: number
) {
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
 * Update a product's base details.
 */
export async function updateProduct(
  productId: string,
  updates: Partial<Product>
) {
  const supabase = await createClient();

  // Auth + tenant scoping (IDOR prevention)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantUser) throw new Error('Tenant not found');

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('tenant_id', tenantUser.tenant_id);

  if (error) {
    console.error('Error deleting product:', error);
    throw new Error('Failed to delete product');
  }

  revalidatePath('/dashboard/products');
  return { success: true };
}

/**
 * Set exact inventory for a variant at a specific store.
 * Useful for receiving new stock shipments.
 */
export async function setInventory(
  variantId: string,
  storeId: string,
  quantity: number
) {
  const supabase = await createClient();

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

