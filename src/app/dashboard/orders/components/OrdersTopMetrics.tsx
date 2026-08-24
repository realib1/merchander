import React from 'react';
import { ShoppingCart, Clock, Truck, XCircle } from 'lucide-react';

export interface OrdersMetricsProps {
  metrics: {
    total: number;
    pendingPayment: number;
    toDispatch: number;
    cancelled: number;
    ordersChange?: number;
  };
}

import { MetricCard } from '../../components/MetricCard';

export function OrdersTopMetrics({ metrics }: OrdersMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <MetricCard
        title="Total orders"
        value={metrics.total.toLocaleString()}
        change={metrics.ordersChange}
        icon={<ShoppingCart size={14} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
      />
      <MetricCard
        title="Pending payment"
        value={metrics.pendingPayment.toLocaleString()}
        subtitle="Awaiting fulfillment"
        subtitleColor="text-muted"
        icon={<Clock size={14} />}
        iconBg="bg-warning/10 text-warning"
      />
      <MetricCard
        title="To dispatch"
        value={metrics.toDispatch.toLocaleString()}
        subtitle="Currently shipping"
        subtitleColor="text-muted"
        icon={<Truck size={14} />}
        iconBg="bg-info/10 text-info"
      />
      <MetricCard
        title="Cancelled"
        value={metrics.cancelled.toLocaleString()}
        subtitle="Requires review"
        subtitleColor="text-warning"
        icon={<XCircle size={14} />}
        iconBg="bg-destructive/10 text-destructive"
      />
    </div>
  );
}
