import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Package, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { ProductsHeader } from './components/ProductsHeader';
import { ProductsActionMenu } from './components/ProductsActionMenu';
import { ProductsMetrics } from './components/ProductsMetrics';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/utils/format';
import { calculateTotalStock, calculateTotalUnitsSold, getVariantPriceRange } from '@/utils/product';
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
    <div className="h-full flex flex-col max-w-6xl mx-auto w-full">
      <ProductsMetrics products={products as Product[]} />
      <ProductsHeader />

      <div className="bg-surface border border-separator rounded-xl overflow-hidden min-h-125 flex flex-col">
        {view === 'grid' ? (
          <ProductGridView products={products as Product[]} />
        ) : (
          <ProductTableView products={products as Product[]} />
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
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-surface/90 backdrop-blur-sm text-emerald-600 shadow-sm border border-emerald-500/20 relative">Active</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-surface/90 backdrop-blur-sm text-orange-600 shadow-sm border border-orange-500/20 relative">Archived</span>
                )}
              </div>
            </div>
            <div className="p-4 flex flex-col flex-1">
              <Link href={`/dashboard/products/${product.id}`} className="font-semibold text-text-primary text-[14px] line-clamp-1 group-hover:text-brand-primary transition-colors before:absolute before:inset-0 before:z-10 focus:outline-none focus:underline">
                {product.name}
              </Link>
              <p className="text-[12px] text-text-muted mt-0.5 relative z-10 pointer-events-none">SKU-{product.id.substring(0, 6).toUpperCase()}</p>
              
              <div className="mt-3 flex items-center justify-between relative z-10 pointer-events-none">
                <span className="font-bold text-text-primary text-sm tabular-nums">
                  {hasRange ? `From ${formatCurrency(minPrice)}` : formatCurrency(minPrice)}
                </span>
                <StockBadge totalStock={totalStock} stockUnit={product.stock_unit} />
              </div>
            </div>
          </div>
        );
      })}
      
      {(!products || products.length === 0) && (
        <div className="col-span-full p-12 text-center text-text-secondary">
          <Package size={48} className="mx-auto mb-4 text-text-muted" />
          <p className="font-medium text-text-primary">No products found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters, or create your first product.</p>
          <Link href="/dashboard/products/new" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-brand-primary-600 transition-colors">
            Add Product
          </Link>
        </div>
      )}
    </div>
  );
}

/** Semantic table layout for products — uses proper <table> elements for accessibility */
function ProductTableView({ products }: { products: Product[] }) {
  return (
    <div className="overflow-x-auto flex-1 flex flex-col">
      <div className="min-w-250 flex flex-col flex-1">
        <table className="w-full text-left">
          <thead>
            <tr className="font-medium text-text-muted text-[13px] border-b border-separator bg-surface-elevated/20">
              <th className="px-4 py-3 w-12 text-center font-medium">
                <input type="checkbox" aria-label="Select all products" className="w-4 h-4 rounded border-separator bg-surface text-brand-primary focus:ring-brand-primary" />
              </th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Inventory</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Units sold</th>
              <th className="px-4 py-3 w-12"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {products?.map((product) => {
              const totalStock = calculateTotalStock(product.variants ?? undefined);
              const { min: minPrice, hasRange } = getVariantPriceRange(product.variants ?? undefined);
              const totalUnitsSold = calculateTotalUnitsSold(product.variants ?? undefined);

              return (
                <tr key={product.id} className="hover:bg-surface-elevated/30 transition-colors group">
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" aria-label={`Select ${product.name}`} className="w-4 h-4 rounded border-separator bg-surface text-brand-primary focus:ring-brand-primary" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden relative">
                        {product.image_urls && product.image_urls.length > 0 ? (
                          <Image src={product.image_urls[0]} alt={product.name} fill className="object-cover" sizes="40px" />
                        ) : (
                          product.name ? product.name.substring(0, 2).toUpperCase() : 'UN'
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-text-primary truncate">{product.name}</div>
                        <div className="text-[12px] text-text-muted truncate">SKU-{product.id.substring(0, 6).toUpperCase()}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-[13px] text-text-secondary truncate">
                    {product.category?.name || 'Uncategorized'}
                  </td>

                  <td className="px-4 py-3">
                    {product.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-600">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-orange-500/10 text-orange-600">
                        Archived
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-[13px]">
                    <StockBadge totalStock={totalStock} stockUnit={product.stock_unit} />
                  </td>

                  <td className="px-4 py-3 text-[13px] font-medium text-text-primary tabular-nums">
                    {hasRange ? `From ${formatCurrency(minPrice)}` : formatCurrency(minPrice)}
                  </td>

                  <td className="px-4 py-3 text-[13px] text-text-secondary tabular-nums">
                    {totalUnitsSold.toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-right relative z-10">
                    <ProductsActionMenu productId={product.id} />
                  </td>
                </tr>
              );
            })}

            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={8} className="p-12 text-center text-text-secondary">
                  <Package size={48} className="mx-auto mb-4 text-text-muted" />
                  <p className="font-medium text-text-primary">No products found</p>
                  <p className="text-sm mt-1">Get started by creating your first product.</p>
                  <Link href="/dashboard/products/new" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-brand-primary-600 transition-colors">
                    Add Product
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Pagination Footer */}
        {products && products.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-separator bg-surface-elevated/20 text-[13px] text-text-secondary mt-auto">
            <div className="flex items-center gap-2">
              <span>Showing</span>
              <span className="font-medium text-text-primary tabular-nums">{products.length}</span>
              <span>products</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="tabular-nums">Page 1 of 1</span>
              <div className="flex items-center gap-1">
                <button className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface border border-transparent hover:border-separator transition-all" disabled aria-label="Previous page">
                  <ChevronLeft size={16} />
                </button>
                <span className="px-2 py-1 min-w-6 text-center rounded bg-surface border border-separator text-text-primary tabular-nums" aria-current="page">1</span>
                <button className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface border border-transparent hover:border-separator transition-all" disabled aria-label="Next page">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/** Reusable stock status badge */
function StockBadge({ totalStock, stockUnit }: { totalStock: number; stockUnit?: string | null }) {
  const unit = stockUnit || 'pcs';
  if (totalStock === 0) {
    return <span className="text-red-500 font-medium bg-red-500/10 px-2 py-0.5 rounded text-xs whitespace-nowrap">Out of stock</span>;
  }
  if (totalStock < 10) {
    return <span className="text-orange-500 font-medium bg-orange-500/10 px-2 py-0.5 rounded text-xs whitespace-nowrap">{totalStock} {unit} low</span>;
  }
  return <span className="text-text-primary font-medium whitespace-nowrap text-xs">{totalStock} {unit} in stock</span>;
}
