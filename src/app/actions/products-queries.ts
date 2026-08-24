'use server';

import { createClient } from '@/lib/supabase/server';

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
export async function getProducts(query?: string, page: number = 1, pageSize: number = 10) {
  const supabase = await createClient();

  // Dual-layer security: explicit auth check + RLS
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let queryBuilder = supabase
    .from('products')
    .select(
      `
      *,
      variants:product_variants(*, inventory_levels(*))
    `, { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  if (query) {
    queryBuilder = queryBuilder.ilike('name', `%${query}%`);
  }

  const { data, count, error } = await queryBuilder
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }

  return { data, count: count || 0 };
}
