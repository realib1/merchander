'use client';

import { useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Package, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { bulkArchiveProducts, bulkDeleteProducts } from '@/app/actions/products-mutations';
import Link from 'next/link';
import type { Product } from '@/types/product';
import { ProductsTableRow, StockBadge } from './ProductsTableRow';
import { ProductsPagination } from './ProductsPagination';
import { ProductsBulkActionBar } from './ProductsBulkActionBar';

export { StockBadge };

function SortIcon({
  column,
  currentSortBy,
  currentSortOrder,
}: {
  column: string;
  currentSortBy: string;
  currentSortOrder: string;
}) {
  if (currentSortBy !== column)
    return (
      <ArrowUpDown className="w-3 h-3 ml-1 inline text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
    );
  return currentSortOrder === 'asc' ? (
    <ArrowUp className="w-3 h-3 ml-1 inline text-foreground" />
  ) : (
    <ArrowDown className="w-3 h-3 ml-1 inline text-foreground" />
  );
}

interface ProductsTableProps {
  initialProducts: Product[];
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
}

export function ProductsTable({
  initialProducts,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
}: ProductsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [optimisticOverrides, setOptimisticOverrides] = useState<{
    archived: Set<string>;
    deleted: Set<string>;
  }>({ archived: new Set(), deleted: new Set() });
  const [isUpdating, setIsUpdating] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const products = initialProducts
    .filter((p) => !optimisticOverrides.deleted.has(p.id))
    .map((p) => (optimisticOverrides.archived.has(p.id) ? { ...p, is_active: false } : p));

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
      setOptimisticOverrides((prev) => ({
        ...prev,
        archived: new Set([...prev.archived, ...selectedIds]),
      }));
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
      setOptimisticOverrides((prev) => ({
        ...prev,
        deleted: new Set([...prev.deleted, ...selectedIds]),
      }));
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
    const sortBy = params.get('sortBy') || 'created_at';
    const sortOrder = params.get('sortOrder') || 'desc';

    if (sortBy === column) {
      params.set('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc');
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
                  Created Date{' '}
                  <SortIcon column="created_at" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
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
            {products.map((product) => (
              <ProductsTableRow
                key={product.id}
                product={product}
                isSelected={selectedIds.has(product.id)}
                onToggleSelect={(checked) => toggleItem(product.id, checked)}
              />
            ))}

            {products.length === 0 && (
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

        <ProductsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          createPageUrl={createPageUrl}
        />
      </div>

      <ProductsBulkActionBar
        selectedCount={selectedIds.size}
        isUpdating={isUpdating}
        onDeselectAll={() => setSelectedIds(new Set())}
        onBulkArchive={handleBulkArchive}
        onBulkDelete={handleBulkDelete}
      />
    </div>
  );
}
