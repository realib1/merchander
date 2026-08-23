import React from 'react';
import { FolderTree, Package, LayoutGrid } from 'lucide-react';

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MetricCard
        title="Total Categories"
        value={totalCategories.toLocaleString()}
        subtitle="Organizing your catalog"
        subtitleColor="text-muted"
        icon={<FolderTree size={14} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
      />
      <MetricCard
        title="Active Categories"
        value={activeCategories.toLocaleString()}
        subtitle="Currently in use"
        subtitleColor="text-emerald-500"
        icon={<Package size={14} />}
        iconBg="bg-emerald-500/10 text-emerald-500"
      />
      <MetricCard
        title="Empty Categories"
        value={emptyCategories}
        subtitle="No products assigned"
        subtitleColor="text-warning"
        icon={<LayoutGrid size={14} />}
        iconBg="bg-warning/10 text-warning"
      />
    </div>
  );
}
