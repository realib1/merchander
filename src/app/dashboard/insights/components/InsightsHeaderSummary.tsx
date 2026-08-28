import React from 'react';
import { InsightsSummary } from '@/types/insights';
import { ShieldAlert, AlertTriangle, Sparkles, Activity } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';

interface InsightsHeaderSummaryProps {
  summary: InsightsSummary;
}

export function InsightsHeaderSummary({ summary }: InsightsHeaderSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Critical Attention */}
      <MetricCard
        title="Critical Action"
        value={summary.criticalCount}
        subtitle={summary.criticalCount > 0 ? 'Immediate revenue or stock risk' : 'No critical risks detected'}
        icon={<ShieldAlert size={14} />}
        iconBg={summary.criticalCount > 0 ? 'bg-destructive/10 text-destructive' : 'bg-surface-elevated text-muted'}
      />

      {/* 2. Operational Warnings */}
      <MetricCard
        title="Warnings & Buffers"
        value={summary.warningCount}
        subtitle={summary.warningCount > 0 ? 'Approaching stockout or thin margins' : 'Optimal buffer levels'}
        icon={<AlertTriangle size={14} />}
        iconBg={summary.warningCount > 0 ? 'bg-warning/10 text-warning' : 'bg-surface-elevated text-muted'}
      />

      {/* 3. Opportunities */}
      <MetricCard
        title="Growth Opportunities"
        value={summary.opportunityCount}
        subtitle={summary.opportunityCount > 0 ? 'Surging products & VIP retargeting' : 'No active growth alerts'}
        icon={<Sparkles size={14} />}
        iconBg="bg-success/10 text-success"
      />

      {/* 4. Total Intelligence Triggers */}
      <MetricCard
        title="Total Active Signals"
        value={summary.totalCount}
        subtitle="Automated business diagnostics"
        icon={<Activity size={14} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
      />
    </div>
  );
}
