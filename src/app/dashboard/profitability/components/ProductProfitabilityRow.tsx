import React from 'react';
import { ProductProfitability } from '@/types/profitability';
import { formatCurrency } from '@/utils/format';
import { ShieldAlert, TrendingUp, AlertTriangle } from 'lucide-react';

interface ProductProfitabilityRowProps {
  product: ProductProfitability;
}

export function ProductProfitabilityRow({ product }: ProductProfitabilityRowProps) {
  const isNegative = product.grossProfit < 0;

  const renderBadge = () => {
    switch (product.healthStatus) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
            <TrendingUp size={11} /> {product.marginPct.toFixed(1)}%
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-info/10 text-info border border-info/20">
            {product.marginPct.toFixed(1)}%
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">
            <AlertTriangle size={11} /> {product.marginPct.toFixed(1)}%
          </span>
        );
      case 'negative':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
            <ShieldAlert size={11} /> {product.marginPct.toFixed(1)}%
          </span>
        );
    }
  };

  return (
    <tr className="hover:bg-surface-elevated/40 transition-colors border-b border-separator/40 text-xs">
      {/* Product Details */}
      <td className="px-4 py-3.5">
        <div className="font-semibold text-foreground truncate max-w-55">{product.name}</div>
        <div className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
          <span>{product.categoryName}</span>
          {product.sku && (
            <>
              <span>•</span>
              <span className="font-mono">SKU: {product.sku}</span>
            </>
          )}
        </div>
      </td>

      {/* Units Sold */}
      <td className="px-4 py-3.5 text-right font-medium text-foreground tabular-nums">{product.unitsSold}</td>

      {/* Avg Selling Price */}
      <td className="px-4 py-3.5 text-right text-muted tabular-nums">
        {formatCurrency(product.averageSellingPrice, 'GHS')}
      </td>

      {/* Unit Cost */}
      <td className="px-4 py-3.5 text-right text-muted tabular-nums">
        {formatCurrency(product.averageCostPrice, 'GHS')}
      </td>

      {/* Total Revenue */}
      <td className="px-4 py-3.5 text-right font-semibold text-foreground tabular-nums">
        {formatCurrency(product.totalRevenue, 'GHS')}
      </td>

      {/* Total COGS */}
      <td className="px-4 py-3.5 text-right text-muted tabular-nums">{formatCurrency(product.totalCogs, 'GHS')}</td>

      {/* Gross Profit */}
      <td
        className={`px-4 py-3.5 text-right font-bold tabular-nums ${
          isNegative ? 'text-destructive font-mono' : 'text-foreground'
        }`}
      >
        {formatCurrency(product.grossProfit, 'GHS')}
      </td>

      {/* Margin Badge */}
      <td className="px-4 py-3.5 text-right">{renderBadge()}</td>
    </tr>
  );
}
