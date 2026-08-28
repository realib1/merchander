'use client';

import React, { useState } from 'react';
import { SalesTimelinePoint } from '@/types/analytics';
import { formatCurrency } from '@/utils/format';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';

interface AnalyticsTimelineChartProps {
  timeline: SalesTimelinePoint[];
  periodLabel: string;
}

type ChartMetricMode = 'gmv' | 'orders' | 'aov';

export function AnalyticsTimelineChart({ timeline, periodLabel }: AnalyticsTimelineChartProps) {
  const [metricMode, setMetricMode] = useState<ChartMetricMode>('gmv');

  const getMetricConfig = () => {
    switch (metricMode) {
      case 'orders':
        return {
          title: 'Order Volume Velocity',
          dataKey: 'ordersCount',
          formatter: (v: number) => `${v.toLocaleString()} orders`,
          yAxisFormatter: (v: number) => `${v}`,
          stroke: 'var(--brand-secondary, #6366f1)',
          fill: 'var(--brand-secondary, #6366f1)',
        };
      case 'aov':
        return {
          title: 'Average Basket Value',
          dataKey: 'aov',
          formatter: (v: number) => formatCurrency(v, 'GHS'),
          yAxisFormatter: (v: number) => `₵${v}`,
          stroke: 'var(--info, #0ea5e9)',
          fill: 'var(--info, #0ea5e9)',
        };
      case 'gmv':
      default:
        return {
          title: 'Gross Merchandise Value (GMV)',
          dataKey: 'gmv',
          formatter: (v: number) => formatCurrency(v, 'GHS'),
          yAxisFormatter: (v: number) => (v >= 1000 ? `₵${(v / 1000).toFixed(0)}k` : `₵${v}`),
          stroke: 'var(--brand-primary, #10b981)',
          fill: 'var(--brand-primary, #10b981)',
        };
    }
  };

  const config = getMetricConfig();

  return (
    <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs mb-6">
      {/* Chart Header & Metric Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground font-display flex items-center gap-2">
              <Activity size={18} className="text-brand-primary" /> Sales Velocity & Trends
            </h2>
            <span className="text-xs text-muted font-medium">({periodLabel})</span>
          </div>
          <p className="text-xs text-muted mt-0.5">Explore chronological sales flow and purchasing patterns</p>
        </div>

        {/* Switcher Pills */}
        <div className="inline-flex bg-surface-elevated border border-separator/80 rounded-xl p-1 gap-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetricMode('gmv')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
              metricMode === 'gmv' ? 'bg-surface text-foreground shadow-xs' : 'text-muted hover:text-foreground'
            }`}
          >
            <DollarSign size={13} /> GMV Sales
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('orders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
              metricMode === 'orders' ? 'bg-surface text-foreground shadow-xs' : 'text-muted hover:text-foreground'
            }`}
          >
            <ShoppingCart size={13} /> Orders
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('aov')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
              metricMode === 'aov' ? 'bg-surface text-foreground shadow-xs' : 'text-muted hover:text-foreground'
            }`}
          >
            <TrendingUp size={13} /> AOV
          </button>
        </div>
      </div>

      {/* Chart Container */}
      {timeline.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center text-muted border border-dashed border-separator rounded-xl">
          <Activity size={24} className="mb-2 opacity-50" />
          <p className="text-xs font-medium">No order transactions recorded in this period</p>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-primary, #10b981)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--brand-primary, #10b981)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--separator, #e2e8f0)" opacity={0.5} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted, #64748b)' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted, #64748b)' }}
                tickFormatter={config.yAxisFormatter}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const val = Number(payload[0].value);
                    return (
                      <div className="bg-surface border border-separator rounded-xl p-3 shadow-lg text-xs">
                        <div className="font-semibold text-foreground mb-1">{label}</div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand-primary" />
                          <span className="text-muted">{config.title}:</span>
                          <span className="font-bold text-foreground">{config.formatter(val)}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey={config.dataKey}
                stroke={config.stroke}
                strokeWidth={2.5}
                fill="url(#analyticsGradient)"
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
