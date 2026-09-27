'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { PackageCheck } from 'lucide-react';
import { OrderInventoryBehaviourSettings } from '@/types/settings';

interface OrderInventoryBehaviourCardProps {
  inventory: OrderInventoryBehaviourSettings;
  onChange: (updated: OrderInventoryBehaviourSettings) => void;
  disabled?: boolean;
}

export function OrderInventoryBehaviourCard({
  inventory,
  onChange,
  disabled = false,
}: OrderInventoryBehaviourCardProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <PackageCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display">Inventory & Stock Behaviour</CardTitle>
            <CardDescription className="text-xs text-muted">
              Define how order confirmation and cancellations interact with product stock levels.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-4 pt-0">
        {/* On Confirmation Stock Action */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">When an Order is Confirmed:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...inventory, onConfirmation: 'reserve_stock' })}
              disabled={disabled}
              className={`p-3 rounded-xl border text-left transition cursor-pointer space-y-1 ${
                inventory.onConfirmation === 'reserve_stock'
                  ? 'border-brand-primary bg-brand-primary/10 text-foreground ring-1 ring-brand-primary'
                  : 'border-separator bg-surface text-muted hover:text-foreground'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Reserve Stock</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-primary/20 text-brand-primary">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-muted">
                Hold stock in reserved inventory; only deduct permanently upon dispatch.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onChange({ ...inventory, onConfirmation: 'deduct_immediately' })}
              disabled={disabled}
              className={`p-3 rounded-xl border text-left transition cursor-pointer space-y-1 ${
                inventory.onConfirmation === 'deduct_immediately'
                  ? 'border-brand-primary bg-brand-primary/10 text-foreground ring-1 ring-brand-primary'
                  : 'border-separator bg-surface text-muted hover:text-foreground'
              }`}
            >
              <span className="text-xs font-bold text-foreground">Deduct Stock Immediately</span>
              <p className="text-[11px] text-muted">
                Directly reduce on-hand inventory the instant an order is confirmed.
              </p>
            </button>
          </div>
        </div>

        {/* On Cancellation Action */}
        <div
          onClick={() =>
            onChange({
              ...inventory,
              onCancellationReleaseStock: !inventory.onCancellationReleaseStock,
            })
          }
          className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
            inventory.onCancellationReleaseStock
              ? 'border-brand-primary bg-brand-primary/5 text-foreground'
              : 'border-separator bg-surface text-muted hover:text-foreground'
          }`}
        >
          <Checkbox
            checked={inventory.onCancellationReleaseStock}
            onCheckedChange={(c) => onChange({ ...inventory, onCancellationReleaseStock: c })}
            disabled={disabled}
            aria-label="Release stock on cancellation"
          />
          <div>
            <span className="text-foreground">Release reserved stock upon order cancellation</span>
            <p className="text-[11px] text-muted font-normal">
              Restores reserved quantities back to available storefront inventory automatically.
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
