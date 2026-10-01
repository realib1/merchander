'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/format';

export interface SalesOverviewChartProps {
  data: {
    date: string;
    sales: number;
  }[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-separator/80 bg-surface/95 backdrop-blur-md p-3 shadow-lg text-xs">
        <p className="text-muted text-[11px] mb-1 font-medium">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_8px_var(--color-brand-primary)]" />
          <span className="font-extrabold text-foreground text-sm tabular-nums">
            {formatCurrency(payload[0].value)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function SalesOverviewChart({ data }: SalesOverviewChartProps) {
  // Determine if data spans multiple days or is within a single day
  const isSingleDay =
    data.length > 0 && data.every((d) => new Date(d.date).toDateString() === new Date(data[0].date).toDateString());

  // Format dates for the X-axis
  const formattedData = data.map((item) => {
    const d = new Date(item.date);
    return {
      ...item,
      formattedDate: isSingleDay
        ? d.toLocaleTimeString('en-US', { hour: 'numeric' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  const total = data.reduce((acc, curr) => acc + (curr.sales || 0), 0);
  const peak = data.length > 0 ? Math.max(...data.map((d) => d.sales || 0)) : 0;
  const avg = data.length > 0 ? total / data.length : 0;

  const strokeColor = 'var(--color-brand-primary)';
  const fillColor = 'var(--color-brand-primary)';
  const gridColor = 'var(--color-separator)';
  const textColor = 'var(--color-secondary)';

  return (
    <div className="w-full flex flex-col h-full justify-between">
      {/* Quick Summary Pill Bar (Apex & Zenith style) */}
      <div className="flex flex-wrap items-center gap-4 py-2 border-b border-separator/50 mb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-muted">Total:</span>
          <span className="font-bold text-foreground tabular-nums">{formatCurrency(total)}</span>
        </div>
        <div className="h-3 w-px bg-separator" />
        <div className="flex items-center gap-1.5">
          <span className="text-muted">Peak:</span>
          <span className="font-semibold text-foreground tabular-nums">{formatCurrency(peak)}</span>
        </div>
        <div className="h-3 w-px bg-separator" />
        <div className="flex items-center gap-1.5">
          <span className="text-muted">Avg:</span>
          <span className="font-semibold text-foreground tabular-nums">{formatCurrency(avg)}</span>
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillColor} stopOpacity={0.28} />
                <stop offset="100%" stopColor={fillColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} strokeOpacity={0.7} />
            <XAxis
              dataKey="formattedDate"
              axisLine={false}
              tickLine={false}
              tick={{ fill: textColor, fontSize: 11 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: textColor, fontSize: 11 }}
              tickFormatter={(value: number) => `₵${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="sales"
              stroke={strokeColor}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorSales)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
