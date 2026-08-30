import { getCustomerById, getCustomerIdentities } from '@/app/actions/customers';
import { formatGhanaLocalDisplay } from '@/utils/phone';
import { formatCurrency, formatDate } from '@/utils/format';
import { ArrowLeft, Mail, Phone, User, ShoppingBag, TrendingUp, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { MetricCard } from '../../components/MetricCard';
import { CustomerIdentitiesCard, CustomerIdentity } from './components/CustomerIdentitiesCard';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomerById(id).catch(() => null);
  return {
    title: customer ? `${customer.name || 'Customer Profile'} | Merchander` : 'Customer Profile | Merchander',
  };
}

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [customer, identities] = await Promise.all([getCustomerById(id), getCustomerIdentities(id)]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="bg-purple-500/10 text-purple-500 px-3 py-1 rounded-full text-xs font-medium">Draft</span>
        );
      case 'pending_payment':
        return (
          <span className="bg-warning/10 text-warning px-3 py-1 rounded-full text-xs font-medium">Awaiting Pay</span>
        );
      case 'paid':
        return (
          <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-medium">Paid</span>
        );
      case 'dispatched':
        return (
          <span className="bg-brand-secondary/10 text-brand-secondary px-3 py-1 rounded-full text-xs font-medium">
            Dispatched
          </span>
        );
      case 'cancelled':
        return <span className="bg-error/10 text-error px-3 py-1 rounded-full text-xs font-medium">Cancelled</span>;
      default:
        return <span className="bg-surface-elevated  px-3 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 overflow-y-auto pb-8 h-full">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/dashboard/customers"
            className="inline-flex items-center gap-2 text-sm  hover:text-brand-primary transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to Customers
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shrink-0">
              <User size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold  tracking-tight font-display">{customer.name || 'Unnamed Customer'}</h1>
              <div className="flex gap-4 mt-2 text-sm  font-medium">
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-muted" /> {formatGhanaLocalDisplay(customer.phone)}
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} className="text-muted" /> {customer.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <MetricCard
          title="Lifetime Value"
          value={formatCurrency(customer.stats.totalSpent)}
          subtitle="Total revenue from customer"
          icon={<TrendingUp size={14} />}
          iconBg="bg-brand-primary/10 text-brand-primary"
        />
        <MetricCard
          title="Total Orders"
          value={customer.stats.totalOrders}
          subtitle="All-time orders placed"
          icon={<ShoppingBag size={14} />}
          iconBg="bg-purple-500/10 text-purple-500"
        />
        <MetricCard
          title="Avg. Order Value"
          value={formatCurrency(customer.stats.aov)}
          subtitle="Average spent per order"
          icon={<CreditCard size={14} />}
          iconBg="bg-emerald-500/10 text-emerald-500"
        />
      </div>

      <CustomerIdentitiesCard customerId={id} initialIdentities={(identities || []) as unknown as CustomerIdentity[]} />

      <div className="mt-2">
        <h2 className="text-xl font-bold text-foreground mb-4 font-display">Order History</h2>
        <div className="bg-surface border border-separator rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface-elevated border-b border-separator  text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Order ID</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Items</th>
                  <th className="px-6 py-4 font-semibold text-right">Total</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator">
                {customer.orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted italic">
                      This customer hasn&apos;t placed any orders yet.
                    </td>
                  </tr>
                ) : (
                  (
                    customer.orders as unknown as {
                      id: string;
                      created_at: string;
                      items?: { id: string }[] | null;
                      total_amount: number;
                      delivery_fee?: number | null;
                      status: string;
                    }[]
                  ).map((order) => (
                    <tr key={order.id} className="hover:bg-surface-elevated/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/orders?q=${order.id.substring(0, 8)}`}
                          className="font-mono font-medium text-brand-primary hover:underline"
                        >
                          #{order.id.substring(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-6 py-4  text-xs">{formatDate(order.created_at)}</td>
                      <td className="px-6 py-4  text-xs">{order.items?.length || 0} items</td>
                      <td className="px-6 py-4 font-bold  text-right">
                        {formatCurrency(order.total_amount - (order.delivery_fee || 0))}
                      </td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(order.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
