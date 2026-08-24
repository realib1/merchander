import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  subtitleColor?: string;
  change?: number;
  periodText?: string;
  icon: React.ReactNode;
  iconBg: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  subtitleColor = 'text-muted',
  change,
  periodText,
  icon,
  iconBg,
}: MetricCardProps) {
  const isPositive = change !== undefined ? change >= 0 : true;

  return (
    <div className="bg-surface border border-separator rounded-2xl flex flex-col justify-between items-start min-h-32">
      <div className="flex justify-between w-full p-4">
        <h3 className="text-body font-medium">{title}</h3>
        <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
      </div>
      <div className="rounded-xl w-full p-4 border-t border-t-separator shadow-md">
        <div className="text-h3 font-bold  leading-none mb-3 tabular-nums">{value}</div>

        {change !== undefined ? (
          <div className="text-xs font-medium">
            <span
              className={`inline-flex items-center gap-1 font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}
            >
              {isPositive ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
              {isPositive ? '+' : ''}
              {change.toFixed(1)}%
            </span>
            {periodText && <span className="text-muted ml-1.5">vs. {periodText}</span>}
          </div>
        ) : subtitle ? (
          <div className={`text-xs font-medium ${subtitleColor}`}>{subtitle}</div>
        ) : (
          <div className="text-xs font-medium text-muted invisible">Placeholder</div>
        )}
      </div>
    </div>
  );
}
