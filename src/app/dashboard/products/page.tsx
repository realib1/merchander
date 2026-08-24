import { createClient } from '@/lib/supabase/server';
import { getProducts } from '@/app/actions/products-queries';
import { redirect } from 'next/navigation';
import { Package } from 'lucide-react';
import { ProductsHeader } from './components/ProductsHeader';
import { ProductsActionMenu } from './components/ProductsActionMenu';
import { ProductsMetrics } from './components/ProductsMetrics';
import { ProductsTable, StockBadge } from './components/ProductsTable';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/utils/format';
import { calculateTotalStock, getVariantPriceRange, generateSKU } from '@/utils/product';
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const resolvedParams = await searchParams;
  const query = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;
  const statusFilter = typeof resolvedParams.status === 'string' ? resolvedParams.status : undefined;
  const view = typeof resolvedParams.view === 'string' ? resolvedParams.view : 'table';
  const sortBy = typeof resolvedParams.sortBy === 'string' ? resolvedParams.sortBy : 'created_at';
  const sortOrder = typeof resolvedParams.sortOrder === 'string' && (resolvedParams.sortOrder === 'asc' || resolvedParams.sortOrder === 'desc') ? resolvedParams.sortOrder : 'desc';

  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
  const pageSize = 12; // 12 is good for grid layout (3x4 or 4x3)

  const { data: products, count } = await getProducts(query, page, pageSize, sortBy, sortOrder, statusFilter);

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="flex flex-col mx-auto w-full min-h-full">
      <ProductsMetrics products={products as Product[]} />
      <ProductsHeader />

      <div className="bg-surface border border-separator rounded-xl overflow-hidden min-h-125 flex flex-col min-w-0 w-full">
        {view === 'grid' ? (
          <ProductGridView 
            products={products as Product[]} 
            currentPage={page} 
            totalPages={totalPages} 
            totalCount={count || 0} 
            searchParams={await searchParams}
          />
        ) : (
          <ProductsTable 
            initialProducts={products as Product[]} 
            currentPage={page} 
            totalPages={totalPages} 
            totalCount={count || 0} 
          />
        )}
      </div>
    </div>
  );
}

function ProductGridView({ 
  products,
  currentPage,
  totalPages,
  totalCount,
  searchParams
}: { 
  products: Product[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchParams: any;
}) {
  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `?${params.toString()}`;
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-1 content-start">
        {products?.map((product) => {
          const totalStock = calculateTotalStock(product.variants ?? undefined);
          const { min: minPrice, hasRange } = getVariantPriceRange(product.variants ?? undefined);

          return (
            <div
              key={product.id}
              className="group flex flex-col bg-surface border border-separator rounded-xl overflow-hidden hover:border-brand-primary/50 transition-colors shadow-sm hover:shadow-md relative"
            >
              <div className="aspect-square bg-brand-primary/5 border-b border-separator/30 flex items-center justify-center relative overflow-hidden">
                {product.image_urls && product.image_urls.length > 0 ? (
                  <Image
                    src={product.image_urls[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                  />
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
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-semibold bg-surface/90 backdrop-blur-sm text-emerald-600 shadow-sm border border-emerald-500/20 relative">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-semibold bg-surface/90 backdrop-blur-sm text-orange-600 shadow-sm border border-orange-500/20 relative">
                      Archived
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <Link
                  href={`/dashboard/products/${product.id}`}
                  className="font-semibold  text-sm line-clamp-1 group-hover:text-brand-primary transition-colors before:absolute before:inset-0 before:z-10 focus:outline-none focus:underline"
                >
                  {product.name}
                </Link>
                <p className="text-xs text-muted mt-0.5 relative z-10 pointer-events-none">
                  {generateSKU(product.name, product.id)}
                </p>

                <div className="mt-3 flex items-center justify-between relative z-10 pointer-events-none">
                  <span className="font-bold  text-sm tabular-nums">
                    {hasRange ? `From ${formatCurrency(minPrice)}` : formatCurrency(minPrice)}
                  </span>
                  <StockBadge totalStock={totalStock} stockUnit={product.stock_unit} />
                </div>
              </div>
            </div>
          );
        })}

        {(!products || products.length === 0) && (
          <div className="col-span-full p-12 text-center">
            <Package size={48} className="mx-auto mb-4 text-muted" />
            <p className="font-medium">No products found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters, or create your first product.</p>
            <Link
              href="/dashboard/products/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-brand-primary-600 transition-colors"
            >
              Add Product
            </Link>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {products && products.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-separator bg-surface-elevated/20 text-body-sm mt-auto">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-medium tabular-nums">
              {Math.min((currentPage - 1) * 12 + 1, totalCount)}-{Math.min(currentPage * 12, totalCount)}
            </span>
            <span>of</span>
            <span className="font-medium tabular-nums">{totalCount}</span>
            <span>products</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="tabular-nums">Page {currentPage} of {Math.max(1, totalPages)}</span>
            <div className="flex items-center gap-1">
              {currentPage > 1 ? (
                <Link
                  href={createPageUrl(currentPage - 1)}
                  className="p-1 rounded text-muted hover:text-brand-primary hover:bg-surface border border-transparent hover:border-separator transition-all"
                  aria-label="Previous page"
                >
                  &lt;
                </Link>
              ) : (
                <button
                  className="p-1 rounded text-muted hover:text-brand-primary hover:bg-surface border border-transparent hover:border-separator transition-all"
                  disabled
                  aria-label="Previous page"
                >
                  &lt;
                </button>
              )}
              
              <span
                className="px-2 py-1 min-w-6 text-center rounded bg-surface border border-separator tabular-nums"
                aria-current="page"
              >
                {currentPage}
              </span>

              {currentPage < totalPages ? (
                <Link
                  href={createPageUrl(currentPage + 1)}
                  className="p-1 rounded text-muted hover:text-brand-primary hover:bg-surface border border-transparent hover:border-separator transition-all"
                  aria-label="Next page"
                >
                  &gt;
                </Link>
              ) : (
                <button
                  className="p-1 rounded text-muted hover:text-brand-primary hover:bg-surface border border-transparent hover:border-separator transition-all"
                  disabled
                  aria-label="Next page"
                >
                  &gt;
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
