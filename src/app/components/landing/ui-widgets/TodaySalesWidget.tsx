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

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-2xl font-extrabold tracking-tight text-primary tabular-nums font-display">
            GH₵ 12,840
          </div>
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

        {/* Minimalist Sparkline */}
        <div className="hidden sm:block h-10 w-24 ml-4 shrink-0">
          <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <path
              d="M0,35 C15,35 20,15 35,25 C50,35 65,5 80,15 C90,20 95,5 100,5"
              fill="none"
              stroke="currentColor"
              className="text-brand-primary"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M0,35 C15,35 20,15 35,25 C50,35 65,5 80,15 C90,20 95,5 100,5 L100,40 L0,40 Z"
              fill="currentColor"
              className="text-brand-primary/10"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
