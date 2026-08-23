import React from 'react';
import { formatCurrency } from '@/utils/format';
import { Users, ShoppingCart, DollarSign, Activity } from 'lucide-react';

export interface DashboardMetricsProps {
  metrics: {
    totalSales: { value: number; change: number };
    totalOrders: { value: number; change: number };
    totalCustomers: { value: number; change: number };
    grossMargin: { value: number; change: number };
  };
  period: string;
}

export function DashboardTopMetrics({ metrics, period }: DashboardMetricsProps) {
  const periodText = period === '7d' ? 'last 7 days' : period === '90d' ? 'last 90 days' : 'last 30 days';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Sales / Revenue */}
      <div className="bg-surface border border-separator rounded-2xl p-6 flex justify-between items-start min-h-35">
        <div className="flex flex-col">
          <h3 className="text-[15px] font-medium text-text-secondary mb-3">Revenue</h3>
          <div className="text-[32px] font-bold text-text-primary leading-none mb-3">
            {formatCurrency(metrics.totalSales.value)}
          </div>
          <div className="text-sm font-medium">
            <span className={`inline-flex items-center gap-1 font-semibold ${metrics.totalSales.change >= 0 ? 'text-success' : 'text-destructive'
              }`}>
              {metrics.totalSales.change >= 0 ? '+' : ''}{metrics.totalSales.change.toFixed(1)}%
            </span>
            <span className="text-text-muted ml-1.5">vs. {periodText}</span>
          </div>
        </div>
        <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
          <DollarSign size={24} />
        </div>
      </div>

      {/* Orders */}
      <div className="bg-surface border border-separator rounded-2xl p-6 flex justify-between items-start min-h-35">
        <div className="flex flex-col">
          <h3 className="text-[15px] font-medium text-text-secondary mb-3">Orders</h3>
          <div className="text-[32px] font-bold text-text-primary leading-none mb-3">
            {metrics.totalOrders.value}
          </div>
          <div className="text-sm font-medium">
            <span className={`inline-flex items-center gap-1 font-semibold ${metrics.totalOrders.change >= 0 ? 'text-success' : 'text-destructive'
              }`}>
              {metrics.totalOrders.change >= 0 ? '+' : ''}{metrics.totalOrders.change.toFixed(1)}%
            </span>
            <span className="text-text-muted ml-1.5">vs. {periodText}</span>
          </div>
        </div>
        <div className="h-12 w-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
          <ShoppingCart size={24} />
        </div>
      </div>

      {/* Customers */}
      <div className="bg-surface border border-separator rounded-2xl p-6 flex justify-between items-start min-h-35">
        <div className="flex flex-col">
          <h3 className="text-[15px] font-medium text-text-secondary mb-3">Customers</h3>
          <div className="text-[32px] font-bold text-text-primary leading-none mb-3">
            {metrics.totalCustomers.value}
          </div>
          <div className="text-sm font-medium">
            <span className={`inline-flex items-center gap-1 font-semibold ${metrics.totalCustomers.change >= 0 ? 'text-success' : 'text-destructive'
              }`}>
              {metrics.totalCustomers.change >= 0 ? '+' : ''}{metrics.totalCustomers.change.toFixed(1)}%
            </span>
            <span className="text-text-muted ml-1.5">vs. {periodText}</span>
          </div>
        </div>
        <div className="h-12 w-12 rounded-xl bg-brand-secondary/10 text-brand-secondary flex items-center justify-center shrink-0">
          <Users size={24} />
        </div>
      </div>

      {/* Profit / Gross Margin */}
      <div className="bg-surface border border-separator rounded-2xl p-6 flex justify-between items-start min-h-35">
        <div className="flex flex-col">
          <h3 className="text-[15px] font-medium text-text-secondary mb-3">Gross Margin</h3>
          <div className="text-[32px] font-bold text-text-primary leading-none mb-3">
            {formatCurrency(metrics.grossMargin.value)}
          </div>
          <div className="text-sm font-medium">
            <span className={`inline-flex items-center gap-1 font-semibold ${metrics.grossMargin.change >= 0 ? 'text-success' : 'text-destructive'
              }`}>
              {metrics.grossMargin.change >= 0 ? '+' : ''}{metrics.grossMargin.change.toFixed(1)}%
            </span>
            <span className="text-text-muted ml-1.5">vs. {periodText}</span>
          </div>
        </div>
        <div className="h-12 w-12 rounded-xl bg-info/10 text-info flex items-center justify-center shrink-0">
          <Activity size={24} />
        </div>
      </div>
    </div>
  );
}
