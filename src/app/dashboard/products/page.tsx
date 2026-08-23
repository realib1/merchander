import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Package, Tag, Archive, Star, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { ProductsHeader } from './components/ProductsHeader';
import { ProductsActionMenu } from './components/ProductsActionMenu';
import { ProductsMetrics } from './components/ProductsMetrics';
import Link from 'next/link';
import { formatCurrency } from '@/utils/format';
import type { Product, ProductVariant, OrderItem } from '@/types/product';

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
    .select('*, variants:product_variants(*, inventory:inventory_levels(quantity), order_items(quantity, order:orders(status)))')
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

      <div className="bg-surface border border-separator rounded-xl overflow-hidden min-h-[500px] flex flex-col">
        {view === 'grid' ? (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-1 content-start">
            {(products as Product[])?.map((product) => {
              const totalStock = product.variants?.reduce((acc: number, v: ProductVariant) => {
                const inv = v.inventory?.reduce((iAcc: number, i: { quantity: number }) => iAcc + (i.quantity || 0), 0) || 0;
                return acc + inv;
              }, 0) ?? 0;

              const prices = product.variants?.map((v: ProductVariant) => v.price) || [0];
              const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
              
              const totalUnitsSold = product.variants?.reduce((acc: number, v: ProductVariant) => {
                const sold = v.order_items?.reduce((sAcc: number, item: OrderItem) => {
                  const status = item.order?.status || item.orders?.status;
                  if (status !== 'draft' && status !== 'cancelled') {
                    return sAcc + (item.quantity || 0);
                  }
                  return sAcc;
                }, 0) || 0;
                return acc + sold;
              }, 0) ?? 0;

              return (
                <Link href={`/dashboard/products/${product.id}`} key={product.id} className="group flex flex-col bg-surface border border-separator rounded-xl overflow-hidden hover:border-brand-primary/50 transition-colors shadow-sm hover:shadow-md cursor-pointer">
                  <div className="aspect-square bg-brand-primary/5 border-b border-separator/30 flex items-center justify-center p-4 relative">
                    <div className="w-20 h-20 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-3xl">
                      {product.name ? product.name.substring(0, 2).toUpperCase() : 'UN'}
                    </div>
                    <div className="absolute top-3 right-3">
                      {product.is_active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">Active</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-500/10 text-orange-600">Archived</span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-text-primary text-[14px] line-clamp-1 group-hover:text-brand-primary transition-colors">{product.name}</h3>
                    <p className="text-[12px] text-text-muted mt-0.5">SKU-{product.id.substring(0, 6).toUpperCase()}</p>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-text-primary text-sm">
                        {prices.length > 1 && new Set(prices).size > 1 ? `From ${formatCurrency(minPrice)}` : formatCurrency(minPrice)}
                      </span>
                      {totalStock === 0 ? (
                        <span className="text-red-500 font-medium bg-red-500/10 px-2 py-0.5 rounded text-xs">Out of stock</span>
                      ) : totalStock < 10 ? (
                        <span className="text-orange-500 font-medium bg-orange-500/10 px-2 py-0.5 rounded text-xs">{totalStock} left</span>
                      ) : (
                        <span className="text-text-secondary text-xs">{totalStock} in stock</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
            
            {(!products || products.length === 0) && (
              <div className="col-span-full p-12 text-center text-text-secondary">
                <Package size={48} className="mx-auto mb-4 text-text-muted" />
                <p className="font-medium text-text-primary">No products found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto flex-1 flex flex-col">
            <div className="min-w-250 flex flex-col flex-1">
              {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 font-medium text-text-muted text-[13px] border-b border-separator bg-surface-elevated/20">
              <div className="col-span-1 flex items-center justify-center">
                <input type="checkbox" aria-label="Select all products" className="w-4 h-4 rounded border-separator bg-surface text-brand-primary focus:ring-brand-primary" />
              </div>
              <div className="col-span-4">Product</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Inventory</div>
              <div className="col-span-1">Price</div>
              <div className="col-span-1">Units sold</div>
              <div className="col-span-1 text-right"></div>
            </div>

            <div className="flex-1 divide-y divide-gray-50">
              {(products as Product[])?.map((product) => {
                const totalStock = product.variants?.reduce((acc: number, v: ProductVariant) => {
                  const inv = v.inventory?.reduce((iAcc: number, i: { quantity: number }) => iAcc + (i.quantity || 0), 0) || 0;
                  return acc + inv;
                }, 0) ?? 0;

                const prices = product.variants?.map((v: ProductVariant) => v.price) || [0];
                const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                
                const totalUnitsSold = product.variants?.reduce((acc: number, v: ProductVariant) => {
                  const sold = v.order_items?.reduce((sAcc: number, item: OrderItem) => {
                    const status = item.order?.status || item.orders?.status;
                    if (status !== 'draft' && status !== 'cancelled') {
                      return sAcc + (item.quantity || 0);
                    }
                    return sAcc;
                  }, 0) || 0;
                  return acc + sold;
                }, 0) ?? 0;

                return (
                  <div key={product.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-surface-elevated/30 transition-colors group">
                    <div className="col-span-1 flex items-center justify-center">
                      <input type="checkbox" aria-label={`Select ${product.name}`} className="w-4 h-4 rounded border-separator bg-surface text-brand-primary focus:ring-brand-primary" />
                    </div>
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {product.name ? product.name.substring(0, 2).toUpperCase() : 'UN'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-text-primary truncate">{product.name}</div>
                        <div className="text-[12px] text-text-muted truncate">SKU-{product.id.substring(0, 6).toUpperCase()}</div>
                      </div>
                    </div>

                    <div className="col-span-2 text-[13px] text-text-secondary truncate">
                      Uncategorized
                    </div>

                    <div className="col-span-1">
                      {product.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-600">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-orange-500/10 text-orange-600">
                          Archived
                        </span>
                      )}
                    </div>

                    <div className="col-span-1 text-[13px]">
                      {totalStock === 0 ? (
                        <span className="text-red-500 font-medium bg-red-500/10 px-2 py-0.5 rounded text-xs">Out of stock</span>
                      ) : totalStock < 10 ? (
                        <span className="text-orange-500 font-medium bg-orange-500/10 px-2 py-0.5 rounded text-xs">{totalStock} low stock</span>
                      ) : (
                        <span className="text-text-primary font-medium">{totalStock} in stock</span>
                      )}
                    </div>

                    <div className="col-span-1 text-[13px] font-medium text-text-primary">
                      {prices.length > 1 && new Set(prices).size > 1 ? `From ${formatCurrency(minPrice)}` : formatCurrency(minPrice)}
                    </div>

                    <div className="col-span-1 text-[13px] text-text-secondary">
                      {totalUnitsSold.toLocaleString()}
                    </div>

                    <div className="col-span-1 flex justify-end relative z-10">
                      <ProductsActionMenu productId={product.id} />
                    </div>
                  </div>
                );
              })}

              {(!products || products.length === 0) && (
                <div className="p-12 text-center text-text-secondary">
                  <Package size={48} className="mx-auto mb-4 text-text-muted" />
                  <p className="font-medium text-text-primary">No products found</p>
                  <p className="text-sm mt-1">Get started by creating your first product.</p>
                </div>
              )}
            </div>
            
            {/* Pagination Footer */}
            {products && products.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-separator bg-surface-elevated/20 text-[13px] text-text-secondary mt-auto">
                <div className="flex items-center gap-2">
                  <span>Rows per page</span>
                  <button className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface border border-separator text-text-primary hover:bg-surface-elevated transition-colors">
                    10 <ChevronDown size={14} className="text-text-muted" />
                  </button>
                </div>
                
                <div className="flex items-center gap-4">
                  <span>1 - {products.length} of {products.length}</span>
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface border border-transparent hover:border-separator transition-all" disabled>
                      <ChevronLeft size={16} />
                    </button>
                    <button className="px-2 py-1 min-w-6 text-center rounded bg-surface border border-separator text-text-primary">1</button>
                    <button className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface border border-transparent hover:border-separator transition-all">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
        )}
      </div>
    </div>
  );
}
