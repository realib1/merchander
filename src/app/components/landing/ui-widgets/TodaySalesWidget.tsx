import React from 'react';
import { ArrowUpRight, Globe, Store } from 'lucide-react';

export function TodaySalesWidget() {
  return (
    <div className="rounded-2xl border border-separator/80 bg-surface p-4 sm:p-5 shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider uppercase text-muted">TODAY</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ArrowUpRight className="h-3 w-3" />
          14.8%
        </span>
      </div>

      <div className="mt-2.5">
        <div className="text-2xl font-extrabold tracking-tight text-primary tabular-nums font-display">GH₵ 12,840</div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-secondary">
          <span className="inline-flex items-center gap-1">
            <Globe className="h-3 w-3 text-brand-primary" />
            24 Social & Online
          </span>
          <span className="text-separator">•</span>
          <span className="inline-flex items-center gap-1">
            <Store className="h-3 w-3 text-emerald-500" />
            14 In-store
          </span>
        </div>
      </div>
    </div>
  );
}
