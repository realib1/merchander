'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StorefrontProduct, StorefrontProductVariant } from '@/types/storefront';
import { formatCurrency } from '@/utils/format';

interface ProductHeaderInfoProps {
  product: StorefrontProduct;
  selectedVariant?: StorefrontProductVariant;
  slug: string;
  primaryColor: string;
  currency: string;
}

export function ProductHeaderInfo({ product, selectedVariant, slug, primaryColor, currency }: ProductHeaderInfoProps) {
  const currentPrice = selectedVariant ? selectedVariant.price : product.min_price;
  const comparePrice = selectedVariant?.compare_at_price || product.variants[0]?.compare_at_price;
  const hasDiscount = comparePrice && comparePrice > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100) : 0;

  const totalStock = selectedVariant ? selectedVariant.stock_quantity : product.total_stock;
  const isOutOfStock = totalStock <= 0;
  const isPreOrder = product.availability_status === 'PRE_ORDER';
  const isLowStock = !isOutOfStock && !isPreOrder && totalStock <= 5;

  return (
    <div className="space-y-3">
      {/* Breadcrumb Row */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/store/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition group"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Store</span>
        </Link>
        <span className="text-[11px] font-bold text-muted uppercase tracking-wider">{product.category_name}</span>
      </div>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-snug">
        {product.name}
      </h1>

      {/* Pricing & Badges Row */}
      <div className="flex flex-wrap items-baseline gap-3 pt-1">
        <span className="text-2xl sm:text-3xl font-black tabular-nums" style={{ color: primaryColor }}>
          {formatCurrency(currentPrice, currency)}
        </span>

        {hasDiscount && (
          <span className="text-sm sm:text-base text-muted line-through tabular-nums">
            {formatCurrency(comparePrice, currency)}
          </span>
        )}

        {hasDiscount && (
          <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[11px] font-black shadow-xs tracking-tight">
            -{discountPercent}% OFF
          </span>
        )}

        {isPreOrder && (
          <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-white text-xs font-bold shadow-xs">
            Pre-Order Available
          </span>
        )}

        {isOutOfStock && !isPreOrder && (
          <span className="px-2.5 py-0.5 rounded-lg bg-destructive text-white text-xs font-bold shadow-xs">
            Out of Stock
          </span>
        )}

        {isLowStock && (
          <span className="text-xs font-bold text-amber-500">Only {totalStock} left in stock — order soon</span>
        )}
      </div>
    </div>
  );
}
