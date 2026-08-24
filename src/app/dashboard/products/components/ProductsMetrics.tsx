import { Box, DollarSign, ShoppingBag, Package } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { Product, ProductVariant, OrderItem } from '@/types/product';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  subtitleColor: string;
  icon: React.ElementType;
  iconBg: string;
}

function MetricCard({ title, value, subtitle, subtitleColor, icon: Icon, iconBg }: MetricCardProps) {
  return (
    <div className="bg-surface border border-separator rounded-2xl flex flex-col justify-between items-start min-h-32">
      <div className="flex justify-between w-full p-4">
        <h3 className="text-body font-medium">{title}</h3>
        <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={14} strokeWidth={2.5} />
        </div>
      </div>
      <div className="rounded-xl w-full p-4 border-t border-t-separator shadow-md">
        <div className="text-h3 font-bold  leading-none mb-3 tabular-nums">{value}</div>
        <div className={`text-xs font-medium ${subtitleColor}`}>{subtitle}</div>
      </div>
    </div>
  );
}

export function ProductsMetrics({ products }: { products: Product[] }) {
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.is_active).length;

  let totalStock = 0;
  let lowStockVariants = 0;
  let catalogValue = 0;
  let totalUnitsSold = 0;

  products.forEach((product) => {
    product.variants?.forEach((variant: ProductVariant) => {
      const variantStock =
        variant.inventory?.reduce((acc: number, inv: { quantity: number }) => acc + (inv.quantity || 0), 0) || 0;
      totalStock += variantStock;
      catalogValue += variantStock * (variant.price || 0);

      if (variantStock < 10) {
        lowStockVariants++;
      }

      const sold =
        variant.order_items?.reduce((acc: number, item: OrderItem) => {
          const status = item.order?.status || item.orders?.status;
          if (status !== 'draft' && status !== 'cancelled') {
            return acc + (item.quantity || 0);
          }
          return acc;
        }, 0) || 0;
      totalUnitsSold += sold;
    });
  });

  const metrics = [
    {
      title: 'Total products',
      value: totalProducts.toLocaleString(),
      icon: Package,
      subtitle: `${activeProducts} active products`,
      trend: 'neutral',
      iconBg: 'bg-brand-primary/10 text-brand-primary',
    },
    {
      title: 'Inventory units',
      value: totalStock.toLocaleString(),
      icon: Box,
      subtitle: lowStockVariants > 0 ? `${lowStockVariants} products low on stock` : 'Stock levels healthy',
      trend: lowStockVariants > 0 ? 'warning' : 'neutral',
      iconBg: 'bg-warning/10 text-warning',
    },
    {
      title: 'Catalog value',
      value: formatCurrency(catalogValue),
      icon: DollarSign,
      subtitle: 'Based on current stock',
      trend: 'neutral',
      iconBg: 'bg-success/10 text-success',
    },
    {
      title: 'Units sold',
      value: totalUnitsSold.toLocaleString(),
      icon: ShoppingBag,
      subtitle: 'All-time completed orders',
      trend: 'neutral',
      iconBg: 'bg-info/10 text-info',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          subtitle={metric.subtitle}
          subtitleColor={
            metric.trend === 'warning'
              ? 'text-orange-500'
              : metric.trend === 'positive'
                ? 'text-emerald-500'
                : 'text-muted'
          }
          icon={metric.icon}
          iconBg={metric.iconBg}
        />
      ))}
    </div>
  );
}
