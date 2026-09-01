'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Package, ShoppingBag, ArrowRight } from 'lucide-react';

interface CartSuccessViewProps {
  customerPhone: string;
  orderId?: string;
  orderShortId?: string;
  trackingUrl?: string;
  slug?: string;
  primaryColor?: string;
  onReset: () => void;
}

export function CartSuccessView({
  customerPhone,
  orderId,
  orderShortId,
  trackingUrl,
  slug,
  primaryColor = '#3b82f6',
  onReset,
}: CartSuccessViewProps) {
  const displayId = orderShortId || orderId?.slice(0, 8).toUpperCase() || 'ORDER';

  return (
    <div className="p-6 text-center space-y-4 my-auto animate-fadeIn">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-white mx-auto shadow-md"
        style={{ backgroundColor: primaryColor }}
      >
        <CheckCircle2 size={28} />
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Order Confirmed</span>
        <h3 className="text-lg font-black text-foreground">Order #{displayId}</h3>
        <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">
          Thank you for ordering! We received your request and will follow up with you on{' '}
          <strong className="text-foreground">{customerPhone}</strong>.
        </p>
      </div>

      <div className="pt-2 space-y-2">
        {trackingUrl ? (
          <Link
            href={trackingUrl}
            className="w-full py-3 rounded-xl text-white text-xs font-bold shadow-md transition hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            <Package size={16} />
            <span>Track Order Status</span>
            <ArrowRight size={14} />
          </Link>
        ) : slug && (orderShortId || orderId) ? (
          <Link
            href={`/store/${slug}/orders/${orderShortId || orderId?.slice(0, 8).toUpperCase()}`}
            className="w-full py-3 rounded-xl text-white text-xs font-bold shadow-md transition hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            <Package size={16} />
            <span>Track Order Status</span>
            <ArrowRight size={14} />
          </Link>
        ) : null}

        <button
          type="button"
          onClick={onReset}
          className="w-full py-2.5 rounded-xl bg-surface-elevated border border-separator text-foreground text-xs font-semibold hover:bg-surface transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShoppingBag size={14} />
          <span>Continue Shopping</span>
        </button>
      </div>
    </div>
  );
}
