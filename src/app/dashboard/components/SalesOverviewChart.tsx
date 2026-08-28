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

  const strokeColor = 'var(--color-brand-primary)';
  const fillColor = 'var(--color-brand-primary)';
  const gridColor = 'var(--color-separator)';
  const textColor = 'var(--color-secondary)';

  return (
    <div className="w-full h-75 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={fillColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={fillColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis
            dataKey="formattedDate"
            axisLine={false}
            tickLine={false}
            tick={{ fill: textColor, fontSize: 10 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: textColor, fontSize: 10 }}
            tickFormatter={(value: number) => `₵${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-separator)',
              borderRadius: '8px',
              color: 'var(--color-primary)',
            }}
            itemStyle={{ color: strokeColor }}
            formatter={(value: number) => [formatCurrency(value), 'Sales']}
            labelStyle={{ color: textColor, marginBottom: '4px' }}
          />
          <Area
            type="monotone"
            dataKey="sales"
            stroke={strokeColor}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorSales)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
