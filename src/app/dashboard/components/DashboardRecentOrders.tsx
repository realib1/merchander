import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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

export function DashboardRecentOrders({ orders }: DashboardRecentOrdersProps) {
  return (
    <div className="lg:col-span-8 bg-surface border border-separator rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-87.5">
      <div className="px-6 py-4 border-b border-separator bg-surface-elevated flex items-center justify-between">
        <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Recent Orders</h2>
        <Link
          href="/dashboard/orders"
          className="text-xs sm:text-sm font-medium text-brand-primary hover:text-brand-primary/80 flex items-center gap-1 transition-colors"
        >
          View all orders <ArrowRight size={14} />
        </Link>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-muted uppercase bg-surface-elevated/40 border-b border-separator">
            <tr>
              <th className="px-6 py-3">Order</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Items</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {orders && orders.length > 0 ? (
              orders.map((order) => {
                const customerName = Array.isArray(order.customer)
                  ? order.customer[0]?.name
                  : (order.customer as { name?: string })?.name || 'Walk-in Customer';

                const itemCount = Array.isArray(order.order_items)
                  ? order.order_items[0]?.count || 0
                  : (order.order_items as { count?: number })?.count || 0;

                return (
                  <tr key={order.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <Link
                        href="/dashboard/orders"
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-elevated border border-separator font-mono text-xs font-semibold text-foreground hover:border-brand-primary transition-colors"
                      >
                        #{order.id.substring(0, 6).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-foreground">{customerName}</td>
                    <td className="px-6 py-3.5 text-muted tabular-nums text-xs">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-foreground tabular-nums">
                      {formatCurrency(Number(order.total_amount))}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          order.status === 'paid' || order.status === 'dispatched' || order.status === 'delivered'
                            ? 'bg-success/10 text-success'
                            : order.status === 'pending_payment'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-surface-elevated text-muted'
                        }`}
                      >
                        {order.status.replace('_', ' ')}
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
