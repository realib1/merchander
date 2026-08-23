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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const resolvedParams = await searchParams;
  const query = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;
  const statusFilter = typeof resolvedParams.status === 'string' ? resolvedParams.status : undefined;

  // Build the query
  let queryBuilder = supabase
    .from('product_categories')
    .select(`
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
    `)
    .order('name');

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
  const formattedCategories: CategoryData[] = (categories || []).map((cat: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    let productCount = 0;
    let totalInventory = 0;

    if (cat.products && Array.isArray(cat.products)) {
      productCount = cat.products.length;
      
      cat.products.forEach((product: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
        if (product.variants && Array.isArray(product.variants)) {
          product.variants.forEach((variant: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
            if (variant.inventory && Array.isArray(variant.inventory)) {
              variant.inventory.forEach((inv: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
                totalInventory += (inv.quantity || 0);
              });
            }
          });
        }
      });
    }

    return {
      id: cat.id,
      name: cat.name,
      description: cat.description,
      is_active: cat.is_active,
      productCount,
      totalInventory
    };
  });

  const totalCategories = formattedCategories.length;
  const activeCategories = formattedCategories.filter(c => c.is_active).length;
  const emptyCategories = formattedCategories.filter(c => c.productCount === 0).length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full min-h-full">
      <CategoriesTopMetrics
        totalCategories={totalCategories}
        activeCategories={activeCategories}
        emptyCategories={emptyCategories}
      />
      <CategoriesPageClient categories={formattedCategories} />
    </div>
  );
}

