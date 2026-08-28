'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface Store {
  id: string;
  name: string;
  location: string | null;
}

export interface VariantState {
  id: string;
  sku: string;
  name: string;
  price: number | '';
  costPrice?: number | '';
  inventory: Record<string, number>;
}

interface ProductVariantManagerProps {
  variants: VariantState[];
  stores: Store[];
  basePrice: number | '';
  baseCostPrice: number | '';
  onAddVariant: () => void;
  onRemoveVariant: (id: string) => void;
  onUpdateVariant: (id: string, field: keyof VariantState, value: VariantState[keyof VariantState]) => void;
  onUpdateVariantInventory: (variantId: string, storeId: string, quantity: number) => void;
}

export function ProductVariantManager({
  variants,
  stores,
  basePrice,
  baseCostPrice,
  onAddVariant,
  onRemoveVariant,
  onUpdateVariant,
  onUpdateVariantInventory,
}: ProductVariantManagerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{variants.length === 1 ? 'Pricing & Inventory' : 'Variants'}</CardTitle>
        <CardDescription>
          {variants.length === 1
            ? 'Set the base price, SKU, and available stock across your branches.'
            : 'Manage pricing and inventory for each product variation.'}
        </CardDescription>
      </CardHeader>
      <CardBody>
        <div className="space-y-6">
          {variants.map((variant, index) => (
            <div
              key={variant.id}
              className={`relative transition-all ${
                variants.length > 1
                  ? 'p-5 bg-surface-elevated border border-separator rounded-xl group hover:border-brand-primary'
                  : ''
              }`}
            >
              {variants.length > 1 && (
                <div className="flex justify-between items-center mb-5">
                  <h4 className="text-sm font-semibold">Variant {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => onRemoveVariant(variant.id)}
                    className="text-muted hover:text-red-500 p-1.5 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div
                className={`grid grid-cols-1 md:grid-cols-2 ${
                  variants.length > 1 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'
                } gap-5 mb-6`}
              >
                {/* Option Name (if multiple variants) */}
                {variants.length > 1 && (
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-body-sm font-medium">Option Name</label>
                    <input
                      type="text"
                      required
                      value={variant.name}
                      onChange={(e) => onUpdateVariant(variant.id, 'name', e.target.value)}
                      placeholder="e.g. Large"
                      className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted"
                    />
                  </div>
                )}

                {/* Price (if multiple variants) */}
                {variants.length > 1 && (
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-body-sm font-medium">Price (GHS)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">₵</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.price === '' ? '' : variant.price}
                        onChange={(e) =>
                          onUpdateVariant(variant.id, 'price', e.target.value === '' ? '' : parseFloat(e.target.value))
                        }
                        placeholder={basePrice === '' ? '0.00' : `Base: ₵${basePrice}`}
                        className="w-full pl-8 pr-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted"
                      />
                    </div>
                  </div>
                )}

                {/* Cost Price (if multiple variants) */}
                {variants.length > 1 && (
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-body-sm font-medium">Cost Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">₵</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.costPrice === '' || variant.costPrice === undefined ? '' : variant.costPrice}
                        onChange={(e) =>
                          onUpdateVariant(
                            variant.id,
                            'costPrice',
                            e.target.value === '' ? '' : parseFloat(e.target.value)
                          )
                        }
                        placeholder={baseCostPrice === '' ? '0.00' : `Base: ₵${baseCostPrice}`}
                        className="w-full pl-8 pr-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted"
                      />
                    </div>
                  </div>
                )}

                {/* SKU */}
                <div className="space-y-2 lg:col-span-1">
                  <label className="text-body-sm font-medium">SKU</label>
                  <input
                    type="text"
                    value={variant.sku}
                    onChange={(e) => onUpdateVariant(variant.id, 'sku', e.target.value)}
                    placeholder="e.g. KENTE-RED-L"
                    className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted uppercase"
                  />
                </div>
              </div>

              <div className={variants.length > 1 ? 'border-t border-separator pt-5' : ''}>
                <h5 className="text-body-sm font-medium mb-3">Available Inventory</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stores.map((store) => (
                    <div
                      key={store.id}
                      className="flex items-center justify-between p-3 bg-surface-elevated border border-separator rounded-lg"
                    >
                      <span className="text-sm font-medium truncate mr-3">{store.name}</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={variant.inventory[store.id] || ''}
                        onChange={(e) => onUpdateVariantInventory(variant.id, store.id, parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-surface border border-separator rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={onAddVariant}
            className="w-full h-11 border-dashed border-2 hover:bg-surface-elevated transition-colors hover:text-brand-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            {variants.length === 1 ? 'Add Options like Size or Color' : 'Add Another Variant'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
