'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody, CardDescription } from '@/components/ui/Card';
import { Trash2, Package, Search, Barcode } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { Variant, LineItem } from './types';

interface GlobalProductSearchProps {
  variants: Variant[];
  onSelect: (variantId: string) => void;
}

function GlobalProductSearch({ variants, onSelect }: GlobalProductSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered =
    search.length > 0
      ? variants.filter((v) => {
          const target = `${v.product_name} ${v.name || ''} ${v.sku}`.toLowerCase();
          const searchTerms = search.toLowerCase().trim().split(/\s+/);
          return searchTerms.every((term) => target.includes(term));
        })
      : [];

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted" />
        </div>
        <input
          type="text"
          className="w-full rounded-xl border border-separator bg-surface text-sm pl-10 pr-10 py-2.5 focus:ring-brand-primary outline-none transition-shadow placeholder:text-muted"
          placeholder="Search or scan barcode..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value.length > 0) setIsOpen(true);
            else setIsOpen(false);
          }}
          onFocus={() => {
            if (search.length > 0) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (filtered.length > 0) {
                onSelect(filtered[0].id);
                setIsOpen(false);
                setSearch('');
              }
            }
          }}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Barcode className="h-5 w-5 text-muted" />
        </div>
        {isOpen && search.length > 0 && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute z-50 w-full mt-1 bg-surface-elevated border border-separator rounded-xl shadow-lg overflow-hidden max-h-96 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-4 text-sm text-muted text-center">No products found</div>
              ) : (
                filtered.map((v) => (
                  <div
                    key={v.id}
                    className="px-4 py-3 border-b border-separator/50 hover:bg-surface cursor-pointer flex items-center gap-3 last:border-0"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      onSelect(v.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                  >
                    <div className="w-8 h-8 shrink-0 bg-surface-elevated rounded border border-separator flex items-center justify-center overflow-hidden">
                      <Package className="w-4 h-4 text-muted opacity-50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold  truncate">
                        {v.product_name} {v.name ? `- ${v.name}` : ''}
                      </div>
                      <div className="text-xs">{formatCurrency(v.price)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface OrderItemsPickerProps {
  variants: Variant[];
  items: LineItem[];
  onAddProduct: (variantId: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
}

export function OrderItemsPicker({
  variants,
  items,
  onAddProduct,
  onUpdateQuantity,
  onRemoveItem,
}: OrderItemsPickerProps) {
  return (
    <Card className="relative z-20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>Select products and quantities.</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <GlobalProductSearch variants={variants} onSelect={onAddProduct} />

        <div className="space-y-3 mt-2">
          {items.length === 0 ? (
            <div className="text-center p-8 bg-surface-elevated rounded-xl border border-dashed border-separator">
              <p className="text-muted text-sm">No items added yet. Search above to add products.</p>
            </div>
          ) : (
            items.map((item) => {
              const variant = variants.find((v) => v.id === item.variantId);
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-surface-elevated rounded-xl border border-separator"
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
                    <div className="w-12 h-12 shrink-0 bg-surface rounded-lg border border-separator flex items-center justify-center overflow-hidden">
                      <Package className="w-5 h-5 text-muted opacity-50" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold  truncate">
                        {variant?.product_name} {variant?.name ? `- ${variant.name}` : ''}
                      </h4>
                      <p className="text-xs  mt-0.5">{formatCurrency(item.unitPrice)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                    <div className="w-24 shrink-0">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-full rounded-lg border border-separator bg-surface text-sm px-3 py-2 outline-none text-center"
                      />
                    </div>

                    <div className="flex-1 sm:w-24 text-right">
                      <span className="font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="p-2 -mr-2 text-muted hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardBody>
    </Card>
  );
}
