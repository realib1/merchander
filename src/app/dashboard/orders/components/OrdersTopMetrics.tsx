import React from 'react';
import { ShoppingCart, Clock, Truck, XCircle } from 'lucide-react';

export interface OrdersMetricsProps {
  metrics: {
    total: number;
    pendingPayment: number;
    toDispatch: number;
    cancelled: number;
  };
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  subtitleColor: string;
  icon: React.ReactNode;
  iconBg: string;
}

function MetricCard({ title, value, subtitle, subtitleColor, icon, iconBg }: MetricCardProps) {
  return (
    <div className="bg-surface border border-separator rounded-2xl flex flex-col justify-between items-start min-h-35">
      <div className="flex justify-between w-full p-4">
        <h3 className="text-[15px] font-medium text-text-secondary">{title}</h3>
        <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div className="rounded-xl w-full p-4 border-t border-t-separator shadow-md">
        <div className="text-[32px] font-bold text-text-primary leading-none mb-3 tabular-nums">
          {value}
        </div>
        <div className={`text-xs font-medium ${subtitleColor}`}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

export function OrdersTopMetrics({ metrics }: OrdersMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <MetricCard
        title="Total orders"
        value={metrics.total.toLocaleString()}
        subtitle="+12.4% this month"
        subtitleColor="text-success"
        icon={<ShoppingCart size={14} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
      />
      <MetricCard
        title="Pending payment"
        value={metrics.pendingPayment.toLocaleString()}
        subtitle="Awaiting fulfillment"
        subtitleColor="text-text-muted"
        icon={<Clock size={14} />}
        iconBg="bg-warning/10 text-warning"
      />
      <MetricCard
        title="To dispatch"
        value={metrics.toDispatch.toLocaleString()}
        subtitle="Currently shipping"
        subtitleColor="text-text-muted"
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
