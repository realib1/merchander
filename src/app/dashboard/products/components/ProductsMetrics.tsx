import React from 'react';
import { Box, DollarSign, ShoppingBag, Package } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { Product, ProductVariant, OrderItem } from '@/types/product';

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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: 'Products', value: totalProducts.toLocaleString(), note: `${activeProducts} active in catalogue`, icon: Package, color: 'text-muted' },
        { label: 'Inventory units', value: totalStock.toLocaleString(), note: lowStockVariants > 0 ? `${lowStockVariants} products low on stock` : 'Stock levels healthy', icon: Box, color: lowStockVariants > 0 ? 'text-warning' : 'text-muted' },
        { label: 'Catalogue value', value: formatCurrency(catalogValue), note: 'At current retail price', icon: DollarSign, color: 'text-muted' },
        { label: 'Units sold · 30d', value: totalUnitsSold.toLocaleString(), note: 'Across completed orders', icon: ShoppingBag, color: 'text-success' },
      ].map(({ label, value, note, icon: Icon, color }) => (
        <div key={label} className="flex min-h-28 flex-col justify-between gap-3 rounded-xl border border-separator bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{label}</span>
            <Icon size={15} className="text-muted" aria-hidden="true" />
          </div>
          <div>
            <span className="font-display text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</span>
            <p className={`mt-1 text-xs font-medium ${color}`}>{note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
