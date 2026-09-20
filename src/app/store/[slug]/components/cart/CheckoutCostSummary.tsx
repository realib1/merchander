'use client';

import React from 'react';
import { formatCurrency } from '@/utils/format';

interface CheckoutCostSummaryProps {
  subtotal: number;
  currency: string;
  fulfillmentMode: 'delivery' | 'pickup';
  primaryColor: string;
}

export function CheckoutCostSummary({
  subtotal,
  currency,
  fulfillmentMode,
  primaryColor,
}: CheckoutCostSummaryProps) {
  return (
    <div className="p-3.5 rounded-2xl bg-surface-elevated/70 border border-separator/80 space-y-2 text-xs">
      <div className="flex justify-between items-center text-muted">
        <span>Subtotal</span>
        <span className="font-semibold text-foreground tabular-nums">{formatCurrency(subtotal, currency)}</span>
      </div>
      <div className="flex justify-between items-center text-muted">
        <span>Delivery</span>
        <span
          className={`font-semibold tabular-nums ${
            fulfillmentMode === 'pickup' ? 'text-emerald-500 font-bold' : 'text-foreground'
          }`}
        >
          {fulfillmentMode === 'pickup' ? 'Free (Pickup)' : 'Standard Delivery'}
        </span>
      </div>
      <div className="flex justify-between items-center text-muted">
        <span>Estimated Tax / VAT</span>
        <span className="font-semibold text-foreground tabular-nums">{formatCurrency(0, currency)}</span>
      </div>
      <div className="pt-2 border-t border-separator/70 flex justify-between items-center">
        <span className="font-bold text-sm text-foreground">Total</span>
        <span className="font-black text-base tabular-nums" style={{ color: primaryColor }}>
          {formatCurrency(subtotal, currency)}
        </span>
      </div>
    </div>
  );
}
