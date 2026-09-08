'use client';

import React, { useState, useTransition } from 'react';
import { Truck, Store, X, Loader2, Bike, Send, User, Phone, FileText } from 'lucide-react';
import { assignOrderRiderAction } from '@/app/actions/fulfilment';
import { OrderFulfillmentMode } from '@/types/fulfilment';
import { WaybillOrder } from '@/utils/waybill';
import { toast } from 'sonner';

interface OrderDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    short_id?: string;
    customer?: { name: string; phone: string } | null;
    delivery_address?: string;
    delivery_fee?: number;
    total_amount?: number;
    status: string;
    store?: { name: string } | null;
    items?: Array<{ name?: string; variantName?: string; price?: number; quantity?: number }>;
  } | null;
  onSuccess?: (waybillOrder: WaybillOrder) => void;
}

const COURIER_PRESETS = ['Yango Delivery', 'Bolt Send', 'In-House Motor Rider', 'VIP / STC Bus Parcel'];

export function OrderDispatchModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: OrderDispatchModalProps) {
  const [isPending, startTransition] = useTransition();

  const [fulfillmentMode, setFulfillmentMode] = useState<OrderFulfillmentMode>('delivery');
  const [courierName, setCourierName] = useState('In-House Motor Rider');
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [pickupBranch, setPickupBranch] = useState(order?.store?.name || 'Main Branch');

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (fulfillmentMode === 'delivery' && !riderName.trim() && !courierName.trim()) {
      toast.error('Please specify a rider name or courier service');
      return;
    }

    startTransition(async () => {
      const res = await assignOrderRiderAction({
        orderId: order.id,
        fulfillmentMode,
        riderName: riderName.trim() || undefined,
        riderPhone: riderPhone.trim() || undefined,
        courierName: courierName.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
        dispatchNotes: dispatchNotes.trim() || undefined,
      });

      if (!res.success) {
        toast.error(res.error || 'Failed to dispatch order');
        return;
      }

      toast.success('Order dispatched successfully! Customer notified via WhatsApp.');

      // Construct WaybillOrder for instant preview in WaybillSlipModal
      const waybillOrder: WaybillOrder = {
        orderId: order.id,
        shortId: order.short_id || order.id.slice(0, 8).toUpperCase(),
        storeName: order.store?.name || 'Our Store',
        customerName: order.customer?.name || 'Valued Customer',
        customerPhone: order.customer?.phone || '',
        fulfillmentMode,
        deliveryAddress: order.delivery_address || '',
        pickupStoreName: pickupBranch,
        items: (order.items || []).map((it) => ({
          name: it.name || 'Item',
          variantName: it.variantName,
          price: it.price || 0,
          quantity: it.quantity || 1,
        })),
        deliveryFee: order.delivery_fee || 0,
        totalAmount: order.total_amount || 0,
        paymentStatus: order.status,
        riderName: riderName.trim() || undefined,
        riderPhone: riderPhone.trim() || undefined,
        courierName: courierName.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
        dispatchNotes: dispatchNotes.trim() || undefined,
      };

      onClose();
      if (onSuccess) {
        onSuccess(waybillOrder);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-surface border border-separator rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-separator bg-surface-elevated/40">
          <div>
            <h2 className="text-base font-bold text-foreground font-display flex items-center gap-2">
              <Truck size={18} className="text-brand-primary" />
              Dispatch Order
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary font-semibold">
                #{order.short_id || order.id.slice(0, 8).toUpperCase()}
              </span>
            </h2>
            <p className="text-xs text-muted mt-0.5">Assign a rider, update status, and generate waybill</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface-elevated transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Fulfilment Mode Toggle */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Fulfilment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFulfillmentMode('delivery')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  fulfillmentMode === 'delivery'
                    ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                    : 'border-separator bg-surface-elevated/30 text-muted hover:text-foreground'
                }`}
              >
                <Bike size={16} />
                <span>Rider Delivery</span>
              </button>
              <button
                type="button"
                onClick={() => setFulfillmentMode('pickup')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  fulfillmentMode === 'pickup'
                    ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                    : 'border-separator bg-surface-elevated/30 text-muted hover:text-foreground'
                }`}
              >
                <Store size={16} />
                <span>Store Pickup</span>
              </button>
            </div>
          </div>

          {fulfillmentMode === 'delivery' ? (
            <>
              {/* Courier Presets */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Courier / Dispatch Service
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COURIER_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCourierName(p)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                        courierName === p
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-semibold'
                          : 'border-separator text-muted hover:text-foreground'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. Yango Delivery, Bolt, Swift Wheels"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-separator bg-surface text-foreground placeholder:text-muted/60 focus:outline-none focus:border-brand-primary"
                />
              </div>

              {/* Rider Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    <User size={12} className="inline mr-1 text-muted" />
                    Rider Name
                  </label>
                  <input
                    type="text"
                    value={riderName}
                    onChange={(e) => setRiderName(e.target.value)}
                    placeholder="e.g. Kwesi Manu"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-separator bg-surface text-foreground placeholder:text-muted/60 focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    <Phone size={12} className="inline mr-1 text-muted" />
                    Rider Phone
                  </label>
                  <input
                    type="tel"
                    value={riderPhone}
                    onChange={(e) => setRiderPhone(e.target.value)}
                    placeholder="024 411 2233"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-separator bg-surface text-foreground placeholder:text-muted/60 focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
              </div>

              {/* Tracking Reference & Dispatch Notes */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Waybill / Tracking Reference <span className="text-muted text-[11px]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. YNG-98124 or STC-KMS-004"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-separator bg-surface text-foreground placeholder:text-muted/60 focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    <FileText size={12} className="inline mr-1 text-muted" />
                    Delivery Notes for Rider <span className="text-muted text-[11px]">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={dispatchNotes}
                    onChange={(e) => setDispatchNotes(e.target.value)}
                    placeholder="e.g. Call before arrival, white gate next to shell station"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-separator bg-surface text-foreground placeholder:text-muted/60 focus:outline-none focus:border-brand-primary resize-none"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Pickup Branch */
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Pickup Store / Branch
              </label>
              <input
                type="text"
                value={pickupBranch}
                onChange={(e) => setPickupBranch(e.target.value)}
                placeholder="e.g. Main Branch, Osu Oxford Street"
                className="w-full px-3 py-2 text-xs rounded-xl border border-separator bg-surface text-foreground placeholder:text-muted/60 focus:outline-none focus:border-brand-primary"
              />
              <p className="text-[11px] text-muted mt-1.5">
                The customer will be notified that their order is packed and ready for pickup at this branch.
              </p>
            </div>
          )}

          {/* Footer CTA */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-separator">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-brand-primary hover:bg-brand-primary-600 text-white shadow-2xs transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span>Confirm & Dispatch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
