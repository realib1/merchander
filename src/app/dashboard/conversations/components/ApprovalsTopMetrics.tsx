'use client';

import React from 'react';
import { ApprovalsQueueMetrics } from '@/types/actions';
import { MetricCard } from '@/components/ui/MetricCard';
import { Clock, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

interface ApprovalsTopMetricsProps {
  metrics: ApprovalsQueueMetrics;
}

export function ApprovalsTopMetrics({ metrics }: ApprovalsTopMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Pending Yellow Approvals */}
      <MetricCard
        title="Pending Approvals"
        value={metrics.pendingYellowCount}
        icon={<Clock size={16} />}
        iconBg="bg-amber-500/10 text-amber-500"
        subtitle="Payments & orders awaiting review"
        badge={
          metrics.pendingYellowCount > 0 ? (
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Needs Review
            </span>
          ) : undefined
        }
      />

      {/* 2. Urgent Red Exceptions */}
      <MetricCard
        title="Urgent Exceptions"
        value={metrics.urgentRedCount}
        icon={<AlertTriangle size={16} />}
        iconBg="bg-rose-500/10 text-rose-500"
        subtitle="Human agent & takeover requests"
        badge={
          metrics.urgentRedCount > 0 ? (
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse">
              Urgent
            </span>
          ) : undefined
        }
      />

      {/* 3. Executed Actions Today */}
      <MetricCard
        title="Executed Today"
        value={metrics.executedTodayCount}
        icon={<CheckCircle2 size={16} />}
        iconBg="bg-emerald-500/10 text-emerald-500"
        subtitle="Approved & dispatched outbound"
        change={metrics.executedTodayCount > 0 ? metrics.executedTodayCount : undefined}
        diffText={metrics.executedTodayCount > 0 ? `${metrics.executedTodayCount} sent` : undefined}
      />

      {/* 4. AI Grounding / Accuracy Confidence */}
      <MetricCard
        title="Grounded Accuracy"
        value={`${metrics.avgConfidencePct}%`}
        icon={<Sparkles size={16} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
        subtitle="Average confidence across queue"
        badge={
          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
            {metrics.avgConfidencePct >= 80 ? 'High' : 'Moderate'}
          </span>
        }
      />
    </div>
  );
}
