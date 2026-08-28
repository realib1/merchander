'use client';

import React from 'react';
import { ChannelPerformance, OrderStatusFunnelItem, PaymentMethodDistribution } from '@/types/analytics';
import { formatCurrency } from '@/utils/format';
import { Globe, Layers, Smartphone, Wallet } from 'lucide-react';

interface AnalyticsChannelAndPaymentsProps {
  channels: ChannelPerformance[];
  paymentMethods: PaymentMethodDistribution[];
  statusFunnel: OrderStatusFunnelItem[];
}

export function AnalyticsChannelAndPayments({
  channels,
  paymentMethods,
  statusFunnel,
}: AnalyticsChannelAndPaymentsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* 1. Sales Channel Performance */}
      <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
              <Globe size={15} className="text-brand-primary" /> Sales Channels
            </h3>
            <span className="text-[11px] text-muted font-medium">GMV Share</span>
          </div>

          <div className="space-y-4">
            {channels.map((ch) => (
              <div key={ch.channel} className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-semibold text-foreground">{ch.label}</span>
                  <div className="text-right">
                    <span className="font-bold text-foreground">{formatCurrency(ch.gmv, 'GHS')}</span>
                    <span className="text-muted text-[11px] ml-1.5">({ch.sharePct.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-primary rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(ch.sharePct, ch.gmv > 0 ? 3 : 0)}%` }}
                  />
                </div>
                <div className="text-[11px] text-muted">
                  {ch.ordersCount} {ch.ordersCount === 1 ? 'order' : 'orders'} placed
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Payment Rails Breakdown */}
      <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
              <Wallet size={15} className="text-brand-secondary" /> Payment Methods
            </h3>
            <span className="text-[11px] text-muted font-medium">Cashflow</span>
          </div>

          <div className="space-y-4">
            {paymentMethods.map((pm) => (
              <div key={pm.method} className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Smartphone size={12} className="text-muted" /> {pm.label}
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-foreground">{formatCurrency(pm.volume, 'GHS')}</span>
                    <span className="text-muted text-[11px] ml-1.5">({pm.sharePct.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-secondary rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(pm.sharePct, pm.volume > 0 ? 3 : 0)}%` }}
                  />
                </div>
                <div className="text-[11px] text-muted">
                  {pm.count} {pm.count === 1 ? 'settlement' : 'settlements'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Order Status Funnel */}
      <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
              <Layers size={15} className="text-info" /> Order Pipeline Funnel
            </h3>
            <span className="text-[11px] text-muted font-medium">Conversion</span>
          </div>

          <div className="space-y-3">
            {statusFunnel.map((item) => (
              <div
                key={item.status}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-elevated/40 border border-separator/40 text-xs"
              >
                <div>
                  <div className="font-semibold text-foreground">{item.label}</div>
                  <div className="text-[11px] text-muted mt-0.5">
                    {item.count} {item.count === 1 ? 'order' : 'orders'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground">{formatCurrency(item.value, 'GHS')}</div>
                  <div className="text-[10px] font-semibold text-muted">{item.sharePct.toFixed(1)}% of volume</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
