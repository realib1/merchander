import React from 'react';
import { Package, CircleDollarSign, AlertTriangle, OctagonAlert } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  subtitleColor: string;
  icon: React.ReactNode;
  iconBg: string;
}

function MetricCard({ title, value, subtitle, subtitleColor, icon, iconBg }: MetricCardProps) {
  return (
    <div className="bg-surface border border-separator rounded-2xl flex flex-col justify-between items-start min-h-32">
      <div className="flex justify-between w-full p-4">
        <h3 className="text-body font-medium text-secondary">{title}</h3>
        <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div className="rounded-xl w-full p-4 border-t border-t-separator shadow-md">
        <div className="text-h3 font-bold text-primary leading-none mb-3 tabular-nums">
          {value}
        </div>
        <div className={`text-xs font-medium ${subtitleColor}`}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Inventory units"
        value={totalUnits.toLocaleString()}
        subtitle={`Across ${totalVariants} tracked SKUs`}
        subtitleColor="text-muted"
        icon={<Package size={14} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
      />
      <MetricCard
        title="Inventory value"
        value={formatCurrency(totalValue)}
        subtitle="Current retail stock value"
        subtitleColor="text-muted"
        icon={<CircleDollarSign size={14} />}
        iconBg="bg-emerald-500/10 text-emerald-500"
      />
      <MetricCard
        title="Low stock"
        value={lowStockCount}
        subtitle="Reorder recommended"
        subtitleColor="text-warning"
        icon={<AlertTriangle size={14} />}
        iconBg="bg-warning/10 text-warning"
      />
      <MetricCard
        title="Out of stock"
        value={outOfStockCount}
        subtitle="Requires attention"
        subtitleColor="text-destructive"
        icon={<OctagonAlert size={14} />}
        iconBg="bg-destructive/10 text-destructive"
      />
    </div>
  );
}
