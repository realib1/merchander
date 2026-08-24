'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Package, Trash2, Archive, X, Loader2, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { bulkArchiveProducts, bulkDeleteProducts } from '@/app/actions/products-mutations';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/utils/format';
import { calculateTotalStock, calculateTotalUnitsSold, getVariantPriceRange, generateSKU } from '@/utils/product';
import type { Product } from '@/types/product';
import { ProductsActionMenu } from './ProductsActionMenu';

function SortIcon({ column, currentSortBy, currentSortOrder }: { column: string, currentSortBy: string, currentSortOrder: string }) {
  if (currentSortBy !== column) return <ArrowUpDown className="w-3 h-3 ml-1 inline text-muted opacity-0 group-hover:opacity-100 transition-opacity" />;
  return currentSortOrder === 'asc' ? (
    <ArrowUp className="w-3 h-3 ml-1 inline text-foreground" />
  ) : (
    <ArrowDown className="w-3 h-3 ml-1 inline text-foreground" />
  );
}

export function StockBadge({ totalStock, stockUnit }: { totalStock: number; stockUnit?: string | null }) {
  const unit = stockUnit || 'pcs';
  if (totalStock === 0) {
    return (
      <span className="text-red-500 font-medium bg-red-500/10 px-2 py-0.5 rounded text-xs whitespace-nowrap">
        Out of stock
      </span>
    );
  }
  if (totalStock < 10) {
    return (
      <span className="text-orange-500 font-medium bg-orange-500/10 px-2 py-0.5 rounded text-xs whitespace-nowrap">
        {totalStock} {unit} low
      </span>
    );
  }
  return (
    <span className="font-medium whitespace-nowrap text-xs">
      {totalStock} {unit} in stock
    </span>
  );
}

