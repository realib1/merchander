'use client';

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ProfitTimelinePoint } from '@/types/profitability';
import { formatCurrency } from '@/utils/format';

interface ProfitabilityTimelineChartProps {
  timeline: ProfitTimelinePoint[];
}

export function ProfitabilityTimelineChart({ timeline }: ProfitabilityTimelineChartProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-surface border border-separator rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center min-h-75 text-center">
        <p className="text-sm text-muted">No sales or financial activity recorded for this period.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-separator rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-95 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-bold text-foreground tracking-tight">Revenue vs Profit Velocity</h2>
          <p className="text-xs text-muted mt-0.5">
            Timeline breakdown of Gross Revenue, COGS, Outlays, and Net Profit.
          </p>
        </div>
      </div>

      <div className="w-full h-75">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-brand-primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-brand-primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-separator)" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--color-secondary)', fontSize: 10 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--color-secondary)', fontSize: 10 }}
              tickFormatter={(val: number) => `₵${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-separator)',
                borderRadius: '12px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                fontSize: '12px',
                color: 'var(--color-primary)',
              }}
              formatter={(value) => [formatCurrency(Number(value) || 0, 'GHS'), '']}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Gross Revenue"
              stroke="var(--color-brand-primary)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRev)"
            />
            <Area
              type="monotone"
              dataKey="netProfit"
              name="Net Profit"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorNet)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
