import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  subtitleColor?: string;
  badge?: React.ReactNode;
  change?: number;
  diffText?: string;
  periodText?: string;
  icon: React.ReactNode;
  iconBg: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  subtitleColor = 'text-muted',
  badge,
  change,
  diffText,
  periodText,
  icon,
  iconBg,
  className,
}: MetricCardProps) {
  const isZero = change === 0;
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div
      className={cn(
        'bg-surface border border-separator rounded-2xl flex flex-col justify-between items-start min-h-32 shadow-xs transition hover:border-separator/80',
        className
      )}
    >
      {/* Top Header */}
      <div className="flex justify-between items-center w-full p-4 pb-2">
        <h3 className="text-sm font-medium text-muted">{title}</h3>
        <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', iconBg)}>{icon}</div>
      </div>

      {/* Bottom Segment with Border Divider */}
      <div className="w-full p-4 mt-2 border-t border-separator rounded-2xl">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-2xl font-bold leading-tight mb-2.5 tabular-nums text-foreground">{value}</div>
          {badge && <div className="shrink-0 mb-2">{badge}</div>}
        </div>

        {change !== undefined ? (
          <div className="text-xs font-medium flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-semibold text-[11px]',
                isZero
                  ? 'bg-surface-elevated text-muted border border-separator/40'
                  : isPositive
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive'
              )}
            >
              {isPositive && <TrendingUp size={11} aria-hidden="true" />}
              {isNegative && <TrendingDown size={11} aria-hidden="true" />}
              {isPositive ? '+' : ''}
              {change.toFixed(1)}%
            </span>
            {diffText && <span className="font-semibold text-foreground tabular-nums">{diffText}</span>}
            {periodText && <span className="text-muted text-[11px]">vs. {periodText}</span>}
          </div>
        ) : diffText ? (
          <div className="text-xs font-medium flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-foreground tabular-nums">{diffText}</span>
            {periodText && <span className="text-muted text-[11px]">vs. {periodText}</span>}
          </div>
        ) : subtitle ? (
          <div className={cn('text-xs font-medium', subtitleColor)}>{subtitle}</div>
        ) : (
          <div className="text-xs font-medium text-muted invisible">Placeholder</div>
        )}
      </div>
    </div>
  );
}
