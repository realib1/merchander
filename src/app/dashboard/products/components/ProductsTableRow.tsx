'use client';

import Image from 'next/image';
import { formatCurrency } from '@/utils/format';
import { calculateTotalStock, calculateTotalUnitsSold, getVariantPriceRange, generateSKU } from '@/utils/product';
import type { Product } from '@/types/product';
import { ProductsActionMenu } from './ProductsActionMenu';

export function StockBadge({ totalStock, stockUnit }: { totalStock: number; stockUnit?: string | null }) {
  const unit = stockUnit || 'pcs';
  if (totalStock === 0) {
    return (
      <span className="text-red-500 font-medium bg-red-500/10 px-2 py-0.5 rounded text-xs whitespace-nowrap">
        Out of stock
      </span>
    );
  }
  if (totalStock < 10) {
    return (
      <span className="text-orange-500 font-medium bg-orange-500/10 px-2 py-0.5 rounded text-xs whitespace-nowrap">
        {totalStock} {unit} low
      </span>
    );
  }
  return (
    <span className="font-medium whitespace-nowrap text-xs">
      {totalStock} {unit} in stock
    </span>
  );
}

interface ProductsTableRowProps {
  product: Product;
  isSelected: boolean;
  onToggleSelect: (checked: boolean) => void;
}

export function ProductsTableRow({ product, isSelected, onToggleSelect }: ProductsTableRowProps) {
  const totalStock = calculateTotalStock(product.variants ?? undefined);
  const { min: minPrice, hasRange } = getVariantPriceRange(product.variants ?? undefined);
  const totalUnitsSold = calculateTotalUnitsSold(product.variants ?? undefined);

  return (
    <tr className="hover:bg-surface-elevated/30 transition-colors group">
      <td className="px-4 py-3 text-center">
        <input
          type="checkbox"
          aria-label={`Select ${product.name}`}
          checked={isSelected}
          onChange={(e) => onToggleSelect(e.target.checked)}
          className="w-4 h-4 rounded border-separator bg-surface text-brand-primary focus:ring-brand-primary cursor-pointer"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl border border-separator bg-surface p-1 flex items-center justify-center font-bold text-sm shrink-0 text-brand-primary">
            {product.image_urls && product.image_urls.length > 0 ? (
              <div className="relative w-full h-full overflow-hidden rounded-lg">
                <Image src={product.image_urls[0]} alt={product.name} fill className="object-cover" sizes="32px" />
              </div>
            ) : product.name ? (
              product.name.substring(0, 2).toUpperCase()
            ) : (
              'UN'
            )}
          </div>
          <div className="min-w-0">
            <div className="text-body-sm font-semibold truncate">{product.name}</div>
            <div className="text-xs text-muted truncate">{generateSKU(product.name, product.id)}</div>
          </div>
        </div>
      </td>

      <td className="px-4 py-3 text-body-sm truncate">{product.category?.name || 'Uncategorized'}</td>

      <td className="px-4 py-3 text-body-sm text-muted tabular-nums">
        {product.created_at
          ? new Date(product.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : '-'}
      </td>

      <td className="px-4 py-3 space-y-1.5">
        <div>
          {product.is_active ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-caption font-semibold bg-emerald-500/10 text-emerald-600">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-caption font-semibold bg-orange-500/10 text-orange-600">
              Archived
            </span>
          )}
        </div>
        {product.availability_status && (
          <div>
            {product.availability_status === 'AVAILABLE' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-caption font-semibold bg-brand-primary/10 text-brand-primary">
                Available
              </span>
            )}
            {product.availability_status === 'PRE_ORDER' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-caption font-semibold bg-indigo-500/10 text-indigo-600">
                Pre-Order
              </span>
            )}
            {product.availability_status === 'OUT_OF_STOCK' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-caption font-semibold bg-red-500/10 text-red-600">
                Out of Stock
              </span>
            )}
            {product.availability_status === 'PRE_ORDER' && product.preorder_shipping_mode === 'tbd' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-caption font-semibold bg-orange-500/10 text-orange-600 mt-1.5">
                + TBD Shipping Fee
              </span>
            )}
          </div>
        )}
      </td>

      <td className="px-4 py-3 text-body-sm">
        <StockBadge totalStock={totalStock} stockUnit={product.stock_unit} />
      </td>

      <td className="px-4 py-3 text-body-sm font-medium tabular-nums">
        {hasRange ? `From ${formatCurrency(minPrice)}` : formatCurrency(minPrice)}
      </td>

      <td className="px-4 py-3 text-body-sm tabular-nums">{totalUnitsSold.toLocaleString()}</td>

      <td className="px-4 py-3 text-right relative z-10">
        <ProductsActionMenu productId={product.id} />
      </td>
    </tr>
  );
}
