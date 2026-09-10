import React from 'react';
import { Users, UserCheck, ShoppingBag, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { MetricCard } from '@/components/ui/MetricCard';

interface CustomersTopMetricsProps {
  totalCustomers: number;
  customersChange: number;
  activeCustomers: number;
  totalOrders: number;
  ordersChange: number;
  totalRevenue: number;
}

export function CustomersTopMetrics({
  totalCustomers,
  customersChange,
  activeCustomers,
  totalOrders,
  ordersChange,
  totalRevenue,
}: CustomersTopMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Total Customers"
        value={(Number(totalCustomers) || 0).toLocaleString()}
        change={Number.isFinite(customersChange) ? customersChange : 0}
        icon={<Users size={14} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
      />
      <MetricCard
        title="Active Customers"
        value={(Number(activeCustomers) || 0).toLocaleString()}
        subtitle="Ordered in last 90 days"
        icon={<UserCheck size={14} />}
        iconBg="bg-brand-secondary/10 text-brand-secondary"
      />
      <MetricCard
        title="Customer Orders"
        value={(Number(totalOrders) || 0).toLocaleString()}
        change={Number.isFinite(ordersChange) ? ordersChange : 0}
        icon={<ShoppingBag size={14} />}
        iconBg="bg-info/10 text-info"
      />
      <MetricCard
        title="Customer Revenue"
        value={formatCurrency(Number(totalRevenue) || 0)}
        subtitle="All-time customer sales"
        icon={<DollarSign size={14} />}
        iconBg="bg-success/10 text-success"
      />
    </div>
  );
}
