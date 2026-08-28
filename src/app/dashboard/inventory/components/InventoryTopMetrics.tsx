import React from 'react';
import { Package, CircleDollarSign, AlertTriangle, OctagonAlert } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { MetricCard } from '@/components/ui/MetricCard';

interface InventoryTopMetricsProps {
  totalUnits: number;
  totalVariants: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export function InventoryTopMetrics({
  totalUnits,
  totalVariants,
  totalValue,
  lowStockCount,
  outOfStockCount,
}: InventoryTopMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Inventory Units"
        value={totalUnits.toLocaleString()}
        subtitle={`Across ${totalVariants} tracked SKUs`}
        icon={<Package size={14} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
      />
      <MetricCard
        title="Inventory Value"
        value={formatCurrency(totalValue)}
        subtitle="Current retail stock value"
        icon={<CircleDollarSign size={14} />}
        iconBg="bg-success/10 text-success"
      />
      <MetricCard
        title="Low Stock"
        value={lowStockCount}
        subtitle="Reorder recommended"
        subtitleColor="text-warning"
        icon={<AlertTriangle size={14} />}
        iconBg="bg-warning/10 text-warning"
      />
      <MetricCard
        title="Out of Stock"
        value={outOfStockCount}
        subtitle="Requires attention"
        subtitleColor="text-destructive"
        icon={<OctagonAlert size={14} />}
        iconBg="bg-destructive/10 text-destructive"
      />
    </div>
  );
}
