'use client';

import React from 'react';
import { PeakTradingAnalytics } from '@/types/analytics';
import { formatCurrency } from '@/utils/format';
import { Clock, Calendar, Zap } from 'lucide-react';

interface AnalyticsPeakTradingProps {
  peakTrading: PeakTradingAnalytics;
}

export function AnalyticsPeakTrading({ peakTrading }: AnalyticsPeakTradingProps) {
  const maxDayGmv = Math.max(...peakTrading.dayOfWeekBreakdown.map((d) => d.gmv), 1);

  return (
    <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs mb-6">
      {/* Header & Quick Diagnostics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
            <Zap size={15} className="text-warning" /> Peak Trading & Velocity Heatmap
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Identify peak buying hours to schedule staff shifts and broadcast WhatsApp campaigns
          </p>
        </div>

        {/* Quick Highlights */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-surface-elevated border border-separator/60 flex items-center gap-2 text-xs">
            <Calendar size={13} className="text-brand-primary" />
            <span className="text-muted">Top Day:</span>
            <span className="font-bold text-foreground">{peakTrading.busiestDay}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-surface-elevated border border-separator/60 flex items-center gap-2 text-xs">
            <Clock size={13} className="text-brand-secondary" />
            <span className="text-muted">Top Window:</span>
            <span className="font-bold text-foreground">{peakTrading.busiestTimeWindow}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Day of Week Sales Velocity (7 Cols) */}
        <div className="lg:col-span-7 bg-surface-elevated/40 border border-separator/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Calendar size={13} className="text-brand-primary" /> Day of Week Performance
            </span>
            <span className="text-[11px] text-muted font-medium">GMV Share</span>
          </div>

          <div className="space-y-2.5">
            {peakTrading.dayOfWeekBreakdown.map((day) => {
              const isPeak = day.dayName === peakTrading.busiestDay && day.gmv > 0;
              const barWidth = (day.gmv / maxDayGmv) * 100;

              return (
                <div key={day.dayName} className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isPeak ? 'text-brand-primary' : 'text-foreground'}`}>
                        {day.dayName}
                      </span>
                      {isPeak && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-brand-primary/10 text-brand-primary">
                          <Zap size={9} /> Peak
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-foreground">{formatCurrency(day.gmv, 'GHS')}</span>
                      <span className="text-muted text-[11px] ml-1.5">({day.ordersCount} orders)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-separator/40">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isPeak ? 'bg-brand-primary' : 'bg-brand-secondary/70'
                      }`}
                      style={{ width: `${Math.max(barWidth, day.gmv > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Hourly Trading Windows (5 Cols) */}
        <div className="lg:col-span-5 bg-surface-elevated/40 border border-separator/50 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Clock size={13} className="text-brand-secondary" /> Time of Day Windows
              </span>
              <span className="text-[11px] text-muted font-medium">Revenue</span>
            </div>

            <div className="space-y-2.5">
              {peakTrading.hourlyBreakdown.map((hw) => (
                <div
                  key={hw.windowLabel}
                  className="p-2.5 rounded-lg bg-surface border border-separator/60 flex items-center justify-between text-xs hover:border-separator transition"
                >
                  <div>
                    <div className="font-semibold text-foreground">{hw.periodName}</div>
                    <div className="text-[11px] text-muted font-mono">{hw.windowLabel}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-foreground">{formatCurrency(hw.gmv, 'GHS')}</div>
                    <div className="text-[10px] text-muted">
                      {hw.ordersCount} {hw.ordersCount === 1 ? 'order' : 'orders'} • {hw.sharePct.toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
