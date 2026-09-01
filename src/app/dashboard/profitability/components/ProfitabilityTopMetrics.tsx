import React from 'react';
import { ProfitabilityMetrics } from '@/types/profitability';
import { formatCurrency } from '@/utils/format';
import { TrendingUp, DollarSign, Layers, ShieldAlert, Wallet } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';

interface ProfitabilityTopMetricsProps {
  metrics: ProfitabilityMetrics;
}

export function ProfitabilityTopMetrics({ metrics }: ProfitabilityTopMetricsProps) {
  const isGrossHealthy = metrics.grossMarginPct >= 30;
  const isNetPositive = metrics.netProfit >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Gross Revenue */}
      <MetricCard
        title="Gross Sales"
        value={formatCurrency(metrics.grossRevenue, 'GHS')}
        subtitle={`${metrics.totalOrdersCount} orders • ${metrics.totalUnitsSold} units sold`}
        icon={<DollarSign size={14} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
      />

      {/* 2. COGS */}
      <MetricCard
        title="Cost of Goods (COGS)"
        value={formatCurrency(metrics.cogs, 'GHS')}
        subtitle={
          metrics.grossRevenue > 0
            ? `${((metrics.cogs / metrics.grossRevenue) * 100).toFixed(1)}% of total revenue`
            : 'Product sourcing cost'
        }
        icon={<Layers size={14} />}
        iconBg="bg-brand-secondary/10 text-brand-secondary"
      />

      {/* 3. Gross Profit & Margin */}
      <MetricCard
        title="Gross Profit"
        value={formatCurrency(metrics.grossProfit, 'GHS')}
        badge={
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isGrossHealthy ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
            }`}
          >
            {metrics.grossMarginPct.toFixed(1)}% margin
          </span>
        }
        subtitle="Revenue minus product unit cost"
        icon={<TrendingUp size={14} />}
        iconBg={isGrossHealthy ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}
      />

      {/* 4. Net Profit */}
      <MetricCard
        title="Net Real Profit"
        value={formatCurrency(metrics.netProfit, 'GHS')}
        badge={
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isNetPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            }`}
          >
            {metrics.netMarginPct.toFixed(1)}% net
          </span>
        }
        subtitle={`After ${formatCurrency(metrics.totalExpenses, 'GHS')} OPEX & logistics`}
        icon={isNetPositive ? <Wallet size={14} /> : <ShieldAlert size={14} />}
        iconBg={isNetPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}
      />
    </div>
  );
}
