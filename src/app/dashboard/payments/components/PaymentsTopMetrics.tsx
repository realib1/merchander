import React from 'react';
import { PaymentMetrics } from '@/types/payments';
import { MetricCard } from '@/components/ui/MetricCard';
import { formatCurrency } from '@/utils/format';
import { Wallet, Smartphone, Clock, BadgePercent } from 'lucide-react';

interface PaymentsTopMetricsProps {
  metrics: PaymentMetrics;
}

export function PaymentsTopMetrics({ metrics }: PaymentsTopMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Inflow */}
      <MetricCard
        title="Gross Collections"
        value={formatCurrency(metrics.totalInflow, 'GHS')}
        subtitle={`${metrics.completedCount} successful transactions`}
        icon={<Wallet size={14} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
      />

      {/* 2. Mobile Money Share */}
      <MetricCard
        title="Mobile Money Volume"
        value={formatCurrency(metrics.momoVolume, 'GHS')}
        badge={
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-warning/10 text-warning">
            {metrics.momoPercentage}% MoMo
          </span>
        }
        subtitle="Telecom mobile wallet collections"
        icon={<Smartphone size={14} />}
        iconBg="bg-warning/10 text-warning"
      />

      {/* 3. Pending / Unreconciled */}
      <MetricCard
        title="Pending / COD Inflow"
        value={formatCurrency(metrics.pendingReconciliationAmount, 'GHS')}
        subtitle={`${metrics.pendingReconciliationCount} orders awaiting payment`}
        subtitleColor={metrics.pendingReconciliationCount > 0 ? 'text-warning' : 'text-muted'}
        icon={<Clock size={14} />}
        iconBg="bg-warning/10 text-warning"
      />

      {/* 4. Net Inflow & Fees */}
      <MetricCard
        title="Net Settled Inflow"
        value={formatCurrency(metrics.netInflow, 'GHS')}
        subtitle={`Fees deducted: ${formatCurrency(metrics.totalFees, 'GHS')}`}
        icon={<BadgePercent size={14} />}
        iconBg="bg-success/10 text-success"
      />
    </div>
  );
}
