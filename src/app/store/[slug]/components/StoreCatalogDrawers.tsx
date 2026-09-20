'use client';

import React from 'react';
import { StorefrontCategory, StorefrontConfig, StorefrontProduct } from '@/types/storefront';
import { StoreSearchModal } from './StoreSearchModal';
import { StoreCartDrawer } from './StoreCartDrawer';
import { StoreWishlistDrawer } from './StoreWishlistDrawer';
import { StoreMenuDrawer } from './StoreMenuDrawer';
import { useStoreCatalogState } from '../hooks/useStoreCatalogState';
import { slugify } from '@/utils/format';

interface StoreCatalogDrawersProps {
  config: StorefrontConfig;
  products: StorefrontProduct[];
  categories: StorefrontCategory[];
  currency: string;
  primaryColor: string;
  state: ReturnType<typeof useStoreCatalogState>;
}

export function StoreCatalogDrawers({
  config,
  products,
  categories,
  currency,
  primaryColor,
  state,
}: StoreCatalogDrawersProps) {
  return (
    <>
      <StoreSearchModal
        isOpen={state.isSearchOpen}
        onClose={() => state.setIsSearchOpen(false)}
        products={products}
        categories={categories}
        currency={currency}
        primaryColor={primaryColor}
        onSelectProduct={(p) => {
          state.setIsSearchOpen(false);
          state.router.push(`/store/${config.slug}/products/${slugify(p.name)}`);
        }}
        onSelectCategory={(catId) => state.setSelectedCategoryId(catId)}
      />

      <StoreCartDrawer
        isOpen={state.isCartOpen}
        config={config}
        cart={state.cart}
        onClose={() => state.setIsCartOpen(false)}
        onUpdateQuantity={state.handleUpdateQuantity}
        onRemoveItem={(vId) => state.updateCart((prev) => prev.filter((i) => i.variantId !== vId))}
        onClearCart={state.clearCart}
      />

      <StoreWishlistDrawer
        isOpen={state.isWishlistOpen}
        onClose={() => state.setIsWishlistOpen(false)}
        products={products}
        savedIds={state.wishlist.savedIds}
        onRemove={state.wishlist.removeProduct}
        onAddToCart={(p) => {
          state.handleQuickAdd(p);
          state.setIsWishlistOpen(false);
          state.setIsCartOpen(true);
        }}
        onSyncPhone={state.wishlist.syncWithPhone}
        currency={currency}
        primaryColor={primaryColor}
      />

      <StoreMenuDrawer
        isOpen={state.isMenuOpen}
        onClose={() => state.setIsMenuOpen(false)}
        config={config}
        categories={categories}
        wishlistCount={state.wishlist.count}
        onSelectCategory={(catId) => state.setSelectedCategoryId(catId)}
        onOpenTracking={() => {
          state.setIsMenuOpen(false);
          state.router.push(`/store/${config.slug}/orders`);
        }}
        onOpenWishlist={() => state.setIsWishlistOpen(true)}
      />
    </>
  );
}
