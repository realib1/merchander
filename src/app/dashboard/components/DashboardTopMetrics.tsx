import { formatCurrency } from '@/utils/format';
import { Users, DollarSign, ShoppingCart, Activity } from 'lucide-react';
import { MetricCard } from './MetricCard';

export interface MetricData {
  value: number;
  change?: number;
  diff?: number;
}

export interface DashboardMetricsProps {
  metrics: {
    totalSales: MetricData;
    totalOrders: MetricData;
    totalCustomers: MetricData;
    grossMargin: MetricData;
  };
  period: string;
}

export function DashboardTopMetrics({ metrics, period }: DashboardMetricsProps) {
  const periodText =
    period === 'today'
      ? 'yesterday'
      : period === '7d'
        ? 'last 7 days'
        : period === '90d'
          ? 'last 90 days'
          : 'last 30 days';

  // Format currency differences
  const formatDiffCurrency = (diff?: number) => {
    if (diff === undefined || diff === null) return undefined;
    const sign = diff >= 0 ? '+' : '-';
    return `${sign}${formatCurrency(Math.abs(diff))}`;
  };

  // Format count differences
  const formatDiffCount = (diff?: number, suffix = '') => {
    if (diff === undefined || diff === null) return undefined;
    const sign = diff >= 0 ? '+' : '-';
    return `${sign}${Math.abs(diff).toLocaleString()}${suffix ? ` ${suffix}` : ''}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Revenue"
        value={formatCurrency(metrics.totalSales?.value ?? 0)}
        change={metrics.totalSales?.change}
        diffText={formatDiffCurrency(metrics.totalSales?.diff)}
        periodText={periodText}
        icon={<DollarSign size={15} />}
        iconBg="bg-success/10 text-success"
      />
      <MetricCard
        title="Orders"
        value={(metrics.totalOrders?.value ?? 0).toLocaleString()}
        change={metrics.totalOrders?.change}
        diffText={formatDiffCount(metrics.totalOrders?.diff, 'orders')}
        periodText={periodText}
        icon={<ShoppingCart size={15} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
      />
      <MetricCard
        title="Customers"
        value={(metrics.totalCustomers?.value ?? 0).toLocaleString()}
        change={metrics.totalCustomers?.change}
        diffText={formatDiffCount(metrics.totalCustomers?.diff, 'new')}
        periodText={periodText}
        icon={<Users size={15} />}
        iconBg="bg-brand-secondary/10 text-brand-secondary"
      />
      <MetricCard
        title="Gross Margin"
        value={formatCurrency(metrics.grossMargin?.value ?? 0)}
        change={metrics.grossMargin?.change}
        diffText={formatDiffCurrency(metrics.grossMargin?.diff)}
        periodText={periodText}
        icon={<Activity size={15} />}
        iconBg="bg-info/10 text-info"
      />
    </div>
  );
}
