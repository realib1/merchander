import React from 'react';
import { Users, UserCheck, ShoppingBag, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface CustomersTopMetricsProps {
  totalCustomers: number;
  customersChange: number;
  activeCustomers: number;
  totalOrders: number;
  ordersChange: number;
  totalRevenue: number;
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  icon: React.ReactNode;
  iconBg: string;
}

function MetricCard({ title, value, subtitle, change, icon, iconBg }: MetricCardProps) {
  const isPositive = change !== undefined ? change >= 0 : true;

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
        {change !== undefined ? (
          <div className="text-xs font-medium">
            <span className={`inline-flex items-center gap-1 font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
              {isPositive ? '+' : ''}{change.toFixed(1)}%
            </span>
            <span className="text-text-muted ml-1.5">vs. last 30 days</span>
          </div>
        ) : subtitle ? (
          <div className="text-xs font-medium text-text-muted">
            {subtitle}
          </div>
        ) : (
          <div className="text-xs font-medium text-text-muted invisible">
            Placeholder
          </div>
        )}
      </div>
    </div>
  );
}

export function CustomersTopMetrics({
  totalCustomers,
  customersChange,
  activeCustomers,
  totalOrders,
  ordersChange,
  totalRevenue
}: CustomersTopMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-separator bg-surface">
      <MetricCard
        title="Total customers"
        value={totalCustomers.toLocaleString()}
        change={customersChange}
        icon={<Users size={14} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
      />
      <MetricCard
        title="Active customers"
        value={activeCustomers.toLocaleString()}
        subtitle="Ordered in last 90 days"
        icon={<UserCheck size={14} />}
        iconBg="bg-brand-secondary/10 text-brand-secondary"
      />
      <MetricCard
        title="Customer orders"
        value={totalOrders.toLocaleString()}
        change={ordersChange}
        icon={<ShoppingBag size={14} />}
        iconBg="bg-info/10 text-info"
      />
      <MetricCard
        title="Customer revenue"
        value={formatCurrency(totalRevenue)}
        subtitle="All-time"
        icon={<DollarSign size={14} />}
        iconBg="bg-success/10 text-success"
      />
    </div>
  );
}
