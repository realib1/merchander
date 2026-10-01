'use client';

import { Eye, MapPin, Package, UserRound } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { formatGhanaLocalDisplay } from '@/utils/phone';
import type { Order } from './OrdersTableRow';

interface OrderPreviewPanelProps {
  order: Order | null;
  onOpenDetails: () => void;
}

export function OrderPreviewPanel({ order, onOpenDetails }: OrderPreviewPanelProps) {
  if (!order) {
    return (
      <aside className="flex min-h-64 items-center justify-center rounded-2xl border border-separator bg-surface p-6 text-center xl:sticky xl:top-4">
        <div>
          <Package size={24} className="mx-auto mb-2 text-muted/50" aria-hidden="true" />
          <p className="text-sm font-semibold text-foreground">No order selected</p>
          <p className="mt-1 text-xs text-muted">Orders that match your filters will appear here.</p>
        </div>
      </aside>
    );
  }

  const orderReference = order.short_id || order.id.slice(0, 8).toUpperCase();
  const items = order.items || [];
  const itemSubtotal = items.reduce((sum, item) => sum + (item.unit_price || 0) * item.quantity, 0);

  return (
    <aside
      aria-label={`Details for order ${orderReference}`}
      className="rounded-2xl border border-separator bg-surface shadow-xs xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:overscroll-contain custom-scrollbar"
    >
      <div className="space-y-3 border-b border-separator/70 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted">Order</p>
            <h2 className="mt-1 truncate text-sm font-bold text-foreground">#{orderReference}</h2>
            <p className="mt-1 text-xs text-muted">
              {new Date(order.created_at).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
          <span className="rounded-full border border-separator bg-surface-elevated px-2.5 py-1 text-[11px] font-semibold capitalize text-foreground">
            {order.status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <span className="text-xs text-muted">Order total</span>
          <span className="text-lg font-bold tabular-nums text-foreground">{formatCurrency(order.total_amount)}</span>
        </div>
        <button
          type="button"
          onClick={onOpenDetails}
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-primary-600"
        >
          <Eye size={14} aria-hidden="true" />
          Open full details
        </button>
      </div>

      <section className="space-y-3 border-b border-separator/70 p-5" aria-labelledby="order-preview-customer">
        <h3
          id="order-preview-customer"
          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted"
        >
          <UserRound size={14} aria-hidden="true" /> Customer
        </h3>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{order.customer?.name || 'Walk-in Customer'}</p>
          {order.customer?.phone && (
            <p className="mt-1 text-xs text-muted">{formatGhanaLocalDisplay(order.customer.phone)}</p>
          )}
        </div>
      </section>

      <section className="space-y-3 border-b border-separator/70 p-5" aria-labelledby="order-preview-items">
        <div className="flex items-center justify-between">
          <h3
            id="order-preview-items"
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted"
          >
            <Package size={14} aria-hidden="true" /> Items
          </h3>
          <span className="text-[11px] text-muted">{items.length}</span>
        </div>
        {items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">
                    {item.variant?.product?.name || 'Product'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {item.variant?.name ? `${item.variant.name} · ` : ''}Qty {item.quantity}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                  {formatCurrency((item.unit_price || 0) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted">No item details available.</p>
        )}
        <dl className="space-y-2 border-t border-separator/60 pt-3 text-xs">
          <div className="flex justify-between gap-3 text-muted">
            <dt>Items subtotal</dt>
            <dd className="tabular-nums text-foreground">{formatCurrency(itemSubtotal)}</dd>
          </div>
          <div className="flex justify-between gap-3 text-muted">
            <dt>Delivery</dt>
            <dd className="text-right text-foreground">
              {order.shipping_tbd ? 'To be confirmed' : formatCurrency(order.delivery_fee || 0)}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-separator/60 pt-2 font-semibold text-foreground">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCurrency(order.total_amount)}</dd>
          </div>
        </dl>
      </section>

      {order.delivery_address && (
        <section className="space-y-2 p-5" aria-labelledby="order-preview-delivery">
          <h3
            id="order-preview-delivery"
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted"
          >
            <MapPin size={14} aria-hidden="true" /> Delivery address
          </h3>
          <p className="text-xs leading-relaxed text-foreground">{order.delivery_address}</p>
        </section>
      )}
    </aside>
  );
}
