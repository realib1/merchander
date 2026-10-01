import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface RecentOrder {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  customer?: { name?: string } | { name?: string }[] | null;
  order_items?: { count?: number } | { count?: number }[] | null;
}

interface DashboardRecentOrdersProps {
  orders: RecentOrder[] | null;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'delivered':
      return CheckCircle2;
    case 'paid':
      return Check;
    case 'dispatched':
      return Truck;
    case 'pending_payment':
    case 'pending':
      return Clock;
    case 'cancelled':
      return XCircle;
    case 'refunded':
      return RotateCcw;
    default:
      return AlertCircle;
  }
}

export function DashboardRecentOrders({ orders }: DashboardRecentOrdersProps) {
  return (
    <div className="lg:col-span-8 bg-surface border border-separator/70 rounded-xl shadow-2xs overflow-hidden flex flex-col min-h-87.5">
      <div className="px-6 py-4 border-b border-separator/60 bg-surface flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Recent Orders</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-elevated text-muted border border-separator/60">
            {orders ? orders.length : 0} latest
          </span>
        </div>
        <Link
          href="/dashboard/orders"
          className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1 transition-colors"
        >
          View all orders <ArrowRight size={13} />
        </Link>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-[11px] text-muted font-semibold uppercase tracking-wider bg-surface-elevated/40 border-b border-separator/60">
            <tr>
              <th className="px-6 py-3">Order</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Items</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator/60">
            {orders && orders.length > 0 ? (
              orders.map((order) => {
                const customerName = Array.isArray(order.customer)
                  ? order.customer[0]?.name
                  : (order.customer as { name?: string })?.name || 'Walk-in Customer';

                const customerInitial = customerName ? customerName.charAt(0).toUpperCase() : 'C';

                const itemCount = Array.isArray(order.order_items)
                  ? order.order_items[0]?.count || 0
                  : (order.order_items as { count?: number })?.count || 0;

                const isSuccess =
                  order.status === 'paid' || order.status === 'dispatched' || order.status === 'delivered';
                const isPending = order.status === 'pending_payment';
                const isCancelled = order.status === 'cancelled';
                const StatusIcon = getStatusIcon(order.status);

                return (
                  <tr key={order.id} className="hover:bg-surface-elevated/40 transition-colors group">
                    <td className="px-6 py-3.5">
                      <Link
                        href="/dashboard/orders"
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-elevated border border-separator/80 text-xs font-semibold text-foreground group-hover:border-brand-primary transition-colors"
                      >
                        #{order.id.substring(0, 6).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center text-[10px] shrink-0 border border-brand-primary/20">
                          {customerInitial}
                        </div>
                        <span className="font-medium text-foreground">{customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-muted tabular-nums text-xs">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-foreground tabular-nums">
                      {formatCurrency(Number(order.total_amount))}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${
                          isSuccess
                            ? 'bg-success/10 text-success border-success/20'
                            : isPending
                              ? 'bg-warning/10 text-warning border-warning/20'
                              : isCancelled
                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                : 'bg-surface-elevated text-muted border-separator/60'
                        }`}
                      >
                        <StatusIcon className="size-3 shrink-0" aria-hidden="true" />
                        <span>{order.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted text-sm">
                  No recent orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
