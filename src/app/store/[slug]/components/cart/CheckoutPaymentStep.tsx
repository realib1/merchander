'use client';

import React from 'react';
import { CreditCard, MessageCircle, Loader2, Clock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { CheckoutCostSummary } from './CheckoutCostSummary';
import { PAYMENT_METHODS } from './payment-methods';

interface CheckoutPaymentStepProps {
  paymentMethod: 'whatsapp' | 'mtn_momo' | 'cash_on_delivery';
  fulfillmentMode: 'delivery' | 'pickup';
  subtotal: number;
  currency: string;
  primaryColor: string;
  batchNames: string[];
  isPending: boolean;
  onPaymentMethodChange: (val: 'whatsapp' | 'mtn_momo' | 'cash_on_delivery') => void;
  onWhatsAppCheckout: () => void;
  onBack: () => void;
}

export function CheckoutPaymentStep({
  paymentMethod,
  fulfillmentMode,
  subtotal,
  currency,
  primaryColor,
  batchNames,
  isPending,
  onPaymentMethodChange,
  onWhatsAppCheckout,
  onBack,
}: CheckoutPaymentStepProps) {
  return (
    <div className="space-y-4 animate-scaleUp">
      <div className="border-b border-separator/70 pb-3">
        <h3 className="text-sm font-black text-foreground tracking-tight">Payment Method</h3>
        <p className="text-[11px] text-muted mt-0.5">Select how you would like to complete your payment.</p>
      </div>

      <div className="space-y-2.5">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = paymentMethod === method.id;
          const IconComponent = method.icon;

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onPaymentMethodChange(method.id)}
              className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                isSelected
                  ? 'bg-brand-primary/5 border-brand-primary ring-1 ring-brand-primary/50'
                  : 'bg-surface-elevated border-separator hover:border-separator/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-brand-primary text-white' : 'bg-surface border border-separator text-muted'
                  }`}
                  style={isSelected ? { backgroundColor: primaryColor } : undefined}
                >
                  <IconComponent size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{method.label}</p>
                  <p className="text-[11px] text-muted truncate">{method.subtitle}</p>
                </div>
              </div>

              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  isSelected ? 'border-brand-primary' : 'border-muted'
                }`}
              >
                {isSelected && (
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {batchNames.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2.5">
          <Clock size={15} className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-bold">You are joining: {batchNames.join(', ')}</p>
            <p className="text-[11px] opacity-85 mt-0.5">
              Goods will be procured from supplier when the batch closes. Delivery begins upon cargo arrival.
            </p>
          </div>
        </div>
      )}

      <CheckoutCostSummary
        subtotal={subtotal}
        currency={currency}
        fulfillmentMode={fulfillmentMode}
        primaryColor={primaryColor}
      />

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
        <ShieldCheck size={14} className="text-emerald-500" />
        <span>Your payment information is secure and encrypted.</span>
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

        {paymentMethod === 'whatsapp' ? (
          <button
            type="button"
            disabled={isPending}
            onClick={onWhatsAppCheckout}
            className="flex-1 py-3.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20ba59] active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
            <span>Checkout on WhatsApp</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-3.5 rounded-xl text-white text-xs font-bold hover:opacity-90 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
            <span>Place Order</span>
          </button>
        )}
      </div>
    </div>
  );
}
