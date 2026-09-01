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
export async function getProducts(
  query?: string,
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc',
  statusFilter?: string
) {
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
      category:product_categories(id, name),
      variants:product_variants(
        *, 
        inventory:inventory_levels(*),
        order_items(quantity, orders(status))
      )
    `,
      { count: 'exact' }
    )
    .order(sortBy, { ascending: sortOrder === 'asc' });

  if (query) {
    queryBuilder = queryBuilder.ilike('name', `%${query}%`);
  }

  if (statusFilter && statusFilter !== 'all') {
    queryBuilder = queryBuilder.eq('is_active', statusFilter === 'active');
  }

  const { data, count, error } = await queryBuilder.range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }

  return { data, count: count || 0 };
}
