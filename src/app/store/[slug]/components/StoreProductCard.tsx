'use client';

import React from 'react';
import Link from 'next/link';
import { StorefrontProduct } from '@/types/storefront';
import { formatCurrency, slugify } from '@/utils/format';
import { ShoppingBag, Star, Heart, Plus, Check } from 'lucide-react';

interface StoreProductCardProps {
  product: StorefrontProduct;
  storeSlug: string;
  currency: string;
  primaryColor?: string;
  isSaved: boolean;
  isQuickAdded: boolean;
  onToggleWishlist: () => void;
  onQuickAdd: () => void;
}

export function StoreProductCard({
  product,
  storeSlug,
  currency,
  primaryColor = '#3b82f6',
  isSaved,
  isQuickAdded,
  onToggleWishlist,
  onQuickAdd,
}: StoreProductCardProps) {
  const hasMultiplePrices = product.min_price !== product.max_price && product.max_price > 0;
  const isOutOfStock = product.total_stock <= 0;
  const isPreOrder = product.availability_status === 'PRE_ORDER';
  const hasMultipleVariants = product.variants.length > 1;
  const productUrl = `/store/${storeSlug}/products/${slugify(product.name)}`;

  const primaryVariant = product.variants[0];
  const comparePrice = primaryVariant?.compare_at_price;
  const hasDiscount = comparePrice && comparePrice > product.min_price;
  const discountPercent = hasDiscount ? Math.round(((comparePrice - product.min_price) / comparePrice) * 100) : 0;
  const isLowStock = !isOutOfStock && product.total_stock <= 5;

  return (
    <Link
      href={productUrl}
      className="group relative flex flex-col justify-between overflow-hidden rounded-md border border-separator/80 bg-surface shadow-xs transition-all duration-200 hover:border-separator hover:shadow-md cursor-pointer select-none"
    >
      {/* 1. Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#f0ece6]">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted">
            <ShoppingBag size={32} className="opacity-20" />
          </div>
        )}

        {/* Stock / Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 items-start">
          {hasDiscount && (
            <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-black shadow-xs tracking-tight">
              -{discountPercent}%
            </span>
          )}
          {isPreOrder && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-bold shadow-xs">
              {product.active_batch ? `Pre-Order • ${product.active_batch.name || 'Batch'}` : 'Pre-Order'}
            </span>
          )}
          {!isPreOrder && (isOutOfStock || product.availability_status === 'OUT_OF_STOCK') && (
            <span className="px-2 py-0.5 rounded-md bg-destructive text-white text-[9px] font-bold shadow-xs">
              Sold Out
            </span>
          )}
          {product.is_featured && (
            <span
              className="px-2 py-0.5 rounded-md text-white text-[9px] font-bold flex items-center gap-0.5 shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              <Star size={9} className="fill-white" /> Featured
            </span>
          )}
        </div>

        {/* Wishlist Quick Save Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist();
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-surface/85 backdrop-blur-md border border-separator/60 text-muted hover:text-danger hover:scale-110 active:scale-95 transition shadow-xs cursor-pointer z-10"
          aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart size={14} className={isSaved ? 'fill-danger text-danger' : ''} />
        </button>

        {/* Variant count indicator */}
        {hasMultipleVariants && (
          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-surface/90 backdrop-blur-md border border-separator text-[9px] font-semibold text-foreground shadow-2xs">
            {product.variants.length} options
          </span>
        )}
      </div>

      {/* 2. Product Details & Quick Commerce Bar */}
      <div className="flex flex-1 flex-col justify-between space-y-2.5 p-3.5">
        <div>
          <span className="text-[10px] text-muted font-medium block truncate">{product.category_name}</span>
          <h3 className="text-xs font-bold text-foreground line-clamp-2 mt-0.5 group-hover:opacity-80 transition leading-snug">
            {product.name}
          </h3>
        </div>

        <div className="pt-2 border-t border-separator/50 flex items-center justify-between gap-1.5">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs tabular-nums truncate" style={{ color: primaryColor }}>
                {hasMultiplePrices
                  ? `${formatCurrency(product.min_price, currency)} - ${formatCurrency(product.max_price, currency)}`
                  : formatCurrency(product.min_price, currency)}
              </span>
              {hasDiscount && !hasMultiplePrices && (
                <span className="text-[10px] text-muted line-through tabular-nums">
                  {formatCurrency(comparePrice, currency)}
                </span>
              )}
            </div>
            {isLowStock && (
              <span className="text-[9px] font-bold text-amber-500 mt-0.5">Only {product.total_stock} left</span>
            )}
          </div>

          {/* Quick Action Button */}
          {hasMultipleVariants || isPreOrder ? (
            <span className="px-2 py-1 rounded-lg bg-surface-elevated border border-separator text-[10px] font-semibold text-foreground group-hover:border-separator/90 transition shrink-0">
              Options
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd();
              }}
              disabled={isOutOfStock}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer shrink-0 ${
                isQuickAdded
                  ? 'bg-success text-white'
                  : isOutOfStock
                    ? 'bg-surface-elevated text-muted cursor-not-allowed'
                    : 'text-white hover:opacity-90 active:scale-90'
              }`}
              style={!isQuickAdded && !isOutOfStock ? { backgroundColor: primaryColor } : undefined}
              aria-label={isQuickAdded ? 'Added to bag' : `Add ${product.name} to bag`}
            >
              {isQuickAdded ? <Check size={13} /> : <Plus size={13} />}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
