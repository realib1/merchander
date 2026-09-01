'use client';

import React from 'react';
import { CreditCard, MessageCircle, Loader2, Truck, Store, MapPin, Navigation } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

export interface PickupBranchOption {
  id: string;
  name: string;
  street_address?: string | null;
  city?: string | null;
  landmark?: string | null;
  digital_address?: string | null;
  phone?: string | null;
}

interface CartCheckoutFormProps {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  gpsAddress: string;
  deliveryNotes: string;
  fulfillmentMode: 'delivery' | 'pickup';
  pickupBranches: PickupBranchOption[];
  selectedBranchId: string;
  paymentMethod: 'whatsapp' | 'mtn_momo' | 'cash_on_delivery';
  subtotal: number;
  currency: string;
  primaryColor?: string;
  isPending: boolean;
  onCustomerNameChange: (val: string) => void;
  onCustomerPhoneChange: (val: string) => void;
  onDeliveryAddressChange: (val: string) => void;
  onGpsAddressChange: (val: string) => void;
  onDeliveryNotesChange: (val: string) => void;
  onFulfillmentModeChange: (mode: 'delivery' | 'pickup') => void;
  onSelectedBranchChange: (branchId: string) => void;
  onPaymentMethodChange: (val: 'whatsapp' | 'mtn_momo' | 'cash_on_delivery') => void;
  onWhatsAppCheckout: () => void;
  onDirectCheckout: (e: React.FormEvent) => void;
}

export function CartCheckoutForm({
  customerName,
  customerPhone,
  deliveryAddress,
  gpsAddress,
  deliveryNotes,
  fulfillmentMode,
  pickupBranches = [],
  selectedBranchId,
  paymentMethod,
  subtotal,
  currency,
  primaryColor = '#3b82f6',
  isPending,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onDeliveryAddressChange,
  onGpsAddressChange,
  onDeliveryNotesChange,
  onFulfillmentModeChange,
  onSelectedBranchChange,
  onPaymentMethodChange,
  onWhatsAppCheckout,
  onDirectCheckout,
}: CartCheckoutFormProps) {
  const hasBranches = pickupBranches.length > 0;

  return (
    <form onSubmit={onDirectCheckout} className="space-y-4 pt-3 border-t border-separator/60">
      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Customer &amp; Fulfillment Details</h3>

      {/* Fulfillment Mode Switcher */}
      {hasBranches && (
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-elevated rounded-xl border border-separator">
          <button
            type="button"
            onClick={() => onFulfillmentModeChange('delivery')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              fulfillmentMode === 'delivery'
                ? 'bg-surface text-foreground shadow-xs'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Truck size={13} />
            <span>Delivery</span>
          </button>

          <button
            type="button"
            onClick={() => onFulfillmentModeChange('pickup')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              fulfillmentMode === 'pickup' ? 'bg-surface text-foreground shadow-xs' : 'text-muted hover:text-foreground'
            }`}
          >
            <Store size={13} />
            <span>Store Pickup</span>
          </button>
        </div>
      )}

      <div className="space-y-2.5">
        <div>
          <label className="block text-[11px] font-semibold text-muted mb-1">Your Full Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Kwame Mensah"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="w-full text-xs rounded-xl bg-surface-elevated border border-separator px-3 py-2 placeholder:text-muted/60 focus:ring-1 focus:ring-brand-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-muted mb-1">WhatsApp / Contact Phone *</label>
          <input
            type="tel"
            required
            placeholder="e.g. 024 123 4567"
            value={customerPhone}
            onChange={(e) => onCustomerPhoneChange(e.target.value)}
            className="w-full text-xs rounded-xl bg-surface-elevated border border-separator px-3 py-2 placeholder:text-muted/60 focus:ring-1 focus:ring-brand-primary focus:outline-none"
          />
        </div>

        {/* Fulfillment branch selection or delivery address + GPS */}
        {fulfillmentMode === 'pickup' && hasBranches ? (
          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">Select Pickup Branch *</label>
            <div className="space-y-1.5">
              {pickupBranches.map((b) => {
                const isSelected = selectedBranchId === b.id || (!selectedBranchId && b === pickupBranches[0]);
                const addressStr = [b.street_address, b.landmark, b.city].filter(Boolean).join(', ');
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onSelectedBranchChange(b.id)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
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
                      <p className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="shrink-0" /> {addressStr}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Delivery Address &amp; Landmark *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. East Legon, near Shell Filling Station"
                value={deliveryAddress}
                onChange={(e) => onDeliveryAddressChange(e.target.value)}
                className="w-full text-xs rounded-xl bg-surface-elevated border border-separator px-3 py-2 placeholder:text-muted/60 focus:ring-1 focus:ring-brand-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                GhanaPost GPS Digital Address <span className="font-normal text-[10px] text-muted/80">(Optional)</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="e.g. GA-183-9024"
                  value={gpsAddress}
                  onChange={(e) => onGpsAddressChange(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono uppercase rounded-xl bg-surface-elevated border border-separator px-3 py-2 pl-8 placeholder:text-muted/60 focus:ring-1 focus:ring-brand-primary focus:outline-none"
                />
                <Navigation size={13} className="absolute left-2.5 text-muted shrink-0 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-semibold text-muted mb-1">Order Notes (Optional)</label>
          <textarea
            rows={2}
            placeholder="Any special instructions or delivery landmarks..."
            value={deliveryNotes}
            onChange={(e) => onDeliveryNotesChange(e.target.value)}
            className="w-full text-xs rounded-xl bg-surface-elevated border border-separator px-3 py-2 placeholder:text-muted/60 focus:ring-1 focus:ring-brand-primary focus:outline-none resize-none"
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
                    ? 'text-white shadow-xs'
                    : 'bg-surface-elevated border-separator text-muted hover:text-foreground'
                }`}
                style={
                  paymentMethod === method.id ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined
                }
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Itemized Cost Breakdown */}
      <div className="p-3.5 rounded-2xl bg-surface-elevated/70 border border-separator/80 space-y-2 text-xs">
        <div className="flex justify-between items-center text-muted">
          <span>Subtotal</span>
          <span className="font-semibold text-foreground tabular-nums">{formatCurrency(subtotal, currency)}</span>
        </div>

        <div className="flex justify-between items-center text-muted">
          <span>Delivery</span>
          <span
            className={`font-semibold tabular-nums ${fulfillmentMode === 'pickup' ? 'text-emerald-500 font-bold' : 'text-foreground'}`}
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

      {/* Action Buttons (Without embedded price) */}
      <div className="pt-1 space-y-2">
        {paymentMethod === 'whatsapp' ? (
          <button
            type="button"
            disabled={isPending}
            onClick={onWhatsAppCheckout}
            className="w-full py-3.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20ba59] transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
            <span>Checkout on WhatsApp</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 rounded-xl text-white text-xs font-bold hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
            <span>Place Order</span>
          </button>
        )}
      </div>
    </form>
  );
}
