'use client';

import React from 'react';
import { DollarSign, PieChart, Activity, Layers } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { formatCurrency } from '@/utils/format';

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface ExpensesTopMetricsProps {
  totalAmount: number;
  topCategory: string;
  expenseCount: number;
  currency?: string;
  categoryBreakdown?: CategoryBreakdown[];
}

const CATEGORY_COLORS: string[] = [
  'bg-brand-primary',
  'bg-brand-secondary',
  'bg-warning',
  'bg-success',
  'bg-info',
  'bg-destructive',
];

export function ExpensesTopMetrics({
  totalAmount,
  topCategory,
  expenseCount,
  currency = 'GHS',
  categoryBreakdown = [],
}: ExpensesTopMetricsProps) {
  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Outlay"
          value={formatCurrency(totalAmount, currency)}
          subtitle="Total expenses in period"
          icon={<DollarSign size={14} />}
          iconBg="bg-brand-primary/10 text-brand-primary"
        />
        <MetricCard
          title="Highest Cost Driver"
          value={topCategory}
          subtitle="Top expense category"
          subtitleColor="text-warning"
          icon={<PieChart size={14} />}
          iconBg="bg-warning/10 text-warning"
        />
        <MetricCard
          title="Total Transactions"
          value={expenseCount.toLocaleString()}
          subtitle="Recorded expense entries"
          subtitleColor="text-success"
          icon={<Activity size={14} />}
          iconBg="bg-success/10 text-success"
        />
      </div>

      {categoryBreakdown.length > 0 && totalAmount > 0 && (
        <div className="bg-surface border border-separator rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={13} /> Spending by Category
            </span>
          </div>

          {/* Segmented Distribution Bar */}
          <div className="h-3 w-full rounded-full bg-surface-elevated overflow-hidden flex gap-0.5">
            {categoryBreakdown.map((item, idx) => (
              <div
                key={item.category}
                style={{ width: `${item.percentage}%` }}
                className={`${CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} transition-all`}
                title={`${item.category}: ${item.percentage.toFixed(1)}% (GHS ${item.amount.toLocaleString()})`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pt-2 border-t border-separator">
            {categoryBreakdown.slice(0, 5).map((item, idx) => (
              <div key={item.category} className="flex items-center gap-1.5 text-xs">
                <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}`} />
                <span className="text-muted font-medium">{item.category}:</span>
                <span className="font-semibold text-foreground">
                  GHS {item.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} (
                  {item.percentage.toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
