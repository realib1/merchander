import React from 'react';
import { Users, ChevronRight } from 'lucide-react';

export function CustomerCreditWidget() {
  return (
    <div className="group relative rounded-2xl border border-separator bg-surface p-4 sm:p-5 shadow-2xs transition-colors duration-150">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider uppercase text-muted">CUSTOMER CREDIT</span>
        <div className="flex items-center gap-1 text-xs text-secondary font-medium">
          <Users className="h-3.5 w-3.5" />
          <span>14 accounts</span>
        </div>
      </div>

      <div className="mt-2.5">
        <div className="text-xl font-bold tracking-tight text-primary tabular-nums font-display">
          GH₵ 4,820 <span className="text-xs font-normal text-muted">due</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-secondary">
          <span>Oldest: 12 days ago</span>
          <span className="inline-flex items-center text-xs font-semibold text-brand-primary group-hover:underline">
            View <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
