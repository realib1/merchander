import React from 'react';
import { ArrowRight } from 'lucide-react';

export function LowStockWidget() {
  return (
    <div className="group relative rounded-2xl border border-separator bg-surface p-4 sm:p-5 shadow-2xs transition-colors duration-150">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400">
          LOW STOCK
        </span>
        <span className="flex h-2 w-2 rounded-full bg-amber-500" />
      </div>

      <div className="mt-2.5">
        <div className="text-sm sm:text-base font-bold text-primary">Golden Penny 1kg</div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-amber-600 dark:text-amber-400 font-medium">8 units left</span>
          <span className="inline-flex items-center gap-1 font-semibold text-brand-primary group-hover:underline">
            Reorder <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
