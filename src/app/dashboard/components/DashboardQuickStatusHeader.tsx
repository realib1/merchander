import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Ship } from 'lucide-react';
import type { DashboardMetrics } from '@/types/dashboard';

interface DashboardQuickStatusHeaderProps {
  metrics: DashboardMetrics;
  period: 'today' | '7d' | '30d' | '90d';
}

export function DashboardQuickStatusHeader({ metrics, period }: DashboardQuickStatusHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider mr-1">Quick status:</span>

        {metrics.attention.lowStock.length > 0 && (
          <Link
            href="/dashboard/inventory"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-warning/10 text-warning border border-warning/20 rounded-full text-xs font-medium hover:bg-warning/20 transition-colors"
          >
            <AlertTriangle size={13} /> {metrics.attention.lowStock.length} products low
          </Link>
        )}

        {metrics.attention.supplierBalances.length > 0 && (
          <Link
            href="/dashboard/payments"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-warning/10 text-warning border border-warning/20 rounded-full text-xs font-medium hover:bg-warning/20 transition-colors"
          >
            <AlertTriangle size={13} /> {metrics.attention.supplierBalances.length} balances due
          </Link>
        )}

        {metrics.incoming && (
          <Link
            href="/dashboard/purchasing"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-elevated text-foreground border border-separator rounded-full text-xs font-medium hover:bg-surface transition-colors"
          >
            <Ship size={13} className="text-brand-primary" /> {metrics.incoming.id} arriving soon
          </Link>
        )}

        <Link
          href="/dashboard/payments"
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-success/10 text-success border border-success/20 rounded-full text-xs font-medium hover:bg-success/20 transition-colors"
        >
          <CheckCircle2 size={13} /> All systems operational
        </Link>
      </div>

      <div className="flex items-center bg-surface-elevated border border-separator rounded-lg overflow-hidden text-xs sm:text-sm font-medium shrink-0 shadow-xs">
        {(['today', '7d', '30d', '90d'] as const).map((p) => (
          <Link
            key={p}
            href={`?period=${p}`}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 transition-colors ${
              period === p ? 'bg-brand-primary text-white font-semibold' : 'text-muted hover:text-foreground'
            }`}
          >
            {p === 'today' ? 'Today' : p === '7d' ? '7 days' : p === '30d' ? '30 days' : '90 days'}
          </Link>
        ))}
      </div>
    </header>
  );
}
