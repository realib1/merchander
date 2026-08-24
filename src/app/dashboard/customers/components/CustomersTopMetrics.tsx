import React from 'react';
import { Users, UserCheck, ShoppingBag, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface CustomersTopMetricsProps {
  totalCustomers: number;
  customersChange: number;
  activeCustomers: number;
  totalOrders: number;
  ordersChange: number;
  totalRevenue: number;
}

import { MetricCard } from '../../components/MetricCard';

export function CustomersTopMetrics({
  totalCustomers,
  customersChange,
  activeCustomers,
  totalOrders,
  ordersChange,
  totalRevenue,
}: CustomersTopMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ">
      <MetricCard
        title="Total customers"
        value={totalCustomers.toLocaleString()}
        change={customersChange}
        icon={<Users size={14} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
      />
      <MetricCard
        title="Active customers"
        value={activeCustomers.toLocaleString()}
        subtitle="Ordered in last 90 days"
        icon={<UserCheck size={14} />}
        iconBg="bg-brand-secondary/10 text-brand-secondary"
      />
      <MetricCard
        title="Customer orders"
        value={totalOrders.toLocaleString()}
        change={ordersChange}
        icon={<ShoppingBag size={14} />}
        iconBg="bg-info/10 text-info"
      />
      <MetricCard
        title="Customer revenue"
        value={formatCurrency(totalRevenue)}
        subtitle="All-time"
        icon={<DollarSign size={14} />}
        iconBg="bg-success/10 text-success"
      />
    </div>
  );
}
