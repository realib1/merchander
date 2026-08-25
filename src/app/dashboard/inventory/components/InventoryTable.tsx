'use client';

import { useState } from 'react';
import { Package, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import Image from 'next/image';
import { AdjustStockModal } from './AdjustStockModal';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export interface InventoryRowData {
  variantId: string;
  sku: string;
  name: string;
  price: number;
  productName: string;
  imageUrls: string[];
  categoryName: string;
  quantity: number;
  storeId: string | null;
  storeName: string;
}

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

export function InventoryTable({
  rows,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
}: {
  rows: InventoryRowData[];
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
}) {
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const createSortUrl = (column: string) => {
    const params = new URLSearchParams(searchParams);
    const currentSortBy = params.get('sortBy') || 'product_name';
    const currentSortOrder = params.get('sortOrder') || 'asc';

    if (currentSortBy === column) {
      params.set('sortOrder', currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sortBy', column);
      params.set('sortOrder', 'asc');
    }

    return `${pathname}?${params.toString()}`;
  };

  const currentSortBy = searchParams.get('sortBy') || 'product_name';
  const currentSortOrder = searchParams.get('sortOrder') || 'asc';

  return (
    <>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left whitespace-nowrap min-w-200">
          <thead>
            <tr className="text-xs font-semibold  bg-surface-elevated/30 border-b border-separator">
              <th className="px-6 py-4">
                <Link href={createSortUrl('product_name')} className="flex items-center group cursor-pointer">
                  Product{' '}
                  <SortIcon column="product_name" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                </Link>
              </th>
              <th className="px-6 py-4">
                <Link href={createSortUrl('category_name')} className="flex items-center group cursor-pointer">
                  Category{' '}
                  <SortIcon column="category_name" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                </Link>
              </th>
              <th className="px-6 py-4">
                <Link href={createSortUrl('quantity')} className="flex items-center group cursor-pointer">
                  Stock <SortIcon column="quantity" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                </Link>
              </th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">
                <Link href={createSortUrl('price')} className="flex items-center justify-end group cursor-pointer">
                  Inventory value{' '}
                  <SortIcon column="price" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                </Link>
              </th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {rows.map((row) => {
              const displayName = row.name ? `${row.productName} - ${row.name}` : row.productName;
              const initials = row.productName.substring(0, 2).toUpperCase();

              let statusColor = 'text-brand-primary bg-brand-primary/10';
              let statusText = 'In stock';
              if (row.quantity === 0) {
                statusColor = 'text-destructive bg-destructive/10';
                statusText = 'Out of stock';
              } else if (row.quantity < 10) {
                statusColor = 'text-warning bg-warning/10';
                statusText = 'Low stock';
              }

              const uniqueRowId = `${row.variantId}-${row.storeId || 'unassigned'}`;

              return (
                <tr key={uniqueRowId} className="hover:bg-surface-elevated/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl border border-separator bg-surface p-1 flex items-center justify-center font-bold text-sm shrink-0 text-brand-primary">
                        {row.imageUrls && row.imageUrls.length > 0 ? (
                          <div className="relative w-full h-full overflow-hidden rounded-lg">
                            <Image
                              src={row.imageUrls[0]}
                              alt={row.productName}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </div>
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold  text-sm truncate">{displayName}</div>
                        <div className="text-xs text-muted mt-0.5 truncate">{row.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{row.categoryName}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold">
                      {row.quantity} <span className="text-muted font-normal">units</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${statusColor}`}>
                      {statusText}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold  text-right tabular-nums">
                    {formatCurrency(row.price * row.quantity)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setEditingStockId(uniqueRowId)}
                      className="px-4 py-1.5 border border-separator rounded-full text-xs font-semibold  hover:bg-surface-elevated transition-colors shadow-sm"
                    >
                      Adjust stock
                    </button>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Package size={48} className="mx-auto mb-4 text-muted" />
                  <p className="font-medium">No inventory matching criteria</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-separator bg-surface-elevated/20 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div>
            Showing{' '}
            <span className="font-semibold">
              {Math.min((currentPage - 1) * 15 + 1, totalCount)}-{Math.min(currentPage * 15, totalCount)}
            </span>{' '}
            of <span className="font-semibold">{totalCount}</span> variants
          </div>
          <div className="text-muted border-l border-separator pl-4">
            Total page value:{' '}
            <span className="font-semibold text-foreground tabular-nums">
              {formatCurrency(rows.reduce((acc, row) => acc + row.price * row.quantity, 0))}
            </span>
          </div>
        </div>

        {totalCount > 0 && (
          <div className="flex gap-2">
            {currentPage > 1 ? (
              <Link
                href={createPageUrl(currentPage - 1)}
                className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface transition-colors"
              >
                Previous
              </Link>
            ) : (
              <button
                disabled
                className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface transition-colors disabled:opacity-50"
              >
                Previous
              </button>
            )}

            {currentPage < totalPages ? (
              <Link
                href={createPageUrl(currentPage + 1)}
                className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface transition-colors"
              >
                Next
              </Link>
            ) : (
              <button
                disabled
                className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface transition-colors disabled:opacity-50"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>

      {editingStockId && (
        <AdjustStockModal
          isOpen={!!editingStockId}
          onClose={() => setEditingStockId(null)}
          variantId={
            rows.find((r) => `${r.variantId}-${r.storeId || 'unassigned'}` === editingStockId)?.variantId || ''
          }
          storeId={rows.find((r) => `${r.variantId}-${r.storeId || 'unassigned'}` === editingStockId)?.storeId || null}
          productName={
            rows.find((r) => `${r.variantId}-${r.storeId || 'unassigned'}` === editingStockId)?.productName || ''
          }
          sku={rows.find((r) => `${r.variantId}-${r.storeId || 'unassigned'}` === editingStockId)?.sku || ''}
          currentQuantity={
            rows.find((r) => `${r.variantId}-${r.storeId || 'unassigned'}` === editingStockId)?.quantity || 0
          }
        />
      )}
    </>
  );
}
