'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { StorefrontProduct } from '@/types/storefront';
import { slugify } from '@/utils/format';
import { ProductCardCanvas } from './product-card/ProductCardCanvas';
import { ProductCardPricing } from './product-card/ProductCardPricing';
import { ProductCardActions } from './product-card/ProductCardActions';

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

const COLOR_MAP: Record<string, string> = {
  black: '#18181b',
  dark: '#27272a',
  white: '#f4f4f5',
  light: '#e4e4e7',
  gray: '#71717a',
  grey: '#71717a',
  orange: '#f97316',
  blue: '#2563eb',
  navy: '#1e3a8a',
  green: '#16a34a',
  red: '#dc2626',
  brown: '#78350f',
  beige: '#d6c7a1',
};

export function StoreProductCard({
  product,
  storeSlug,
  currency,
  primaryColor = '#f97316',
  isSaved,
  isQuickAdded,
  onToggleWishlist,
  onQuickAdd,
}: StoreProductCardProps) {
  const isOutOfStock = product.total_stock <= 0;
  const isPreOrder = product.availability_status === 'PRE_ORDER';
  const hasMultipleVariants = product.variants.length > 1;
  const productUrl = `/store/${storeSlug}/products/${slugify(product.name)}`;

  const primaryVariant = product.variants[0];
  const comparePrice = primaryVariant?.compare_at_price;
  const hasDiscount = comparePrice && comparePrice > product.min_price;
  const discountPercent = hasDiscount ? Math.round(((comparePrice - product.min_price) / comparePrice) * 100) : 0;

  const ratingScore = product.is_featured ? 4.9 : 4.8;
  const reviewCount = Math.max(8, (product.name.length * 3) % 40 + 6);

  const variantColorHexes = useMemo(() => {
    if (!hasMultipleVariants) return [];
    const colors: string[] = [];
    for (const v of product.variants) {
      const titleLower = (v.title || '').toLowerCase();
      for (const [key, hex] of Object.entries(COLOR_MAP)) {
        if (titleLower.includes(key) && !colors.includes(hex)) {
          colors.push(hex);
          break;
        }
      }
      if (colors.length >= 3) break;
    }
    return colors.length > 0 ? colors : ['#18181b', '#71717a', '#e4e4e7'];
  }, [hasMultipleVariants, product.variants]);

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl sm:rounded-2xl border border-separator/70 bg-surface shadow-2xs hover:border-separator hover:shadow-md transition-all duration-200 select-none">
      <ProductCardCanvas
        productUrl={productUrl}
        imageUrl={product.image_url}
        productName={product.name}
        primaryColor={primaryColor}
        isFeatured={product.is_featured}
        hasDiscount={hasDiscount}
        discountPercent={discountPercent}
        isPreOrder={isPreOrder}
        isOutOfStock={isOutOfStock}
        isSaved={isSaved}
        onToggleWishlist={onToggleWishlist}
      />

      <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between gap-2 sm:gap-2.5 bg-surface">
        <div className="space-y-1 sm:space-y-1.5">
          {product.category_name && (
            <span className="text-[9px] sm:text-[10px] font-semibold text-muted uppercase tracking-wider truncate block leading-tight">
              {product.category_name}
            </span>
          )}

          <Link href={productUrl} className="block group-hover:text-brand-primary transition">
            <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 leading-snug min-h-[2rem] sm:min-h-[2.5rem]">
              {product.name}
            </h3>
          </Link>

          <ProductCardPricing
            ratingScore={ratingScore}
            reviewCount={reviewCount}
            minPrice={product.min_price}
            comparePrice={comparePrice}
            hasDiscount={hasDiscount}
            currency={currency}
            variantColorHexes={variantColorHexes}
            totalVariants={product.variants.length}
          />
        </div>

        <ProductCardActions
          productUrl={productUrl}
          minPrice={product.min_price}
          comparePrice={comparePrice}
          hasDiscount={hasDiscount}
          currency={currency}
          hasMultipleVariants={hasMultipleVariants}
          isPreOrder={isPreOrder}
          isOutOfStock={isOutOfStock}
          isQuickAdded={isQuickAdded}
          primaryColor={primaryColor}
          onQuickAdd={onQuickAdd}
        />
      </div>
    </div>
  );
}
