'use client';

import React from 'react';
import { Navigation, MapPin } from 'lucide-react';
import type { PickupBranchOption } from './CartCheckoutForm';

interface CheckoutBranchSelectorProps {
  pickupBranches: PickupBranchOption[];
  selectedBranchId: string;
  onSelectedBranchChange: (branchId: string) => void;
}

export function CheckoutBranchSelector({
  pickupBranches,
  selectedBranchId,
  onSelectedBranchChange,
}: CheckoutBranchSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-foreground">Select Pickup Branch *</label>
      <div className="space-y-2">
        {pickupBranches.map((b) => {
          const isSelected = selectedBranchId === b.id || (!selectedBranchId && b === pickupBranches[0]);
          const addressStr = [b.street_address, b.landmark, b.city].filter(Boolean).join(', ');
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelectedBranchChange(b.id)}
              className={`w-full p-3 rounded-xl border text-left text-xs transition cursor-pointer ${
                isSelected
                  ? 'bg-brand-primary/5 border-brand-primary ring-1 ring-brand-primary/50'
                  : 'bg-surface-elevated border-separator hover:border-separator/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{b.name}</span>
                {b.digital_address && (
                  <span className="text-[10px] font-mono text-brand-primary flex items-center gap-0.5">
                    <Navigation size={10} /> {b.digital_address}
                  </span>
                )}
              </div>
              {addressStr && (
                <p className="text-[11px] text-muted flex items-center gap-1 mt-1">
                  <MapPin size={11} className="shrink-0" /> {addressStr}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
