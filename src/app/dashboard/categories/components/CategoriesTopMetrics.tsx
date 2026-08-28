import React from 'react';
import { FolderTree, Package, LayoutGrid } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';

interface CategoriesTopMetricsProps {
  totalCategories: number;
  activeCategories: number;
  emptyCategories: number;
}

export function CategoriesTopMetrics({
  totalCategories,
  activeCategories,
  emptyCategories,
}: CategoriesTopMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <MetricCard
        title="Total Categories"
        value={totalCategories.toLocaleString()}
        subtitle="Organizing your catalog"
        icon={<FolderTree size={14} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
      />
      <MetricCard
        title="Active Categories"
        value={activeCategories.toLocaleString()}
        subtitle="Containing live products"
        subtitleColor="text-success"
        icon={<Package size={14} />}
        iconBg="bg-success/10 text-success"
      />
      <MetricCard
        title="Empty Categories"
        value={emptyCategories}
        subtitle="No products assigned yet"
        subtitleColor={emptyCategories > 0 ? 'text-warning' : 'text-muted'}
        icon={<LayoutGrid size={14} />}
        iconBg={emptyCategories > 0 ? 'bg-warning/10 text-warning' : 'bg-surface-elevated text-muted'}
      />
    </div>
  );
}
