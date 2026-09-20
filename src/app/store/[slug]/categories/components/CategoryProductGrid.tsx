'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { StorefrontProduct } from '@/types/storefront';
import { StoreProductCard } from '../../components/StoreProductCard';

interface CategoryProductGridProps {
  products: StorefrontProduct[];
  categoryName: string;
  selectedTag: string;
  storeSlug: string;
  currency: string;
  primaryColor: string;
  savedIds: string[];
  quickAddedId: string | null;
  onClearFilter: () => void;
  onResetAllFilters: () => void;
  onToggleWishlist: (p: StorefrontProduct) => void;
  onQuickAdd: (p: StorefrontProduct) => void;
}

export function CategoryProductGrid({
  products,
  categoryName,
  selectedTag,
  storeSlug,
  currency,
  primaryColor,
  savedIds,
  quickAddedId,
  onClearFilter,
  onResetAllFilters,
  onToggleWishlist,
  onQuickAdd,
}: CategoryProductGridProps) {
  return (
    <div className="space-y-4">
      {/* Products Count Indicator */}
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          Showing <strong className="text-foreground">{products.length}</strong> products in{' '}
          <strong className="text-foreground">{categoryName}</strong>
        </span>
        {selectedTag !== 'All' && (
          <button
            type="button"
            onClick={onClearFilter}
            className="text-brand-primary hover:underline font-semibold cursor-pointer"
          >
            Clear filter
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="p-12 text-center text-muted space-y-3 rounded-2xl border border-separator bg-surface shadow-2xs">
          <Package size={42} className="mx-auto opacity-30" />
          <h3 className="text-sm font-bold text-foreground">No products found in this category</h3>
          <p className="text-xs max-w-sm mx-auto">
            Try clearing your search query or selecting a different filter chip.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onResetAllFilters}
              className="px-4 py-2 rounded-xl bg-surface-elevated border border-separator text-xs font-semibold text-foreground hover:bg-surface-elevated/80 transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {products.map((product) => (
            <StoreProductCard
              key={product.id}
              product={product}
              storeSlug={storeSlug}
              currency={currency}
              primaryColor={primaryColor}
              isSaved={savedIds.includes(product.id)}
              isQuickAdded={quickAddedId === product.id}
              onToggleWishlist={() => onToggleWishlist(product)}
              onQuickAdd={() => onQuickAdd(product)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
