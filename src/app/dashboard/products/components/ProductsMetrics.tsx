import React from 'react';
import { Box, DollarSign, ShoppingBag, Package } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { Product, ProductVariant, OrderItem } from '@/types/product';
import { MetricCard } from '@/components/ui/MetricCard';

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Total Products"
        value={totalProducts.toLocaleString()}
        icon={<Package size={14} />}
        subtitle={`${activeProducts} active in catalog`}
        iconBg="bg-brand-primary/10 text-brand-primary"
      />
      <MetricCard
        title="Inventory Units"
        value={totalStock.toLocaleString()}
        icon={<Box size={14} />}
        subtitle={lowStockVariants > 0 ? `${lowStockVariants} products low on stock` : 'Stock levels healthy'}
        subtitleColor={lowStockVariants > 0 ? 'text-warning' : 'text-muted'}
        iconBg="bg-warning/10 text-warning"
      />
      <MetricCard
        title="Catalog Value"
        value={formatCurrency(catalogValue)}
        icon={<DollarSign size={14} />}
        subtitle="Current retail inventory value"
        iconBg="bg-success/10 text-success"
      />
      <MetricCard
        title="Units Sold"
        value={totalUnitsSold.toLocaleString()}
        icon={<ShoppingBag size={14} />}
        subtitle="All-time completed orders"
        iconBg="bg-info/10 text-info"
      />
    </div>
  );
}
