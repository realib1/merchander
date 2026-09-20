'use client';

import React from 'react';
import { StorefrontCategory, StorefrontConfig, StorefrontProduct } from '@/types/storefront';
import { PreorderBatch } from '@/types/preorder';
import { StoreNavbar } from './StoreNavbar';
import { StoreHeroSection } from './StoreHeroSection';
import { StoreFooter } from './StoreFooter';
import { StoreBottomNav } from './StoreBottomNav';
import { StoreFloatingWhatsApp } from './StoreFloatingWhatsApp';
import { StoreAnnouncementBanner } from './StoreAnnouncementBanner';
import { StoreCatalogGrid } from './StoreCatalogGrid';
import { StoreHomeHighlights, StoreEditorialSidebar } from './StoreHomeHighlights';
import { StoreCatalogDrawers } from './StoreCatalogDrawers';
import { calculateCartTotals } from '@/utils/storefront';
import { slugify } from '@/utils/format';
import { useStoreCatalogState } from '../hooks/useStoreCatalogState';
import { ShoppingCart } from 'lucide-react';

interface StoreCatalogProps {
  config: StorefrontConfig;
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
  activeBatches?: PreorderBatch[];
}

export function StoreCatalog({ config, categories, products, activeBatches = [] }: StoreCatalogProps) {
  const state = useStoreCatalogState({ config, products });
  const currency = config.currency || 'GHS';
  const primaryColor = config.primary_color || '#3b82f6';
  const { itemCount } = calculateCartTotals(state.cart);

  return (
    <div className="flex flex-col min-h-screen relative pb-16 sm:pb-0">
      <StoreAnnouncementBanner
        batches={activeBatches}
        announcementHeadline={config.banner_headline}
        announcementText={config.banner_tagline}
        primaryColor={primaryColor}
        onShopPreorders={state.handleShopPreorders}
        onTrackOrder={() => state.router.push(`/store/${config.slug}/orders`)}
      />

      <div className="flex-1">
        <StoreNavbar
          config={config}
          cartCount={itemCount}
          wishlistCount={state.wishlist.count}
          onOpenCart={() => state.setIsCartOpen(true)}
          onOpenWishlist={() => state.setIsWishlistOpen(true)}
          onOpenMenu={() => state.setIsMenuOpen(true)}
          onOpenSearch={() => state.setIsSearchOpen(true)}
          onSelectFilter={() => state.setSelectedCategoryId('all')}
        />

        <StoreHeroSection
          config={config}
          featuredProducts={state.featuredProducts}
          products={products}
          onSelectProduct={(p) => state.router.push(`/store/${config.slug}/products/${slugify(p.name)}`)}
          onSelectCategory={(catId) => {
            state.setSelectedCategoryId(catId);
            const catalogEl = document.getElementById('store-catalog-section');
            if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <StoreHomeHighlights
          slug={config.slug}
          categories={categories}
          products={products}
          primaryColor={primaryColor}
          currency={currency}
        />

        <StoreCatalogGrid
          config={config}
          categories={categories}
          products={state.filteredAndSortedProducts}
          featuredProducts={state.featuredProducts}
          sidebarContent={
            <StoreEditorialSidebar
              slug={config.slug}
              categories={categories}
              products={products}
              primaryColor={primaryColor}
              config={config}
            />
          }
          preorderCount={state.preorderCount}
          selectedCategoryId={state.selectedCategoryId}
          searchQuery={state.searchQuery}
          sortBy={state.sortBy}
          inStockOnly={state.inStockOnly}
          currency={currency}
          primaryColor={primaryColor}
          quickAddedId={state.quickAddedId}
          isSaved={state.wishlist.isSaved}
          onSelectCategory={state.setSelectedCategoryId}
          onClearSearch={() => state.setSearchQuery('')}
          onToggleInStock={state.setInStockOnly}
          onSortChange={state.setSortBy}
          onToggleWishlist={state.wishlist.toggleSave}
          onQuickAdd={state.handleQuickAdd}
          onResetFilters={() => {
            state.setSelectedCategoryId('all');
            state.setSearchQuery('');
            state.setInStockOnly(false);
          }}
        />
      </div>

      {itemCount > 0 && (
        <button
          type="button"
          onClick={() => state.setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-5 py-3 rounded-full text-white text-xs font-bold shadow-2xl hover:opacity-95 transition-transform active:scale-95 cursor-pointer flex items-center gap-2.5 animate-scaleUp"
          style={{ backgroundColor: primaryColor }}
        >
          <ShoppingCart size={16} />
          <span>View Cart ({itemCount})</span>
        </button>
      )}

      <StoreCatalogDrawers
        config={config}
        products={products}
        categories={categories}
        currency={currency}
        primaryColor={primaryColor}
        state={state}
      />

      <StoreFloatingWhatsApp whatsappPhone={config.whatsapp_phone} storeName={config.store_name} />
      <StoreBottomNav
        storeSlug={config.slug}
        cartCount={itemCount}
        wishlistCount={state.wishlist.count}
        primaryColor={primaryColor}
        onOpenCart={() => state.setIsCartOpen(true)}
        onOpenWishlist={() => state.setIsWishlistOpen(true)}
        onOpenAccount={() => state.router.push(`/store/${config.slug}/orders`)}
      />
      <StoreFooter config={config} />
    </div>
  );
}
