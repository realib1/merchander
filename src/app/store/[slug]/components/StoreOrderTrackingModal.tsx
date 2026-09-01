'use client';

import React, { useState, useTransition } from 'react';
import { X, Search, Package, Clock, CheckCircle2, Truck, Loader2, MessageCircle, AlertCircle } from 'lucide-react';
import { lookupCustomerOrder, CustomerOrderLookupResult } from '@/app/actions/storefront-tracking';
import { formatCurrency } from '@/utils/format';

interface StoreOrderTrackingModalProps {
  isOpen: boolean;
  tenantId: string;
  storeName: string;
  whatsappPhone?: string | null;
  primaryColor?: string;
  onClose: () => void;
}

export function StoreOrderTrackingModal({
  isOpen,
  tenantId,
  storeName,
  whatsappPhone,
  primaryColor = '#3b82f6',
  onClose,
}: StoreOrderTrackingModalProps) {
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<CustomerOrderLookupResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setErrorMsg(null);
    startTransition(async () => {
      const res = await lookupCustomerOrder(tenantId, query);
      if (res.error) {
        setErrorMsg(res.error);
        setOrder(null);
      } else if (res.order) {
        setOrder(res.order);
        setErrorMsg(null);
      }
    });
  };

  const getStatusStep = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 1;
      case 'confirmed':
        return 2;
      case 'processing':
      case 'ready':
      case 'shipped':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = order ? getStatusStep(order.status) : 1;

  const steps = [
    { num: 1, label: 'Order Placed', icon: Clock },
    { num: 2, label: 'Confirmed', icon: CheckCircle2 },
    { num: 3, label: 'Dispatched', icon: Truck },
    { num: 4, label: 'Delivered', icon: Package },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-surface border border-separator rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-separator/80">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl bg-surface-elevated text-foreground shrink-0"
              style={{ color: primaryColor }}
            >
              <Package size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Track Your Order</h3>
              <p className="text-[11px] text-muted">Check live fulfillment status and dispatch updates.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-surface-elevated text-muted hover:text-foreground cursor-pointer transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Input Form */}
        <div className="p-5 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Enter Order # (e.g. ORD-1082) or Phone Number"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-surface-elevated border border-separator rounded-xl pl-9 pr-3.5 py-2.5 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !query.trim()}
              className="px-4 py-2.5 rounded-xl text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition cursor-pointer shrink-0 flex items-center gap-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              <span>Track</span>
            </button>
          </form>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Order Details & Progress */}
          {order && (
            <div className="space-y-4 pt-2 border-t border-separator/60 animate-fadeIn">
              {/* Order Info Bar */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-elevated border border-separator/80">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
                    {order.orderNumber}
                  </span>
                  <p className="text-xs font-bold text-foreground mt-0.5">
                    {formatCurrency(order.totalAmount, order.currency)}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${primaryColor}18`,
                      color: primaryColor,
                    }}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="py-2">
                <div className="grid grid-cols-4 gap-2 relative">
                  {steps.map((s) => {
                    const isPassed = currentStep >= s.num;
                    const Icon = s.icon;
                    return (
                      <div key={s.num} className="flex flex-col items-center text-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            isPassed ? 'text-white shadow-xs' : 'bg-surface-elevated border border-separator text-muted'
                          }`}
                          style={isPassed ? { backgroundColor: primaryColor } : undefined}
                        >
                          <Icon size={16} />
                        </div>
                        <span
                          className={`text-[10px] font-semibold mt-1.5 ${isPassed ? 'text-foreground font-bold' : 'text-muted'}`}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Item Summary */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-surface-elevated/40 border border-separator/60 text-xs">
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Ordered Items</p>
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-muted py-0.5">
                    <span className="text-foreground truncate max-w-65">
                      {it.quantity}x {it.title}
                    </span>
                    <span className="font-mono font-medium">
                      {formatCurrency(it.unitPrice * it.quantity, order.currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery Address */}
              <div className="text-xs text-muted">
                <span className="font-semibold text-foreground">Delivery Destination: </span>
                <span>{order.deliveryAddress}</span>
              </div>

              {/* WhatsApp Support CTA */}
              {whatsappPhone && (
                <a
                  href={`https://wa.me/${whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hello ${storeName}, I am inquiring about my order ${order.orderNumber}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-success text-white text-xs font-bold hover:bg-success/90 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <MessageCircle size={15} />
                  <span>Contact Store on WhatsApp</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
