import React from 'react';
import { ShoppingCart, Clock, Truck, CircleX } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';

export interface OrdersMetricsProps {
  metrics: {
    total: number;
    pendingPayment: number;
    toDispatch: number;
    cancelled: number;
    ordersChange?: number;
  };
}

export function OrdersTopMetrics({ metrics }: OrdersMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Total Orders"
        value={metrics.total.toLocaleString()}
        change={metrics.ordersChange}
        icon={<ShoppingCart size={14} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
      />
      <MetricCard
        title="Pending Payment"
        value={metrics.pendingPayment.toLocaleString()}
        subtitle="Awaiting fulfillment"
        icon={<Clock size={14} />}
        iconBg="bg-warning/10 text-warning"
      />
      <MetricCard
        title="To Dispatch"
        value={metrics.toDispatch.toLocaleString()}
        subtitle="Currently packing / shipping"
        icon={<Truck size={14} />}
        iconBg="bg-info/10 text-info"
      />
      <MetricCard
        title="Cancelled"
        value={metrics.cancelled.toLocaleString()}
        subtitle="Requires review"
        subtitleColor={metrics.cancelled > 0 ? 'text-destructive' : 'text-muted'}
        icon={<CircleX size={14} />}
        iconBg={metrics.cancelled > 0 ? 'bg-destructive/10 text-destructive' : 'bg-surface-elevated text-muted'}
      />
    </div>
  );
}
