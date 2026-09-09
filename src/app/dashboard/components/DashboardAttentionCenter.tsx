import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { DashboardMetrics } from '@/types/dashboard';

interface DashboardAttentionCenterProps {
  attention: DashboardMetrics['attention'];
}

export function DashboardAttentionCenter({ attention }: DashboardAttentionCenterProps) {
  const hasItems =
    attention.purchaseOrders.length > 0 || attention.lowStock.length > 0 || attention.supplierBalances.length > 0;

  return (
    <div className="lg:col-span-4 bg-surface border border-separator rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-87.5">
      <div className="px-6 py-4 border-b border-separator bg-surface-elevated">
        <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle size={15} className="text-warning" /> Needs your attention
        </h2>
      </div>
      <div className="divide-y divide-separator overflow-y-auto flex-1">
        {attention.purchaseOrders.map((po) => (
          <div
            key={po.id}
            className="px-6 py-4 flex items-center justify-between hover:bg-surface-elevated/50 transition-colors"
          >
            <div>
              <div className="font-semibold text-sm text-foreground">Purchase order arriving {po.eta}</div>
              <div className="text-xs text-muted mt-0.5">
                {po.id} - {po.supplierName}
              </div>
              <div className="text-xs text-muted mt-1.5 flex items-center gap-2">
                <span className="bg-surface-elevated px-2 py-0.5 rounded border border-separator text-foreground tabular-nums">
                  {po.units} units
                </span>
                <span className="bg-brand-primary/10 text-brand-primary font-medium px-2 py-0.5 rounded tabular-nums">
                  {po.preOrders} pre-orders
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/purchasing"
              className="text-xs font-medium text-brand-primary hover:text-brand-primary/80 flex items-center gap-0.5 transition-colors"
            >
              View <ChevronRight size={14} />
            </Link>
          </div>
        ))}

        {attention.lowStock.map((stock) => (
          <div
            key={stock.id}
            className="px-6 py-4 flex items-center justify-between hover:bg-surface-elevated/50 transition-colors"
          >
            <div>
              <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                Low stock <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              </div>
              <div className="text-xs text-muted mt-0.5">
                {stock.name} - {stock.size}
              </div>
              <div className="text-xs text-muted mt-1.5 flex items-center gap-2">
                <span className="bg-destructive/10 text-destructive font-medium px-2 py-0.5 rounded tabular-nums">
                  {stock.remaining} units remaining
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/inventory"
              className="text-xs font-medium text-brand-primary hover:text-brand-primary/80 flex items-center gap-0.5 transition-colors"
            >
              Restock <ChevronRight size={14} />
            </Link>
          </div>
        ))}

        {attention.supplierBalances.map((bal) => (
          <div
            key={bal.id}
            className="px-6 py-4 flex items-center justify-between hover:bg-surface-elevated/50 transition-colors"
          >
            <div>
              <div className="font-semibold text-sm text-foreground">Supplier balance</div>
              <div className="text-xs text-muted mt-0.5">{bal.supplierName}</div>
              <div className="text-xs text-warning mt-1.5 font-medium tabular-nums">
                {formatCurrency(bal.balance, 'USD', 'en-US')} outstanding
              </div>
            </div>
            <Link
              href="/dashboard/suppliers"
              className="text-xs font-medium text-brand-primary hover:text-brand-primary/80 flex items-center gap-0.5 transition-colors"
            >
              View <ChevronRight size={14} />
            </Link>
          </div>
        ))}

        {!hasItems && (
          <div className="px-6 py-8 text-center">
            <CheckCircle2 size={28} className="text-success mx-auto mb-2 opacity-60" />
            <p className="text-sm text-muted">You&apos;re all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
