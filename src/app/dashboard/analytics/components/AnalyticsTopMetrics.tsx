import React from 'react';
import { AnalyticsOverviewMetrics } from '@/types/analytics';
import { formatCurrency } from '@/utils/format';
import { DollarSign, ShoppingBag, PackageCheck, Users } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';

interface AnalyticsTopMetricsProps {
  metrics: AnalyticsOverviewMetrics;
  periodLabel: string;
  currency?: string;
}

export function AnalyticsTopMetrics({ metrics, periodLabel, currency = 'GHS' }: AnalyticsTopMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Gross Merchandise Value */}
      <MetricCard
        title="Gross Sales (GMV)"
        value={formatCurrency(metrics.gmv, currency)}
        change={metrics.gmvChange}
        periodText={`prior ${periodLabel.toLowerCase()}`}
        subtitle={`${metrics.ordersCount} completed orders`}
        icon={<DollarSign size={14} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
      />

      {/* 2. Average Order Value */}
      <MetricCard
        title="Average Order Value"
        value={formatCurrency(metrics.aov, currency)}
        change={metrics.aovChange}
        periodText={`prior ${periodLabel.toLowerCase()}`}
        subtitle="Average customer basket size"
        icon={<ShoppingBag size={14} />}
        iconBg="bg-brand-secondary/10 text-brand-secondary"
      />

      {/* 3. Fulfillment Rate */}
      <MetricCard
        title="Fulfillment Rate"
        value={`${metrics.fulfillmentRatePct.toFixed(1)}%`}
        badge={
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              metrics.fulfillmentRatePct >= 80 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
            }`}
          >
            {metrics.fulfillmentRatePct >= 80 ? 'Optimal' : 'Review'}
          </span>
        }
        subtitle="Orders successfully delivered & paid"
        icon={<PackageCheck size={14} />}
        iconBg={metrics.fulfillmentRatePct >= 80 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}
      />

      {/* 4. Customer Repeat Rate */}
      <MetricCard
        title="Customer Repeat Rate"
        value={`${metrics.repeatCustomerRatePct.toFixed(1)}%`}
        badge={<span className="text-xs font-bold px-2 py-0.5 rounded-full bg-info/10 text-info">Loyalty</span>}
        subtitle="Orders from returning buyers"
        icon={<Users size={14} />}
        iconBg="bg-info/10 text-info"
      />
    </div>
  );
}