export function ProductsTable({ 
  initialProducts,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0
}: { 
  initialProducts: Product[];
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  // removed useRouter
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sync state when URL search parameters trigger a server re-fetch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProducts(initialProducts);
  }, [initialProducts]);

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(products.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleItem = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return;
    setIsUpdating(true);
    try {
      await bulkArchiveProducts(Array.from(selectedIds));
      toast.success(`Archived ${selectedIds.size} products`);
      // Optimistic update
      setProducts((prev) => prev.map((p) => (selectedIds.has(p.id) ? { ...p, is_active: false } : p)));
      setSelectedIds(new Set());
    } catch (e) {
      console.error(e);
      toast.error('Failed to archive products');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.size} products?`)) return;

    setIsUpdating(true);
    try {
      await bulkDeleteProducts(Array.from(selectedIds));
      toast.success(`Deleted ${selectedIds.size} products`);
      // Optimistic update
      setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete products');
    } finally {
      setIsUpdating(false);
    }
  };

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const createSortUrl = (column: string) => {
    const params = new URLSearchParams(searchParams);
    const currentSortBy = params.get('sortBy') || 'created_at';
    const currentSortOrder = params.get('sortOrder') || 'desc';
    
    if (currentSortBy === column) {
      params.set('sortOrder', currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sortBy', column);
      params.set('sortOrder', 'asc');
    }
    
    return `${pathname}?${params.toString()}`;
  };

  const currentSortBy = searchParams.get('sortBy') || 'created_at';
  const currentSortOrder = searchParams.get('sortOrder') || 'desc';

  return (
    <div className="overflow-x-auto flex-1 flex flex-col min-w-0 w-full">
      <div className="min-w-250 flex flex-col flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="font-medium text-muted text-body-sm border-b border-separator bg-surface-elevated/20">
              <th className="px-4 py-3 w-12 text-center font-medium">
                <input
                  type="checkbox"
                  aria-label="Select all products"
                  checked={selectedIds.size === products.length && products.length > 0}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="w-4 h-4 rounded border-separator bg-surface text-brand-primary focus:ring-brand-primary cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 font-medium">
                <Link href={createSortUrl('name')} className="flex items-center group cursor-pointer">
                  Product <SortIcon column="name" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                </Link>
              </th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">
                <Link href={createSortUrl('created_at')} className="flex items-center group cursor-pointer">
                  Created Date <SortIcon column="created_at" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                </Link>
              </th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Inventory</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium text-right">Units sold</th>
              <th className="px-4 py-3 w-12">
                <span className="sr-only">Actions</span>
              </th>
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
                    <input
                      type="checkbox"
                      aria-label={`Select ${product.name}`}
                      checked={selectedIds.has(product.id)}
                      onChange={(e) => toggleItem(product.id, e.target.checked)}
                      className="w-4 h-4 rounded border-separator bg-surface text-brand-primary focus:ring-brand-primary cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl border border-separator bg-surface p-1 flex items-center justify-center font-bold text-sm shrink-0 text-brand-primary">
                        {product.image_urls && product.image_urls.length > 0 ? (
                          <div className="relative w-full h-full overflow-hidden rounded-lg">
                            <Image
                              src={product.image_urls[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </div>
                        ) : product.name ? (
                          product.name.substring(0, 2).toUpperCase()
                        ) : (
                          'UN'
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-body-sm font-semibold  truncate">{product.name}</div>
                        <div className="text-xs text-muted truncate">{generateSKU(product.name, product.id)}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-body-sm  truncate">{product.category?.name || 'Uncategorized'}</td>

                  <td className="px-4 py-3">
                    {product.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-caption font-semibold bg-emerald-500/10 text-emerald-600">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-caption font-semibold bg-orange-500/10 text-orange-600">
                        Archived
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-body-sm">
                    <StockBadge totalStock={totalStock} stockUnit={product.stock_unit} />
                  </td>

                  <td className="px-4 py-3 text-body-sm font-medium  tabular-nums">
                    {hasRange ? `From ${formatCurrency(minPrice)}` : formatCurrency(minPrice)}
                  </td>

                  <td className="px-4 py-3 text-body-sm  tabular-nums">{totalUnitsSold.toLocaleString()}</td>

                  <td className="px-4 py-3 text-right relative z-10">
                    <ProductsActionMenu productId={product.id} />
                  </td>
                </tr>
              );
            })}

            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={8} className="p-12 text-center">
                  <Package size={48} className="mx-auto mb-4 text-muted" />
                  <p className="font-medium">No products found</p>
                  <p className="text-sm mt-1">Get started by creating your first product.</p>
                  <Link
                    href="/dashboard/products/new"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-brand-primary-600 transition-colors"
                  >
                    Add Product
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>

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
                    <ChevronLeft size={16} />
                  </Link>
                ) : (
                  <button
                    className="p-1 rounded text-muted hover:text-brand-primary hover:bg-surface border border-transparent hover:border-separator transition-all"
                    disabled
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
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
                    <ChevronRight size={16} />
                  </Link>
                ) : (
                  <button
                    className="p-1 rounded text-muted hover:text-brand-primary hover:bg-surface border border-transparent hover:border-separator transition-all"
                    disabled
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-4 bg-surface-elevated/90 backdrop-blur-xl border border-separator/80 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)] rounded-full px-3 sm:px-4 py-2 w-max max-w-[calc(100vw-2rem)] overflow-x-auto hide-scrollbar"
          >
            <div className="flex items-center gap-2 pr-2 sm:pr-4 border-r border-separator shrink-0">
              <div className="flex items-center justify-center bg-brand-primary text-white text-xs font-bold w-6 h-6 rounded-full tabular-nums">
                {selectedIds.size}
              </div>
              <span className="hidden sm:inline text-sm font-semibold">Selected</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold  hover:text-primary hover:bg-surface/50 rounded-full transition-colors"
                title="Deselect"
              >
                <X size={14} />
                <span className="hidden sm:inline">Deselect</span>
              </button>
              <button
                onClick={handleBulkArchive}
                disabled={isUpdating}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold  hover:text-primary hover:bg-surface/50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Archive"
              >
                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
                <span className="hidden sm:inline">Archive</span>
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isUpdating}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete"
              >
                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
