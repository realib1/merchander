import { formatCurrency } from '@/utils/format';
import { Users, ShoppingCart, DollarSign, Activity, TrendingUp, TrendingDown } from 'lucide-react';

export interface DashboardMetricsProps {
  metrics: {
    totalSales: { value: number; change: number };
    totalOrders: { value: number; change: number };
    totalCustomers: { value: number; change: number };
    grossMargin: { value: number; change: number };
  };
  period: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  periodText: string;
  icon: React.ReactNode;
  iconBg: string;
}

/** Single KPI metric card — extracted to eliminate 4x copy-paste. */
function MetricCard({ title, value, change, periodText, icon, iconBg }: MetricCardProps) {
  const isPositive = change >= 0;

  return (
    <div className="bg-surface border border-separator rounded-2xl flex flex-col justify-between items-start min-h-32">
      <div className="flex justify-between w-full p-4">
        <h3 className="text-body font-medium text-text-secondary">{title}</h3>
         <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      </div>
      <div className='rounded-xl w-full p-4 border-t border-t-separator shadow-md'>

        <div className="text-h1 font-bold text-text-primary leading-none mb-3 tabular-nums">
          {value}
        </div>
        <div className="text-xs font-medium">
          <span className={`inline-flex items-center gap-1 font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </span>
          <span className="text-text-muted ml-1.5">vs. {periodText}</span>
        </div>
      </div>
     
    </div>
  );
}

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
