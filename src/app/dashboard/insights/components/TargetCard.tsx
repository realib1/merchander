'use client';

import React, { useTransition } from 'react';
import { TargetProgress } from '@/types/targets';
import { deleteBusinessTarget } from '@/app/actions/targets';
import { formatCurrency } from '@/utils/format';
import { TrendingUp, AlertTriangle, CheckCircle2, Clock, Trash2, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface TargetCardProps {
  progress: TargetProgress;
  currency?: string;
  onDeleted?: () => void;
}

export function TargetCard({ progress, currency = 'GHS', onDeleted }: TargetCardProps) {
  const [isPending, startTransition] = useTransition();
  const { target, status } = progress;

  const isMonetary = target.metric === 'revenue' || target.metric === 'preorder_revenue';
  const formatVal = (v: number) => (isMonetary ? formatCurrency(v, currency) : v.toLocaleString());

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to remove the target "${target.name}"?`)) return;

    startTransition(async () => {
      const res = await deleteBusinessTarget(target.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Target removed');
        onDeleted?.();
      }
    });
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'on_track':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={12} />
            <span>On Track</span>
          </span>
        );
      case 'at_risk':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle size={12} />
            <span>At Risk</span>
          </span>
        );
      case 'achieved':
      case 'exceeded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <CheckCircle2 size={12} />
            <span>{status === 'exceeded' ? 'Exceeded' : 'Achieved'}</span>
          </span>
        );
      case 'expired':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
            <Clock size={12} />
            <span>Expired</span>
          </span>
        );
    }
  };

  const getMetricLabel = () => {
    switch (target.metric) {
      case 'revenue':
        return 'Revenue';
      case 'orders':
        return 'Orders';
      case 'customers':
        return 'Total Customers';
      case 'new_customers':
        return 'New Customers';
      case 'product_sales':
        return 'Product Sales';
      case 'preorder_customers':
        return 'Pre-order Customers';
      case 'preorder_revenue':
        return 'Pre-order Revenue';
      default:
        return 'Target';
    }
  };

  return (
    <div className="rounded-2xl border border-separator/80 bg-surface p-5 space-y-4 shadow-xs transition hover:border-separator">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
              {getMetricLabel()}
            </span>
            {getStatusBadge()}
          </div>
          <h3 className="text-sm font-bold text-foreground truncate">{target.name}</h3>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-surface-elevated transition cursor-pointer"
          title="Delete target"
          aria-label={`Delete ${target.name}`}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Progress Metric Values */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-display text-foreground tracking-tight">
              {formatVal(progress.current_value)}
            </span>
            <span className="text-xs font-semibold text-muted">/ {formatVal(progress.target_value)}</span>
          </div>
          <span className="text-xs font-bold font-mono text-foreground">{progress.percentage}%</span>
        </div>

        {/* Progress Bar with Milestone Ticks */}
        <div className="relative w-full h-2 rounded-full bg-surface-elevated overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              status === 'at_risk'
                ? 'bg-amber-500'
                : status === 'achieved' || status === 'exceeded'
                  ? 'bg-purple-500'
                  : 'bg-brand-primary'
            }`}
            style={{ width: `${Math.min(100, progress.percentage)}%` }}
          />
        </div>
      </div>

      {/* Pace Tracking Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
        <div className="p-2.5 rounded-xl bg-surface-elevated/70 border border-separator/50">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Remaining</p>
          <p className="font-bold text-foreground mt-0.5">{formatVal(progress.remaining_value)}</p>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-elevated/70 border border-separator/50">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Time Left</p>
          <p className="font-bold text-foreground mt-0.5">
            {progress.days_remaining > 0 ? `${progress.days_remaining} days` : 'Ended'}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-elevated/70 border border-separator/50 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Daily Pace</p>
          <p className="font-bold text-foreground mt-0.5">
            {formatVal(progress.actual_daily_pace)}/d
            {progress.required_daily_pace > 0 && (
              <span className="text-[10px] font-normal text-muted block">
                need {formatVal(progress.required_daily_pace)}/d
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Merchander Intelligence Narrative Interpretation */}
      <div className="p-3 rounded-xl bg-surface-elevated/90 border border-separator/60 space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <TrendingUp size={13} className="text-brand-primary" />
          <span>Intelligence Analysis</span>
        </div>
        <p className="text-xs text-muted leading-relaxed">{progress.intelligence_narrative}</p>
        {progress.projection_note && (
          <p className="text-[11px] font-medium text-foreground/80 pt-0.5">{progress.projection_note}</p>
        )}
      </div>

      {/* Actionable Suggestion */}
      {progress.recommendation && (
        <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
          <Lightbulb size={14} className="shrink-0 mt-0.5" />
          <p className="leading-snug">{progress.recommendation}</p>
        </div>
      )}
    </div>
  );
}
