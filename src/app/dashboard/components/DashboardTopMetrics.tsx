import { formatCurrency } from '@/utils/format';
import { Users, DollarSign, ShoppingCart, Activity } from 'lucide-react';

export interface DashboardMetricsProps {
  metrics: {
    totalSales: { value: number; change: number };
    totalOrders: { value: number; change: number };
    totalCustomers: { value: number; change: number };
    grossMargin: { value: number; change: number };
  };
  period: string;
}

import { MetricCard } from './MetricCard';

export function DashboardTopMetrics({ metrics, period }: DashboardMetricsProps) {
  const periodText = period === '7d' ? 'last 7 days' : period === '90d' ? 'last 90 days' : 'last 30 days';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Revenue"
        value={formatCurrency(metrics.totalSales.value)}
        change={metrics.totalSales.change}
        periodText={periodText}
        icon={<DollarSign size={14} />}
        iconBg="bg-success/10 text-success"
      />
      <MetricCard
        title="Orders"
        value={metrics.totalOrders.value.toLocaleString()}
        change={metrics.totalOrders.change}
        periodText={periodText}
        icon={<ShoppingCart size={14} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
      />
      <MetricCard
        title="Customers"
        value={metrics.totalCustomers.value.toLocaleString()}
        change={metrics.totalCustomers.change}
        periodText={periodText}
        icon={<Users size={14} />}
        iconBg="bg-brand-secondary/10 text-brand-secondary"
      />
      <MetricCard
        title="Gross Margin"
        value={formatCurrency(metrics.grossMargin.value)}
        change={metrics.grossMargin.change}
        periodText={periodText}
        icon={<Activity size={14} />}
        iconBg="bg-info/10 text-info"
      />
    </div>
  );
}
