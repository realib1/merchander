'use client';

import React from 'react';
import { Navigation } from 'lucide-react';

interface CheckoutAddressFieldsProps {
  deliveryAddress: string;
  gpsAddress: string;
  onDeliveryAddressChange: (val: string) => void;
  onGpsAddressChange: (val: string) => void;
}

export function CheckoutAddressFields({
  deliveryAddress,
  gpsAddress,
  onDeliveryAddressChange,
  onGpsAddressChange,
}: CheckoutAddressFieldsProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-foreground mb-1">
          Delivery Address & Landmark *
        </label>
        <input
          type="text"
          required
          placeholder="e.g. East Legon, near Shell Filling Station"
          value={deliveryAddress}
          onChange={(e) => onDeliveryAddressChange(e.target.value)}
          className="w-full text-xs rounded-xl bg-surface-elevated border border-separator px-3.5 py-2.5 text-foreground placeholder:text-muted/60 focus:ring-1 focus:ring-brand-primary focus:outline-none transition"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-foreground mb-1">
          GhanaPost GPS Digital Address <span className="font-normal text-[10px] text-muted">(Optional)</span>
        </label>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="e.g. GA-183-9024"
            value={gpsAddress}
            onChange={(e) => onGpsAddressChange(e.target.value.toUpperCase())}
            className="w-full text-xs font-mono uppercase rounded-xl bg-surface-elevated border border-separator px-3.5 py-2.5 pl-8 text-foreground placeholder:text-muted/60 focus:ring-1 focus:ring-brand-primary focus:outline-none transition"
          />
          <Navigation size={13} className="absolute left-2.5 text-muted shrink-0 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
