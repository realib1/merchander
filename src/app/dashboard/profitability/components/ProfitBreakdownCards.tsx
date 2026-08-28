import React from 'react';
import { CategoryProfitability, ChannelProfitability, ProfitabilityMetrics } from '@/types/profitability';
import { formatCurrency } from '@/utils/format';
import { FolderTree, Radio, PieChart } from 'lucide-react';

interface ProfitBreakdownCardsProps {
  categories: CategoryProfitability[];
  channels: ChannelProfitability[];
  metrics: ProfitabilityMetrics;
}

export function ProfitBreakdownCards({ categories, channels, metrics }: ProfitBreakdownCardsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
      {/* 1. Category Profit Contribution */}
      <div className="bg-surface border border-separator rounded-2xl p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <FolderTree size={15} className="text-brand-primary" /> Category Margins
            </h3>
            <span className="text-[10px] text-muted font-semibold">Profit Share</span>
          </div>

          <div className="space-y-4">
            {categories.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">No category sales recorded.</p>
            ) : (
              categories.slice(0, 5).map((cat) => (
                <div key={cat.categoryId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-foreground truncate max-w-35">{cat.categoryName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted">{cat.marginPct.toFixed(0)}% margin</span>
                      <span className="font-bold text-brand-primary">{formatCurrency(cat.grossProfit, 'GHS')}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, cat.profitSharePct))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 2. Channel Profitability */}
      <div className="bg-surface border border-separator rounded-2xl p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Radio size={15} className="text-brand-secondary" /> Sales Channels
            </h3>
            <span className="text-[10px] text-muted font-semibold">Margin %</span>
          </div>

          <div className="space-y-3.5">
            {channels.map((ch) => (
              <div
                key={ch.channel}
                className="p-3 bg-surface-elevated/70 border border-separator/60 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-foreground">{ch.label}</div>
                  <div className="text-[11px] text-muted mt-0.5">
                    {ch.orderCount} orders • {formatCurrency(ch.totalRevenue, 'GHS')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground">{formatCurrency(ch.grossProfit, 'GHS')}</div>
                  <div
                    className={`text-[10px] font-bold ${
                      ch.marginPct >= 30 ? 'text-success' : ch.marginPct > 0 ? 'text-warning' : 'text-muted'
                    }`}
                  >
                    {ch.marginPct.toFixed(1)}% margin
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Cost & Outlays Allocation */}
      <div className="bg-surface border border-separator rounded-2xl p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <PieChart size={15} className="text-success" /> Outlays & Deductions
            </h3>
            <span className="text-[10px] text-muted font-semibold">Total OPEX</span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-surface-elevated/60 border border-separator/60 rounded-xl flex items-center justify-between text-xs">
              <span className="text-secondary">General Operating Expenses</span>
              <span className="font-bold text-foreground">{formatCurrency(metrics.operatingExpenses, 'GHS')}</span>
            </div>

            <div className="p-3 bg-surface-elevated/60 border border-separator/60 rounded-xl flex items-center justify-between text-xs">
              <span className="text-secondary">Inbound Freight & Customs Duties</span>
              <span className="font-bold text-foreground">{formatCurrency(metrics.logisticsFreightCost, 'GHS')}</span>
            </div>

            <div className="p-3 bg-surface-elevated/60 border border-separator/60 rounded-xl flex items-center justify-between text-xs">
              <span className="text-secondary">Payment Processing & Telco Fees</span>
              <span className="font-bold text-foreground">{formatCurrency(metrics.gatewayFees, 'GHS')}</span>
            </div>

            <div className="pt-2 border-t border-separator flex items-center justify-between text-xs font-bold">
              <span className="text-foreground">Total Operating Deductions</span>
              <span className="text-destructive font-mono">{formatCurrency(metrics.totalExpenses, 'GHS')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
