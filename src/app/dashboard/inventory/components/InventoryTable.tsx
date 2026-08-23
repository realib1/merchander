'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import Image from 'next/image';
import { AdjustStockModal } from './AdjustStockModal';

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

export function InventoryTable({ rows }: { rows: InventoryRowData[] }) {
  const [editingStockId, setEditingStockId] = useState<string | null>(null);

  return (
    <>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left whitespace-nowrap min-w-200">
          <thead>
            <tr className="text-xs font-semibold text-secondary bg-surface-elevated/30 border-b border-separator">
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Inventory value</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {rows.map((row) => {
              const displayName = row.name ? `${row.productName} - ${row.name}` : row.productName;
              const initials = row.productName.substring(0, 2).toUpperCase();
              
              let statusColor = "text-brand-primary bg-brand-primary/10";
              let statusText = "In stock";
              if (row.quantity === 0) {
                statusColor = "text-destructive bg-destructive/10";
                statusText = "Out of stock";
              } else if (row.quantity < 10) {
                statusColor = "text-warning bg-warning/10";
                statusText = "Low stock";
              }

              const uniqueRowId = `${row.variantId}-${row.storeId || 'unassigned'}`;

              return (
                <tr key={uniqueRowId} className="hover:bg-surface-elevated/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl border border-separator bg-surface p-1 flex items-center justify-center font-bold text-sm shrink-0 text-brand-primary">
                        {row.imageUrls && row.imageUrls.length > 0 ? (
                          <div className="relative w-full h-full overflow-hidden rounded-lg">
                            <Image src={row.imageUrls[0]} alt={row.productName} fill className="object-cover" sizes="32px" />
                          </div>
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-primary text-sm truncate">{displayName}</div>
                        <div className="text-xs text-muted mt-0.5 truncate">{row.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {row.categoryName}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-primary">
                      {row.quantity} <span className="text-muted font-normal">units</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${statusColor}`}>
                      {statusText}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-primary text-right tabular-nums">
                    {formatCurrency(row.price * row.quantity)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setEditingStockId(uniqueRowId)}
                      className="px-4 py-1.5 border border-separator rounded-full text-xs font-semibold text-primary hover:bg-surface-elevated transition-colors shadow-sm"
                    >
                      Adjust stock
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-secondary">
                  <Package size={48} className="mx-auto mb-4 text-muted" />
                  <p className="font-medium text-primary">No inventory matching criteria</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-separator bg-surface-elevated/20 flex items-center justify-between text-sm">
        <div className="text-secondary">
          Showing <span className="font-semibold text-primary">{rows.length}</span> products
        </div>
        <div className="text-secondary">
          Total inventory value: <span className="font-semibold text-primary tabular-nums">{formatCurrency(rows.reduce((acc, row) => acc + (row.price * row.quantity), 0))}</span>
        </div>
      </div>

      {editingStockId && (
        <AdjustStockModal
          isOpen={!!editingStockId}
          onClose={() => setEditingStockId(null)}
          variantId={rows.find(r => `${r.variantId}-${r.storeId || 'unassigned'}` === editingStockId)?.variantId || ''}
          storeId={rows.find(r => `${r.variantId}-${r.storeId || 'unassigned'}` === editingStockId)?.storeId || null}
          productName={rows.find(r => `${r.variantId}-${r.storeId || 'unassigned'}` === editingStockId)?.productName || ''}
          sku={rows.find(r => `${r.variantId}-${r.storeId || 'unassigned'}` === editingStockId)?.sku || ''}
          currentQuantity={rows.find(r => `${r.variantId}-${r.storeId || 'unassigned'}` === editingStockId)?.quantity || 0}
        />
      )}
    </>
  );
}
