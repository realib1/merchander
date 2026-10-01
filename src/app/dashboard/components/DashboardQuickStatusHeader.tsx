import Link from 'next/link';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Ship,
  ShoppingBag,
  PackagePlus,
  Receipt,
  UserPlus,
} from 'lucide-react';
import type { DashboardMetrics } from '@/types/dashboard';

interface DashboardQuickStatusHeaderProps {
  metrics: DashboardMetrics;
  period: 'today' | '7d' | '30d' | '90d';
}

export function DashboardQuickStatusHeader({ metrics, period }: DashboardQuickStatusHeaderProps) {
  return (
    <div className="flex flex-col gap-4 mt-1">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Status Badges with Contextual Icons (Tastea pattern) */}
        <div className="flex flex-wrap items-center gap-2">
          {metrics.attention.lowStock.length > 0 && (
            <Link
              href="/dashboard/inventory"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-warning/10 text-warning border border-warning/25 rounded-full text-xs font-semibold hover:bg-warning/20 transition-all shadow-2xs"
            >
              <AlertTriangle size={13} className="shrink-0" />
              <span>{metrics.attention.lowStock.length} products low</span>
            </Link>
          )}

          {metrics.attention.supplierBalances.length > 0 && (
            <Link
              href="/dashboard/payments"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-destructive/10 text-destructive border border-destructive/25 rounded-full text-xs font-semibold hover:bg-destructive/20 transition-all shadow-2xs"
            >
              <AlertCircle size={13} className="shrink-0" />
              <span>{metrics.attention.supplierBalances.length} balances due</span>
            </Link>
          )}

          {metrics.incoming && (
            <Link
              href="/dashboard/purchasing"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface border border-separator/80 text-foreground rounded-full text-xs font-medium hover:bg-surface-elevated transition-all shadow-2xs"
            >
              <Ship size={13} className="text-brand-primary shrink-0" />
              <span>{metrics.incoming.id} arriving soon</span>
            </Link>
          )}

          <Link
            href="/dashboard/payments"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-success/10 text-success border border-success/20 rounded-full text-xs font-semibold hover:bg-success/20 transition-all shadow-2xs"
          >
            <CheckCircle2 size={13} className="text-success shrink-0" />
            <span>All systems operational</span>
          </Link>
        </div>

        {/* Apex/Zenith Segmented Filter Control */}
        <div className="inline-flex items-center p-1 bg-surface border border-separator/80 rounded-xl shadow-2xs shrink-0 text-xs w-full sm:w-auto justify-between sm:justify-start">
          {(['today', '7d', '30d', '90d'] as const).map((p) => {
            const isSelected = period === p;
            return (
              <Link
                key={p}
                href={`?period=${p}`}
                className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-3 py-1.5 rounded-lg transition-all font-semibold ${
                  isSelected
                    ? 'bg-brand-primary text-white shadow-2xs'
                    : 'text-muted hover:text-foreground hover:bg-surface-elevated/80'
                }`}
              >
                {p === 'today' ? 'Today' : p === '7d' ? '7 days' : p === '30d' ? '30 days' : '90 days'}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Quick Primary Actions Bar */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <Link
          href="/dashboard/orders/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-hover shadow-2xs transition-all hover:scale-[1.02]"
        >
          <ShoppingBag size={14} />
          <span>New Order</span>
        </Link>
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface border border-separator/80 text-foreground text-xs font-medium hover:bg-surface-elevated hover:border-separator transition-all shadow-2xs"
        >
          <PackagePlus size={14} className="text-brand-primary" />
          <span>Add Product</span>
        </Link>
        <Link
          href="/dashboard/expenses"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface border border-separator/80 text-foreground text-xs font-medium hover:bg-surface-elevated hover:border-separator transition-all shadow-2xs"
        >
          <Receipt size={14} className="text-brand-primary" />
          <span>Record Expense</span>
        </Link>
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface border border-separator/80 text-foreground text-xs font-medium hover:bg-surface-elevated hover:border-separator transition-all shadow-2xs"
        >
          <UserPlus size={14} className="text-brand-primary" />
          <span>Add Customer</span>
        </Link>
      </div>
    </div>
  );
}
