'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Check, Plus, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface ProductCardActionsProps {
  productUrl: string;
  minPrice: number;
  comparePrice?: number | null;
  hasDiscount?: boolean | number | null;
  currency: string;
  hasMultipleVariants: boolean;
  isPreOrder: boolean;
  isOutOfStock: boolean;
  isQuickAdded: boolean;
  primaryColor: string;
  onQuickAdd: () => void;
}

export function ProductCardActions({
  productUrl,
  minPrice,
  comparePrice,
  hasDiscount,
  currency,
  hasMultipleVariants,
  isPreOrder,
  isOutOfStock,
  isQuickAdded,
  primaryColor,
  onQuickAdd,
}: ProductCardActionsProps) {
  return (
    <>
      {/* Mobile Price and Compact Action Bar */}
      <div className="flex items-center justify-between gap-1.5 pt-2 sm:hidden border-t border-separator/40">
        <div className="flex flex-col min-w-0 pr-1">
          <span className="font-extrabold text-xs text-foreground tabular-nums truncate">
            {formatCurrency(minPrice, currency)}
          </span>
          {hasDiscount && comparePrice && (
            <span className="text-[9px] text-muted line-through tabular-nums truncate">
              {formatCurrency(comparePrice, currency)}
            </span>
          )}
        </div>

        {hasMultipleVariants || isPreOrder ? (
          <Link
            href={productUrl}
            className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-separator/80 text-foreground text-[10px] font-bold flex items-center gap-1 transition hover:border-brand-primary active:scale-95 shrink-0 shadow-2xs"
            aria-label="Select options"
          >
            <span>Options</span>
            <ArrowRight size={10} className="text-muted" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd();
            }}
            disabled={isOutOfStock}
            className={`w-7.5 h-7.5 rounded-lg text-white flex items-center justify-center transition shadow-2xs cursor-pointer active:scale-90 shrink-0 ${
              isQuickAdded
                ? 'bg-emerald-600'
                : isOutOfStock
                  ? 'bg-surface-elevated text-muted cursor-not-allowed'
                  : ''
            }`}
            style={!isQuickAdded && !isOutOfStock ? { backgroundColor: primaryColor } : undefined}
            aria-label={isOutOfStock ? 'Sold out' : 'Add to cart'}
          >
            {isQuickAdded ? (
              <Check size={14} />
            ) : isOutOfStock ? (
              <span className="text-[9px] text-muted">Sold</span>
            ) : (
              <Plus size={15} strokeWidth={2.5} />
            )}
          </button>
        )}
      </div>

      {/* Desktop Full-width Add to Cart Action */}
      <div className="hidden sm:block pt-2 w-full">
        {hasMultipleVariants || isPreOrder ? (
          <Link
            href={productUrl}
            className="w-full py-2.5 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition hover:opacity-90 active:scale-98 shadow-xs"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingCart size={14} />
            <span>Select Options</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd();
            }}
            disabled={isOutOfStock}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98 ${
              isQuickAdded
                ? 'bg-emerald-600 text-white'
                : isOutOfStock
                  ? 'bg-surface-elevated text-muted cursor-not-allowed'
                  : 'text-white hover:opacity-90'
            }`}
            style={!isQuickAdded && !isOutOfStock ? { backgroundColor: primaryColor } : undefined}
          >
            {isQuickAdded ? (
              <>
                <Check size={14} />
                <span>Added</span>
              </>
            ) : isOutOfStock ? (
              <span>Sold Out</span>
            ) : (
              <>
                <ShoppingCart size={14} />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        )}
      </div>
    </>
  );
}
