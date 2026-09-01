'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, Clock, Truck, ShoppingBag } from 'lucide-react';
import { StorefrontTrackingOrder } from '@/types/storefront';
import { formatCurrency } from '@/utils/format';

interface TrackingSummaryCardsProps {
  order: StorefrontTrackingOrder;
  currency: string;
  primaryColor: string;
}

export function TrackingSummaryCards({ order, currency, primaryColor }: TrackingSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column: Items */}
      <div className="md:col-span-2 space-y-4">
        <div className="p-6 rounded-3xl bg-surface-elevated border border-separator shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Ordered Items</h3>
          <div className="divide-y divide-separator/60">
            {order.items.map((item) => (
              <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-3.5">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-surface border border-separator/40 shrink-0">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted">
                      <ShoppingBag size={18} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-foreground truncate">{item.productName}</h4>
                  <p className="text-[11px] text-muted">
                    {item.variantTitle} • Qty: {item.quantity}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold text-foreground">{formatCurrency(item.totalPrice, currency)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-4 border-t border-separator/80 space-y-1.5 text-xs">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>{formatCurrency(order.totalAmount, currency)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Delivery Fee</span>
              <span>Included / Calculated</span>
            </div>
            <div className="flex justify-between text-sm font-black text-foreground pt-2 border-t border-separator/60">
              <span>Total Amount</span>
              <span style={{ color: primaryColor }}>{formatCurrency(order.totalAmount, currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Delivery & Waybill */}
      <div className="space-y-4">
        <div className="p-6 rounded-3xl bg-surface-elevated border border-separator shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Delivery & Customer</h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-brand-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Delivery Address:</span>
                <p className="text-muted text-[11px] mt-0.5">{order.deliveryAddress}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock size={16} className="text-muted shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Customer:</span>
                <p className="text-muted text-[11px] mt-0.5">{order.customerName}</p>
              </div>
            </div>

            {order.waybill && (
              <div className="p-3 rounded-2xl bg-surface border border-separator space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Truck size={14} className="text-brand-primary" />
                  <span>Waybill: {order.waybill.trackingNumber}</span>
                </div>
                <p className="text-[11px] text-muted">Courier: {order.waybill.courierName}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
