'use client';

import React from 'react';
import { Package, ArrowUpDown, X, ArrowRight } from 'lucide-react';
import { StorefrontCategory, StorefrontConfig, StorefrontProduct } from '@/types/storefront';
import { StoreProductCard } from './StoreProductCard';

export type SortOption = 'featured' | 'price_asc' | 'price_desc' | 'name';

interface StoreCatalogGridProps {
  config: StorefrontConfig;
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
  featuredProducts?: StorefrontProduct[];
  sidebarContent?: React.ReactNode;
  preorderCount?: number;
  selectedCategoryId: string;
  searchQuery: string;
  sortBy: SortOption;
  inStockOnly: boolean;
  currency: string;
  primaryColor: string;
  quickAddedId: string | null;
  isSaved: (productId: string) => boolean;
  onSelectCategory: (catId: string) => void;
  onClearSearch: () => void;
  onToggleInStock: (checked: boolean) => void;
  onSortChange: (sort: SortOption) => void;
  onToggleWishlist: (productId: string) => void;
  onQuickAdd: (product: StorefrontProduct) => void;
  onResetFilters: () => void;
}

export function StoreCatalogGrid({
  config,
  categories,
  products,
  featuredProducts = [],
  sidebarContent,
  preorderCount = 0,
  selectedCategoryId,
  searchQuery,
  sortBy,
  inStockOnly,
  currency,
  primaryColor,
  quickAddedId,
  isSaved,
  onSelectCategory,
  onClearSearch,
  onToggleInStock,
  onSortChange,
  onToggleWishlist,
  onQuickAdd,
  onResetFilters,
}: StoreCatalogGridProps) {
  const isDefaultView = selectedCategoryId === 'all' && !searchQuery.trim() && sortBy === 'featured';
  const displayFeatured = featuredProducts.length > 0 ? featuredProducts.slice(0, 4) : products.slice(0, 4);
  const displayRemaining = isDefaultView ? products.slice(4) : products;

  return (
    <main id="store-catalog-section" className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8">
      <div id="main-content" tabIndex={-1} className="outline-none" />

      {/* Controls Bar: Category Pills Strip */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition border ${
              selectedCategoryId === 'all'
                ? 'text-white shadow-xs'
                : 'bg-surface border-separator text-muted hover:text-foreground'
            }`}
            style={
              selectedCategoryId === 'all' ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined
            }
          >
            All Products ({categories.reduce((acc, c) => acc + c.product_count, 0) || products.length})
          </button>

          {/* Pre-order Quick Filter Pill */}
          {preorderCount > 0 && (
            <button
              type="button"
              onClick={() => onSelectCategory('preorders')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition border ${
                selectedCategoryId === 'preorders'
                  ? 'text-white shadow-xs'
                  : 'bg-surface border-amber-500/30 text-amber-600 dark:text-amber-400 hover:text-amber-500'
              }`}
              style={
                selectedCategoryId === 'preorders'
                  ? { backgroundColor: primaryColor, borderColor: primaryColor }
                  : undefined
              }
            >
              Pre-Orders ({preorderCount})
            </button>
          )}

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition border ${
                selectedCategoryId === cat.id
                  ? 'text-white shadow-xs'
                  : 'bg-surface border-separator text-muted hover:text-foreground'
              }`}
              style={
                selectedCategoryId === cat.id ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined
              }
            >
              {cat.name} ({cat.product_count})
            </button>
          ))}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-separator/60">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-muted font-medium">
              Showing <span className="font-bold text-foreground">{products.length}</span> products
            </p>
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold">
                <span>{`"${searchQuery}"`}</span>
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="p-0.5 rounded-full hover:bg-brand-primary/20 cursor-pointer transition"
                  aria-label="Clear search query"
                >
                  <X size={11} />
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer font-medium select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => onToggleInStock(e.target.checked)}
                className="rounded text-brand-primary"
              />
              <span>In Stock Only</span>
            </label>

            <div className="flex items-center gap-1.5 bg-surface border border-separator rounded-xl px-2.5 py-1 text-xs text-muted">
              <ArrowUpDown size={12} />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="bg-transparent text-foreground text-xs outline-none cursor-pointer font-semibold"
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Product Name</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog Body: Split 2-Column on Desktop with Sidebar */}
      <div className={sidebarContent ? 'grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start' : ''}>
        {/* Left Area: Product Grids */}
        <div className="space-y-10 min-w-0">
          {products.length === 0 ? (
            <div className="p-12 text-center text-muted space-y-3 rounded-2xl border border-separator bg-surface shadow-2xs">
              <Package size={42} className="mx-auto opacity-30" />
              <h3 className="text-sm font-bold text-foreground">No products match your criteria</h3>
              <p className="text-xs max-w-sm mx-auto">
                Try clearing your search terms, changing categories, or turning off the in-stock filter.
              </p>
              <button
                type="button"
                onClick={onResetFilters}
                className="px-4 py-2 rounded-xl bg-surface-elevated border border-separator text-xs font-semibold text-foreground hover:bg-surface-elevated/80 transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : isDefaultView && displayFeatured.length > 0 ? (
            <>
              {/* 1. Featured Products Section matching Mockup */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Featured Products</h2>
                  <button
                    type="button"
                    onClick={() => onSelectCategory('all')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-brand-primary transition cursor-pointer"
                  >
                    <span>View all</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-4">
                  {displayFeatured.map((p) => (
                    <StoreProductCard
                      key={p.id}
                      product={p}
                      storeSlug={config.slug}
                      currency={currency}
                      primaryColor={primaryColor}
                      isSaved={isSaved(p.id)}
                      isQuickAdded={quickAddedId === p.id}
                      onToggleWishlist={() => onToggleWishlist(p.id)}
                      onQuickAdd={() => onQuickAdd(p)}
                    />
                  ))}
                </div>
              </section>

              {/* Mobile Sidebar Content Preview */}
              {sidebarContent && (
                <div className="lg:hidden pt-2 pb-2">
                  {sidebarContent}
                </div>
              )}

              {/* 2. Popular Picks / Extended Catalog Section matching Mockup */}
              {displayRemaining.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Popular Picks</h2>
                    <span className="text-xs text-muted font-medium">{displayRemaining.length} items</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-4">
                    {displayRemaining.map((p) => (
                      <StoreProductCard
                        key={p.id}
                        product={p}
                        storeSlug={config.slug}
                        currency={currency}
                        primaryColor={primaryColor}
                        isSaved={isSaved(p.id)}
                        isQuickAdded={quickAddedId === p.id}
                        onToggleWishlist={() => onToggleWishlist(p.id)}
                        onQuickAdd={() => onQuickAdd(p)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            /* Filtered or Searched Results Grid */
            <section className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 sm:gap-4">
                {products.map((p) => (
                  <StoreProductCard
                    key={p.id}
                    product={p}
                    storeSlug={config.slug}
                    currency={currency}
                    primaryColor={primaryColor}
                    isSaved={isSaved(p.id)}
                    isQuickAdded={quickAddedId === p.id}
                    onToggleWishlist={() => onToggleWishlist(p.id)}
                    onQuickAdd={() => onQuickAdd(p)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Editorial Sidebar on Desktop (Sticky) */}
        {sidebarContent && (
          <aside className="space-y-6 lg:sticky lg:top-24 hidden lg:block">
            {sidebarContent}
          </aside>
        )}
      </div>
    </main>
  );
}
