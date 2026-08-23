import { Box, DollarSign, ShoppingBag, Package } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { Product, ProductVariant, OrderItem } from '@/types/product';

export function ProductsMetrics({ products }: { products: Product[] }) {
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  
  let totalStock = 0;
  let lowStockVariants = 0;
  let catalogValue = 0;
  let totalUnitsSold = 0;

  products.forEach(product => {
    product.variants?.forEach((variant: ProductVariant) => {
      const variantStock = variant.inventory?.reduce((acc: number, inv: { quantity: number }) => acc + (inv.quantity || 0), 0) || 0;
      totalStock += variantStock;
      catalogValue += variantStock * (variant.price || 0);
      
      if (variantStock < 10) {
        lowStockVariants++;
      }

      const sold = variant.order_items?.reduce((acc: number, item: OrderItem) => {
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
      value: totalProducts,
      icon: Package,
      subtitle: `${activeProducts} active products`,
      trend: 'neutral',
    },
    {
      title: 'Inventory units',
      value: totalStock.toLocaleString(),
      icon: Box,
      subtitle: lowStockVariants > 0 ? `${lowStockVariants} products low on stock` : 'Stock levels healthy',
      trend: lowStockVariants > 0 ? 'warning' : 'neutral',
    },
    {
      title: 'Catalog value',
      value: formatCurrency(catalogValue),
      icon: DollarSign,
      subtitle: 'Based on current stock',
      trend: 'neutral',
    },
    {
      title: 'Units sold',
      value: totalUnitsSold.toLocaleString(),
      icon: ShoppingBag,
      subtitle: 'All-time completed orders',
      trend: 'neutral',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric) => (
        <div key={metric.title} className="bg-surface border border-separator rounded-xl p-5">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[13px] font-medium text-text-secondary">{metric.title}</p>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <metric.icon size={16} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-text-primary tracking-tight mb-1">{metric.value}</h3>
            <p className={`text-[12px] font-medium ${
              metric.trend === 'warning' ? 'text-orange-500' :
              metric.trend === 'positive' ? 'text-emerald-500' :
              'text-text-secondary'
            }`}>
              {metric.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
