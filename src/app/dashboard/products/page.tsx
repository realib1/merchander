import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Package, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { ProductsHeader } from './components/ProductsHeader';
import { ProductsActionMenu } from './components/ProductsActionMenu';
import { ProductsMetrics } from './components/ProductsMetrics';
import { ProductsTable, StockBadge } from './components/ProductsTable';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/utils/format';
import { calculateTotalStock, calculateTotalUnitsSold, getVariantPriceRange, generateSKU } from '@/utils/product';
import type { Product } from '@/types/product';

export const metadata = {
  title: 'Catalog | Merchander',
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();

  // Auth check (dual-layer: explicit + RLS)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const resolvedParams = await searchParams;
  const query = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;
  const statusFilter = typeof resolvedParams.status === 'string' ? resolvedParams.status : undefined;
  const view = typeof resolvedParams.view === 'string' ? resolvedParams.view : 'table';

  let queryBuilder = supabase
    .from('products')
    .select('*, category:product_categories(id, name), variants:product_variants(*, inventory:inventory_levels(quantity), order_items(quantity, order:orders(status)))')
    .order('created_at', { ascending: false });

  if (query) {
    queryBuilder = queryBuilder.ilike('name', `%${query}%`);
  }
  if (statusFilter && statusFilter !== 'all') {
    queryBuilder = queryBuilder.eq('is_active', statusFilter === 'active');
  }

  const { data: products, error } = await queryBuilder;

  if (error) {
    console.error('Error fetching catalog:', error);
  }

  return (
    <div className="flex flex-col mx-auto w-full min-h-full">
      <ProductsMetrics products={products as Product[]} />
      <ProductsHeader />

      <div className="bg-surface border border-separator rounded-xl overflow-hidden min-h-125 flex flex-col min-w-0 w-full">
        {view === 'grid' ? (
          <ProductGridView products={products as Product[]} />
        ) : (
          <ProductsTable initialProducts={products as Product[]} />
        )}
      </div>
    </div>
  );
}

/** Grid card layout for products */
function ProductGridView({ products }: { products: Product[] }) {
  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-1 content-start">
      {products?.map((product) => {
        const totalStock = calculateTotalStock(product.variants ?? undefined);
        const { min: minPrice, hasRange } = getVariantPriceRange(product.variants ?? undefined);

        return (
          <div key={product.id} className="group flex flex-col bg-surface border border-separator rounded-xl overflow-hidden hover:border-brand-primary/50 transition-colors shadow-sm hover:shadow-md relative">
            <div className="aspect-square bg-brand-primary/5 border-b border-separator/30 flex items-center justify-center relative overflow-hidden">
              {product.image_urls && product.image_urls.length > 0 ? (
                <Image src={product.image_urls[0]} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-3xl">
                  {product.name ? product.name.substring(0, 2).toUpperCase() : 'UN'}
                </div>
              )}
              <div className="absolute top-3 right-3 flex flex-col items-end gap-2 z-20">
                <div className="bg-surface/80 rounded-lg p-0.5 backdrop-blur-sm shadow-sm border border-separator/50 relative">
                  <ProductsActionMenu productId={product.id} />
                </div>
                {product.is_active ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-semibold bg-surface/90 backdrop-blur-sm text-emerald-600 shadow-sm border border-emerald-500/20 relative">Active</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-semibold bg-surface/90 backdrop-blur-sm text-orange-600 shadow-sm border border-orange-500/20 relative">Archived</span>
                )}
              </div>
            </div>
            <div className="p-4 flex flex-col flex-1">
              <Link href={`/dashboard/products/${product.id}`} className="font-semibold text-primary text-sm line-clamp-1 group-hover:text-brand-primary transition-colors before:absolute before:inset-0 before:z-10 focus:outline-none focus:underline">
                {product.name}
              </Link>
              <p className="text-xs text-muted mt-0.5 relative z-10 pointer-events-none">{generateSKU(product.name, product.id)}</p>
              
              <div className="mt-3 flex items-center justify-between relative z-10 pointer-events-none">
                <span className="font-bold text-primary text-sm tabular-nums">
                  {hasRange ? `From ${formatCurrency(minPrice)}` : formatCurrency(minPrice)}
                </span>
                <StockBadge totalStock={totalStock} stockUnit={product.stock_unit} />
              </div>
            </div>
          </div>
        );
      })}
      
      {(!products || products.length === 0) && (
        <div className="col-span-full p-12 text-center text-secondary">
          <Package size={48} className="mx-auto mb-4 text-muted" />
          <p className="font-medium text-primary">No products found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters, or create your first product.</p>
          <Link href="/dashboard/products/new" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-brand-primary-600 transition-colors">
            Add Product
          </Link>
        </div>
      )}
    </div>
  );
}


