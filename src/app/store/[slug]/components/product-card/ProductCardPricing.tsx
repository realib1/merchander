'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface ProductCardPricingProps {
  ratingScore: number;
  reviewCount: number;
  minPrice: number;
  comparePrice?: number | null;
  hasDiscount?: boolean | number | null;
  currency: string;
  variantColorHexes: string[];
  totalVariants: number;
}

export function ProductCardPricing({
  ratingScore,
  reviewCount,
  minPrice,
  comparePrice,
  hasDiscount,
  currency,
  variantColorHexes,
  totalVariants,
}: ProductCardPricingProps) {
  return (
    <>
      {/* Star Rating */}
      <div className="flex items-center gap-1 text-[10px] text-muted">
        <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
          <Star size={11} className="fill-amber-400 text-amber-400" />
          <div className="hidden sm:flex items-center gap-0.5">
            {[1, 2, 3, 4].map((starIdx) => (
              <Star key={starIdx} size={11} className="fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>
        <span className="font-bold text-foreground text-[10px] sm:text-[11px]">{ratingScore.toFixed(1)}</span>
        <span className="text-muted text-[10px] font-medium">({reviewCount})</span>
      </div>

      {/* Desktop Price */}
      <div className="hidden sm:flex items-baseline gap-1.5 flex-wrap pt-0.5">
        <span className="font-extrabold text-sm sm:text-base text-foreground tabular-nums">
          {formatCurrency(minPrice, currency)}
        </span>
        {hasDiscount && comparePrice && (
          <span className="text-xs text-muted line-through tabular-nums">
            {formatCurrency(comparePrice, currency)}
          </span>
        )}
      </div>

      {/* Desktop Color Swatch Dots */}
      <div className="hidden sm:flex items-center gap-1.5 pt-0.5 min-h-[16px]">
        {variantColorHexes.slice(0, 3).map((hex, idx) => (
          <span
            key={idx}
            className="w-2.5 h-2.5 rounded-full border border-separator/80 shadow-2xs inline-block"
            style={{ backgroundColor: hex }}
            title={`${totalVariants} colorways`}
          />
        ))}
        {variantColorHexes.length > 3 && (
          <span className="text-[10px] text-muted font-medium ml-0.5">+{variantColorHexes.length - 3}</span>
        )}
      </div>
    </>
  );
}
