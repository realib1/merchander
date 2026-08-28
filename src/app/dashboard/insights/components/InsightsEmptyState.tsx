import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface InsightsEmptyStateProps {
  hasFilters?: boolean;
}

export function InsightsEmptyState({ hasFilters = false }: InsightsEmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="bg-surface border border-separator rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-60">
        <div className="w-12 h-12 bg-surface-elevated text-muted rounded-full flex items-center justify-center mb-3">
          <Sparkles size={22} />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">No matching insights found</h3>
        <p className="text-xs text-muted max-w-sm">
          Try selecting a different filter category or clearing your search term.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-separator rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-75">
      <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mb-4">
        <CheckCircle2 size={32} />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1">Operational Health is Optimal</h3>
      <p className="text-xs text-muted max-w-md">
        No critical stockout risks, negative product margins, or overdue customer credit balances were detected. Your
        business metrics are currently operating smoothly.
      </p>
    </div>
  );
}
