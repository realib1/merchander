'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';

interface ProductCardCanvasProps {
  productUrl: string;
  imageUrl: string | null;
  productName: string;
  primaryColor: string;
  isFeatured?: boolean;
  hasDiscount?: boolean | number | null;
  discountPercent?: number;
  isPreOrder?: boolean;
  isOutOfStock?: boolean;
  isSaved: boolean;
  onToggleWishlist: () => void;
}

export function ProductCardCanvas({
  productUrl,
  imageUrl,
  productName,
  primaryColor,
  isFeatured,
  hasDiscount,
  discountPercent,
  isPreOrder,
  isOutOfStock,
  isSaved,
  onToggleWishlist,
}: ProductCardCanvasProps) {
  return (
    <Link
      href={productUrl}
      className="relative aspect-square w-full overflow-hidden bg-[#f4f4f5] dark:bg-[#18181b] flex items-center justify-center p-2.5 sm:p-4"
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={productName}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted">
          <ShoppingCart size={28} className="opacity-20 sm:w-8 sm:h-8" />
        </div>
      )}

      {/* Real Status Badges */}
      <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex flex-col gap-1 z-10 items-start pointer-events-none">
        {isFeatured ? (
          <span
            className="px-2 py-0.5 rounded-md text-white text-[9px] sm:text-[10px] font-bold shadow-xs tracking-tight"
            style={{ backgroundColor: primaryColor }}
          >
            Best Seller
          </span>
        ) : hasDiscount ? (
          <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] sm:text-[10px] font-bold shadow-xs tracking-tight">
            -{discountPercent}%
          </span>
        ) : isPreOrder ? (
          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] sm:text-[10px] font-bold shadow-xs tracking-tight">
            Pre-Order
          </span>
        ) : isOutOfStock ? (
          <span className="px-2 py-0.5 rounded-md bg-destructive text-white text-[9px] sm:text-[10px] font-bold shadow-xs tracking-tight">
            Sold Out
          </span>
        ) : (
          <span
            className="px-2 py-0.5 rounded-md text-white text-[9px] sm:text-[10px] font-bold shadow-xs tracking-tight"
            style={{ backgroundColor: primaryColor }}
          >
            New
          </span>
        )}
      </div>

      {/* Wishlist Heart Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleWishlist();
        }}
        className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xs text-zinc-500 hover:text-rose-500 hover:scale-110 active:scale-90 transition shadow-xs cursor-pointer z-10"
        aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
      >
        <Heart size={14} className={isSaved ? 'fill-rose-500 text-rose-500' : ''} />
      </button>
    </Link>
  );
}
