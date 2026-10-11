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
  const hasValidChange = typeof change === 'number' && Number.isFinite(change);
  const isZero = hasValidChange && change === 0;
  const isPositive = hasValidChange && change > 0;
  const isNegative = hasValidChange && change < 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-separator/70 bg-surface p-5 transition-all duration-200 hover:border-separator group flex flex-col justify-between min-h-34',
        className
      )}
    >
      {/* Top Header: Title & Rounded Icon Container */}
      <div className="flex justify-between items-center w-full relative z-10">
        <h3 className="text-[11px] font-bold text-muted uppercase tracking-wider">{title}</h3>
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform', iconBg)}>
          {icon}
        </div>
      </div>

      {/* Middle & Value Segment */}
      <div className="w-full mt-2 relative z-10">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-[30px] font-display font-bold tracking-tight leading-none tabular-nums text-foreground">
            {value}
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        {/* Bottom Trend & Context Footer */}
        <div className="mt-2.5">
          {hasValidChange ? (
            <div className="text-xs font-medium flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-semibold text-[11px] transition-colors',
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
    </div>
  );
}
