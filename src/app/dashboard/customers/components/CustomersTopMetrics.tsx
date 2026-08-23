import { Users, UserCheck, ShoppingBag, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface CustomersTopMetricsProps {
  totalCustomers: number;
  activeCustomers: number;
  totalOrders: number;
  totalRevenue: number;
}

export function CustomersTopMetrics({
  totalCustomers,
  activeCustomers,
  totalOrders,
  totalRevenue
}: CustomersTopMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-separator bg-surface">
      <div className="bg-surface rounded-2xl p-6 border border-separator shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-text-secondary mb-1">Total customers</p>
            <h3 className="text-2xl font-bold text-text-primary">{totalCustomers}</h3>
          </div>
          <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
            <Users size={20} />
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-6 border border-separator shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-text-secondary mb-1">Active customers</p>
            <h3 className="text-2xl font-bold text-text-primary">{activeCustomers}</h3>
            <p className="text-xs text-text-muted mt-2">Ordered in last 90 days</p>
          </div>
          <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
            <UserCheck size={20} />
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-6 border border-separator shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-text-secondary mb-1">Customer orders</p>
            <h3 className="text-2xl font-bold text-text-primary">{totalOrders}</h3>
          </div>
          <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
            <ShoppingBag size={20} />
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-6 border border-separator shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-text-secondary mb-1">Customer revenue</p>
            <h3 className="text-2xl font-bold text-text-primary">{formatCurrency(totalRevenue)}</h3>
          </div>
          <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
            <DollarSign size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
