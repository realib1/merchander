import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CategoriesTopMetrics } from './components/CategoriesTopMetrics';
import { CategoriesPageClient } from './components/CategoriesPageClient';
import type { CategoryData } from './components/CategoriesTable';

export const metadata = {
  title: 'Categories | Merchander',
};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  const resolvedParams = await searchParams;
  const query = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;
  const statusFilter = typeof resolvedParams.status === 'string' ? resolvedParams.status : undefined;

  interface RawCategoryVariant {
    id: string;
    inventory?: { quantity?: number }[] | { quantity?: number } | null;
  }

  interface RawCategoryProduct {
    id: string;
    variants?: RawCategoryVariant[] | null;
  }

  interface RawCategoryResult {
    id: string;
    name: string;
    description?: string | null;
    is_active: boolean;
    products?: RawCategoryProduct[] | null;
  }

  // Build the query
  let queryBuilder = supabase
    .from('product_categories')
    .select(
      `
      id,
      name,
      description,
      is_active,
      products:products (
        id,
        variants:product_variants (
          id,
          inventory:inventory_levels (
            quantity
          )
        )
      )
    `
    )
    .order('name');

  if (tenantUser?.tenant_id) {
    queryBuilder = queryBuilder.eq('tenant_id', tenantUser.tenant_id);
  }

  if (query) {
    queryBuilder = queryBuilder.ilike('name', `%${query}%`);
  }
  if (statusFilter && statusFilter !== 'all') {
    queryBuilder = queryBuilder.eq('is_active', statusFilter === 'active');
  }

  const { data: categories, error } = await queryBuilder;

  if (error) {
    console.error('Error fetching categories:', error);
  }

  // Process data to match CategoryData interface
  const formattedCategories: CategoryData[] = ((categories as unknown as RawCategoryResult[]) || []).map((cat) => {
    let productCount = 0;
    let totalInventory = 0;

    if (cat.products && Array.isArray(cat.products)) {
      productCount = cat.products.length;

      cat.products.forEach((product) => {
        if (product.variants && Array.isArray(product.variants)) {
          product.variants.forEach((variant) => {
            if (variant.inventory) {
              if (Array.isArray(variant.inventory)) {
                variant.inventory.forEach((inv) => {
                  totalInventory += inv.quantity || 0;
                });
              } else if (typeof variant.inventory === 'object') {
                totalInventory += variant.inventory.quantity || 0;
              }
            }
          });
        }
      });
    }

    return {
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      is_active: cat.is_active,
      productCount,
      totalInventory,
    };
  });

  const totalCategories = formattedCategories.length;
  const activeCategories = formattedCategories.filter((c) => c.is_active).length;
  const emptyCategories = formattedCategories.filter((c) => c.productCount === 0).length;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn max-w-7xl mx-auto w-full">
      <h1 className="sr-only">Product Categories</h1>
      <CategoriesTopMetrics
        totalCategories={totalCategories}
        activeCategories={activeCategories}
        emptyCategories={emptyCategories}
      />
      <CategoriesPageClient categories={formattedCategories} />
    </div>
  );
}
