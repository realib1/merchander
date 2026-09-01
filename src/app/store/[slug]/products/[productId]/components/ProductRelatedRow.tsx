'use client';

import React from 'react';
import { StorefrontProduct } from '@/types/storefront';
import { StoreProductCard } from '@/app/store/[slug]/components/StoreProductCard';

interface ProductRelatedRowProps {
  relatedProducts: StorefrontProduct[];
  storeSlug: string;
  currency: string;
  primaryColor: string;
  isSaved: (id: string) => boolean;
  onToggleWishlist: (id: string) => void;
  onQuickAdd: (p: StorefrontProduct) => void;
}

export function ProductRelatedRow({
  relatedProducts,
  storeSlug,
  currency,
  primaryColor,
  isSaved,
  onToggleWishlist,
  onQuickAdd,
}: ProductRelatedRowProps) {
  if (!relatedProducts || relatedProducts.length === 0) return null;

  return (
    <section className="pt-10 border-t border-separator/80 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">You May Also Like</h3>
        <span className="text-xs font-semibold text-muted">{relatedProducts.length} items</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
        {relatedProducts.slice(0, 4).map((p) => (
          <StoreProductCard
            key={p.id}
            product={p}
            storeSlug={storeSlug}
            currency={currency}
            primaryColor={primaryColor}
            isSaved={isSaved(p.id)}
            isQuickAdded={false}
            onToggleWishlist={() => onToggleWishlist(p.id)}
            onQuickAdd={() => onQuickAdd(p)}
          />
        ))}
      </div>
    </section>
  );
}
