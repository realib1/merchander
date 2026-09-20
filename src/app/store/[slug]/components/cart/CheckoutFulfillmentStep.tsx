'use client';

import React from 'react';
import { Truck, Store, ArrowLeft, ArrowRight } from 'lucide-react';
import type { PickupBranchOption } from './CartCheckoutForm';
import { CheckoutBranchSelector } from './CheckoutBranchSelector';
import { CheckoutAddressFields } from './CheckoutAddressFields';

interface CheckoutFulfillmentStepProps {
  fulfillmentMode: 'delivery' | 'pickup';
  hasBranches: boolean;
  pickupBranches: PickupBranchOption[];
  selectedBranchId: string;
  deliveryAddress: string;
  gpsAddress: string;
  deliveryNotes: string;
  primaryColor: string;
  onFulfillmentModeChange: (mode: 'delivery' | 'pickup') => void;
  onSelectedBranchChange: (branchId: string) => void;
  onDeliveryAddressChange: (val: string) => void;
  onGpsAddressChange: (val: string) => void;
  onDeliveryNotesChange: (val: string) => void;
  onBack: () => void;
  onProceed: () => void;
}

export function CheckoutFulfillmentStep({
  fulfillmentMode,
  hasBranches,
  pickupBranches,
  selectedBranchId,
  deliveryAddress,
  gpsAddress,
  deliveryNotes,
  primaryColor,
  onFulfillmentModeChange,
  onSelectedBranchChange,
  onDeliveryAddressChange,
  onGpsAddressChange,
  onDeliveryNotesChange,
  onBack,
  onProceed,
}: CheckoutFulfillmentStepProps) {
  return (
    <div className="space-y-4 animate-scaleUp">
      <div className="border-b border-separator/70 pb-3">
        <h3 className="text-sm font-black text-foreground tracking-tight">Delivery & Fulfillment</h3>
        <p className="text-[11px] text-muted mt-0.5">Choose how you would like to receive your items.</p>
      </div>

      {hasBranches && (
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-elevated rounded-xl border border-separator">
          <button
            type="button"
            onClick={() => onFulfillmentModeChange('delivery')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              fulfillmentMode === 'delivery' ? 'bg-surface text-foreground shadow-xs' : 'text-muted hover:text-foreground'
            }`}
          >
            <Truck size={14} />
            <span>Doorstep Delivery</span>
          </button>
          <button
            type="button"
            onClick={() => onFulfillmentModeChange('pickup')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              fulfillmentMode === 'pickup' ? 'bg-surface text-foreground shadow-xs' : 'text-muted hover:text-foreground'
            }`}
          >
            <Store size={14} />
            <span>Store Pickup</span>
          </button>
        </div>
      )}

      {fulfillmentMode === 'pickup' && hasBranches ? (
        <CheckoutBranchSelector
          pickupBranches={pickupBranches}
          selectedBranchId={selectedBranchId}
          onSelectedBranchChange={onSelectedBranchChange}
        />
      ) : (
        <CheckoutAddressFields
          deliveryAddress={deliveryAddress}
          gpsAddress={gpsAddress}
          onDeliveryAddressChange={onDeliveryAddressChange}
          onGpsAddressChange={onGpsAddressChange}
        />
      )}

      <div>
        <label className="block text-xs font-bold text-foreground mb-1">
          Order Notes <span className="font-normal text-[10px] text-muted">(Optional)</span>
        </label>
        <textarea
          rows={2}
          placeholder="e.g. Call on arrival, leave at gate"
          value={deliveryNotes}
          onChange={(e) => onDeliveryNotesChange(e.target.value)}
          className="w-full text-xs rounded-xl bg-surface-elevated border border-separator px-3.5 py-2 text-foreground placeholder:text-muted/60 focus:ring-1 focus:ring-brand-primary focus:outline-none resize-none transition"
        />
      </div>

      <div className="pt-2 flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="py-3 px-4 rounded-xl border border-separator bg-surface text-foreground text-xs font-bold hover:bg-surface-elevated transition flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={onProceed}
          className="flex-1 py-3.5 px-4 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          <span>Continue to Payment</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
