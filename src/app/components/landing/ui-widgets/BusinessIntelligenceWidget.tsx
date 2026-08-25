import React from 'react';
import { ArrowUpRight, AlertTriangle, Users, CheckCircle2 } from 'lucide-react';

export function BusinessIntelligenceWidget() {
  return (
    <div className="rounded-2xl border border-separator bg-surface p-5 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-separator pb-4 mb-5">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-primary font-display">Your Business This Month</h3>
          <p className="text-xs text-muted mt-0.5">Live daily numbers</p>
        </div>
        <div className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-primary">
          <span>Live Summary</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Metric 1: Total Sales */}
        <div className="rounded-xl border border-separator bg-surface-elevated p-3.5 sm:p-4">
          <div className="text-xs font-semibold text-muted uppercase">Gross Sales</div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-primary font-display tabular-nums">GH₵ 84,200</span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" /> 18%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted">vs GH₵ 71,350 last month</p>
        </div>

        {/* Metric 2: Estimated Gross Profit */}
        <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-3.5 sm:p-4">
          <div className="text-xs font-semibold text-brand-primary uppercase">Estimated Gross Profit</div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-brand-primary font-display tabular-nums">
              GH₵ 14,850
            </span>
            <span className="text-xs font-bold text-brand-primary">17.6% margin</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Stock cost & shipping deducted</p>
        </div>

        {/* Metric 3: Fast-Moving Products */}
        <div className="rounded-xl border border-separator bg-surface-elevated p-3.5 sm:p-4">
          <div className="text-xs font-semibold text-muted uppercase">Fast-Moving Products</div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-primary font-display tabular-nums">12 items</span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Selling fast</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Brings in 62% of monthly sales</p>
        </div>

        {/* Metric 4: Low-Stock Products */}
        <div className="rounded-xl border border-separator bg-surface-elevated p-3.5 sm:p-4">
          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Low-Stock Products
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-primary font-display tabular-nums">7 items</span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Reorder soon</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Will run out in 4–6 days</p>
        </div>

        {/* Metric 5: Customer Credit */}
        <div className="rounded-xl border border-separator bg-surface-elevated p-3.5 sm:p-4">
          <div className="text-xs font-semibold text-muted uppercase flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Customer Credit
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-primary font-display tabular-nums">GH₵ 8,420</span>
            <span className="text-xs font-medium text-muted">14 accounts</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">GH₵ 3,100 collected this week</p>
        </div>

        {/* Metric 6: Supplier Orders */}
        <div className="rounded-xl border border-separator bg-surface-elevated p-3.5 sm:p-4">
          <div className="text-xs font-semibold text-muted uppercase flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Supplier Orders
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-primary font-display tabular-nums">3 shipments</span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">On schedule</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Next arrival: sea freight Friday</p>
        </div>
      </div>
    </div>
  );
}
