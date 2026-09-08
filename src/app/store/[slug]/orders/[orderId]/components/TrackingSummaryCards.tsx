'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, Clock, Truck, ShoppingBag, Phone, Store, CheckCircle2, Navigation } from 'lucide-react';
import { StorefrontTrackingOrder } from '@/types/storefront';
import { formatCurrency, formatDate } from '@/utils/format';
import { formatGhanaLocalDisplay } from '@/utils/phone';

interface TrackingSummaryCardsProps {
  order: StorefrontTrackingOrder;
  currency: string;
  primaryColor: string;
}

export function TrackingSummaryCards({ order, currency, primaryColor }: TrackingSummaryCardsProps) {
  const isPickup = order.waybill?.fulfillmentMode === 'pickup';
  const hasRider = Boolean(order.waybill?.riderName || order.waybill?.riderPhone);

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
        <div className="p-6 rounded-3xl bg-surface-elevated border border-separator shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {isPickup ? 'Store Pickup Details' : 'Fulfilment & Delivery'}
            </h3>
            {order.status === 'dispatched' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                In Transit
              </span>
            )}
            {order.status === 'delivered' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 size={11} />
                Delivered
              </span>
            )}
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Delivery address or pickup branch */}
            <div className="flex items-start gap-2.5">
              {isPickup ? (
                <Store size={16} className="text-brand-primary shrink-0 mt-0.5" />
              ) : (
                <MapPin size={16} className="text-brand-primary shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold text-foreground">
                  {isPickup ? 'Pickup Location:' : 'Delivery Address:'}
                </span>
                <p className="text-muted text-[11px] mt-0.5 leading-relaxed">{order.deliveryAddress}</p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="flex items-start gap-2.5">
              <Clock size={16} className="text-muted shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Recipient:</span>
                <p className="text-muted text-[11px] mt-0.5">
                  {order.customerName}
                  {order.customerPhone ? ` • ${formatGhanaLocalDisplay(order.customerPhone)}` : ''}
                </p>
              </div>
            </div>

            {/* Waybill / Rider Information Card */}
            {order.waybill && (
              <div className="mt-4 p-3.5 rounded-2xl bg-surface border border-separator space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Truck size={14} className="text-brand-primary" />
                    <span>{order.waybill.courierName}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface-elevated text-muted border border-separator/60">
                    #{order.waybill.trackingNumber}
                  </span>
                </div>

                {/* Assigned Rider Contact with Click-to-Call */}
                {hasRider && (
                  <div className="pt-2 border-t border-separator/60 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted block tracking-wider">
                        Assigned Rider
                      </span>
                      <p className="text-xs font-semibold text-foreground truncate">
                        {order.waybill.riderName || 'Delivery Rider'}
                      </p>
                      {order.waybill.riderPhone && (
                        <p className="text-[11px] text-muted">
                          {formatGhanaLocalDisplay(order.waybill.riderPhone)}
                        </p>
                      )}
                    </div>

                    {order.waybill.riderPhone && (
                      <a
                        href={`tel:${order.waybill.riderPhone}`}
                        className="px-3 py-1.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-600 transition flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                        title="Call Rider"
                      >
                        <Phone size={12} />
                        <span>Call</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Pickup Store Branch */}
                {isPickup && order.waybill.pickupStoreName && (
                  <div className="pt-2 border-t border-separator/60 flex items-center gap-2 text-xs">
                    <Navigation size={13} className="text-brand-primary shrink-0" />
                    <span className="text-[11px] text-muted">
                      Pickup Branch: <strong className="text-foreground">{order.waybill.pickupStoreName}</strong>
                    </span>
                  </div>
                )}

                {/* Timeline Timestamps */}
                {order.waybill.dispatchedAt && (
                  <div className="pt-2 border-t border-separator/60 text-[10px] text-muted flex justify-between">
                    <span>Dispatched:</span>
                    <span className="font-medium text-foreground">
                      {formatDate(order.waybill.dispatchedAt)}
                    </span>
                  </div>
                )}
                {order.waybill.deliveredAt && (
                  <div className="text-[10px] text-muted flex justify-between">
                    <span>Delivered:</span>
                    <span className="font-medium text-emerald-500 font-bold">
                      {formatDate(order.waybill.deliveredAt)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
