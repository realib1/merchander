'use client';

import { CreditCard, MessageCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface CartCheckoutFormProps {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryNotes: string;
  paymentMethod: 'whatsapp' | 'mtn_momo' | 'cash_on_delivery';
  subtotal: number;
  currency: string;
  isPending: boolean;
  onCustomerNameChange: (val: string) => void;
  onCustomerPhoneChange: (val: string) => void;
  onDeliveryAddressChange: (val: string) => void;
  onDeliveryNotesChange: (val: string) => void;
  onPaymentMethodChange: (val: 'whatsapp' | 'mtn_momo' | 'cash_on_delivery') => void;
  onWhatsAppCheckout: () => void;
  onDirectCheckout: (e: React.FormEvent) => void;
}

export function CartCheckoutForm({
  customerName,
  customerPhone,
  deliveryAddress,
  deliveryNotes,
  paymentMethod,
  subtotal,
  currency,
  isPending,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onDeliveryAddressChange,
  onDeliveryNotesChange,
  onPaymentMethodChange,
  onWhatsAppCheckout,
  onDirectCheckout,
}: CartCheckoutFormProps) {
  return (
    <form onSubmit={onDirectCheckout} className="space-y-3 pt-3 border-t border-separator/60">
      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Customer & Delivery Details</h3>

      <div className="space-y-2">
        <div>
          <label className="block text-[11px] font-semibold text-muted mb-1">Your Full Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Kwame Mensah"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="w-full text-xs rounded-xl bg-surface-elevated border border-separator px-3 py-2 text-foreground placeholder:text-muted/60 focus:ring-1 focus:ring-brand-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-muted mb-1">WhatsApp / Mobile Phone *</label>
          <input
            type="tel"
            required
            placeholder="e.g. 024 123 4567"
            value={customerPhone}
            onChange={(e) => onCustomerPhoneChange(e.target.value)}
            className="w-full text-xs rounded-xl bg-surface-elevated border border-separator px-3 py-2 text-foreground placeholder:text-muted/60 focus:ring-1 focus:ring-brand-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-muted mb-1">Delivery Address / Landmark</label>
          <input
            type="text"
            placeholder="e.g. East Legon, near Shell"
            value={deliveryAddress}
            onChange={(e) => onDeliveryAddressChange(e.target.value)}
            className="w-full text-xs rounded-xl bg-surface-elevated border border-separator px-3 py-2 text-foreground placeholder:text-muted/60 focus:ring-1 focus:ring-brand-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-muted mb-1">Order Notes (Optional)</label>
          <textarea
            rows={2}
            placeholder="Any special instructions or questions..."
            value={deliveryNotes}
            onChange={(e) => onDeliveryNotesChange(e.target.value)}
            className="w-full text-xs rounded-xl bg-surface-elevated border border-separator px-3 py-2 text-foreground placeholder:text-muted/60 focus:ring-1 focus:ring-brand-primary focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-muted mb-1.5">Payment Method</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'whatsapp', label: 'WhatsApp' },
              { id: 'mtn_momo', label: 'MoMo' },
              { id: 'cash_on_delivery', label: 'COD' },
            ].map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => onPaymentMethodChange(method.id as 'whatsapp' | 'mtn_momo' | 'cash_on_delivery')}
                className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer text-center ${
                  paymentMethod === method.id
                    ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                    : 'bg-surface-elevated border-separator text-muted hover:text-foreground'
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Checkout Action Buttons */}
      <div className="pt-2 space-y-2">
        {paymentMethod === 'whatsapp' ? (
          <button
            type="button"
            disabled={isPending}
            onClick={onWhatsAppCheckout}
            className="w-full py-3 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20ba59] transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
            <span>Checkout on WhatsApp ({formatCurrency(subtotal, currency)})</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary/90 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
            <span>Place Order ({formatCurrency(subtotal, currency)})</span>
          </button>
        )}
      </div>
    </form>
  );
}
