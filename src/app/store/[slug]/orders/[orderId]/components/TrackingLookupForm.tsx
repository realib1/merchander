'use client';

import React from 'react';
import { Search, AlertCircle, Loader2 } from 'lucide-react';

interface TrackingLookupFormProps {
  orderIdOrShortId?: string;
  phoneInput: string;
  generalQuery: string;
  error?: string;
  isVerifying: boolean;
  primaryColor: string;
  onPhoneChange: (val: string) => void;
  onGeneralQueryChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function TrackingLookupForm({
  orderIdOrShortId,
  phoneInput,
  generalQuery,
  error,
  isVerifying,
  primaryColor,
  onPhoneChange,
  onGeneralQueryChange,
  onSubmit,
}: TrackingLookupFormProps) {
  const displayId =
    orderIdOrShortId && orderIdOrShortId.length > 12 ? orderIdOrShortId.slice(0, 8).toUpperCase() : orderIdOrShortId;

  return (
    <div className="max-w-md mx-auto bg-surface-elevated border border-separator rounded-3xl p-6 md:p-8 shadow-xl space-y-6 text-center">
      <div className="w-14 h-14 mx-auto rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
        <Search size={24} />
      </div>

      <div className="space-y-1">
        <h2 className="text-lg font-bold text-foreground">Track Your Order</h2>
        <p className="text-xs text-muted">
          {orderIdOrShortId ? (
            <>
              To protect customer privacy, please enter the Ghana phone number used when placing order{' '}
              <strong className="text-foreground">#{displayId}</strong>.
            </>
          ) : (
            'Enter your Order Number (e.g. 5YU4WH) or the Phone Number used at checkout to view live status.'
          )}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3 text-left">
        {orderIdOrShortId ? (
          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              placeholder="e.g. 024 123 4567"
              value={phoneInput}
              onChange={(e) => onPhoneChange(e.target.value)}
              className="w-full text-xs rounded-xl bg-surface border border-separator px-3 py-2.5 placeholder:text-muted/60 focus:ring-1 focus:ring-brand-primary focus:outline-none"
            />
          </div>
        ) : (
          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">Order Number or Phone *</label>
            <input
              type="text"
              required
              placeholder="e.g. 5YU4WH or 024 123 4567"
              value={generalQuery}
              onChange={(e) => onGeneralQueryChange(e.target.value)}
              className="w-full text-xs rounded-xl bg-surface border border-separator px-3 py-2.5 placeholder:text-muted/60 focus:ring-1 focus:ring-brand-primary focus:outline-none"
            />
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2 font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isVerifying || !(orderIdOrShortId ? phoneInput.trim() : generalQuery.trim())}
          className="w-full py-3 rounded-xl text-white text-xs font-bold shadow-md transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          <span>{orderIdOrShortId ? 'Unlock Order Status' : 'Track Order'}</span>
        </button>
      </form>
    </div>
  );
}
