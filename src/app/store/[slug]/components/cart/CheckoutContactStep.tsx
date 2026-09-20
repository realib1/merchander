'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface CheckoutContactStepProps {
  customerName: string;
  customerPhone: string;
  primaryColor: string;
  onCustomerNameChange: (val: string) => void;
  onCustomerPhoneChange: (val: string) => void;
  onProceed: () => void;
}

export function CheckoutContactStep({
  customerName,
  customerPhone,
  primaryColor,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onProceed,
}: CheckoutContactStepProps) {
  return (
    <div className="space-y-4 animate-scaleUp">
      <div className="border-b border-separator/70 pb-3">
        <h3 className="text-sm font-black text-foreground tracking-tight">Contact Information</h3>
        <p className="text-[11px] text-muted mt-0.5">
          We will use this to send order confirmations and delivery updates.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-foreground mb-1">Full Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Kwame Mensah"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="w-full text-xs rounded-xl bg-surface-elevated border border-separator px-3.5 py-2.5 text-foreground placeholder:text-muted/60 focus:ring-1 focus:ring-brand-primary focus:outline-none transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground mb-1">WhatsApp / Contact Phone *</label>
          <input
            type="tel"
            required
            placeholder="e.g. 024 123 4567"
            value={customerPhone}
            onChange={(e) => onCustomerPhoneChange(e.target.value)}
            className="w-full text-xs rounded-xl bg-surface-elevated border border-separator px-3.5 py-2.5 text-foreground placeholder:text-muted/60 focus:ring-1 focus:ring-brand-primary focus:outline-none transition"
          />
          <p className="text-[10px] text-muted mt-1">Order receipt and courier rider contact will be sent to this number.</p>
        </div>
      </div>

      <div className="pt-3">
        <button
          type="button"
          onClick={onProceed}
          className="w-full py-3.5 px-4 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          <span>Continue to Delivery</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
