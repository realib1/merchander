'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { StorefrontCategory, StorefrontConfig, StorefrontProduct } from '@/types/storefront';
import { useStorefrontCart, useStorefrontWishlist } from '@/hooks';
import { calculateCartTotals } from '@/utils/storefront';
import { slugify } from '@/utils/format';
import { StoreCartDrawer } from './StoreCartDrawer';
import { StoreFooter } from './StoreFooter';
import { StoreBottomNav } from './StoreBottomNav';
import { StoreMenuDrawer } from './StoreMenuDrawer';
import { StoreNavbar } from './StoreNavbar';
import { StoreSearchModal } from './StoreSearchModal';
import { StoreWishlistDrawer } from './StoreWishlistDrawer';
import { StoreCatalogGrid, SortOption } from './StoreCatalogGrid';

interface StoreDiscoveryViewProps {
  config: StorefrontConfig;
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
  initialCategoryId?: string;
  initialSearchQuery?: string;
  title: string;
  eyebrow: string;
}

export function StoreDiscoveryView({
  config,
  categories,
  products,
  initialCategoryId = 'all',
  initialSearchQuery = '',
  title,
  eyebrow,
}: StoreDiscoveryViewProps) {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickAddedId, setQuickAddedId] = useState<string | null>(null);
  const { cart, updateCart, clearCart } = useStorefrontCart(config.slug);
  const wishlist = useStorefrontWishlist(config.slug);
  const currency = config.currency || 'GHS';
  const primaryColor = config.primary_color || '#3b82f6';

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const categoryMatches = selectedCategoryId === 'all' || product.category_id === selectedCategoryId;
      const queryMatches =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category_name.toLowerCase().includes(query) ||
        Boolean(product.description?.toLowerCase().includes(query));
      const stockMatches = !inStockOnly || product.total_stock > 0 || product.availability_status === 'PRE_ORDER';
      return categoryMatches && queryMatches && stockMatches;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'price_asc') return a.min_price - b.min_price;
      if (sortBy === 'price_desc') return b.min_price - a.min_price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return Number(b.is_featured) - Number(a.is_featured);
    });
  }, [inStockOnly, products, searchQuery, selectedCategoryId, sortBy]);

  const handleQuickAdd = (product: StorefrontProduct) => {
    const variant = product.variants[0];
    if (product.variants.length > 1 || !variant || variant.stock_quantity <= 0) {
      router.push(`/store/${config.slug}/products/${slugify(product.name)}`);
      return;
    }

    updateCart((current) => {
      const existing = current.find((item) => item.variantId === variant.id);
      if (existing) {
        return current.map((item) =>
          item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...current,
        {
          variantId: variant.id,
          productId: product.id,
          productName: product.name,
          variantTitle: variant.title || 'Standard',
          price: variant.price,
          quantity: 1,
          imageUrl: product.image_url,
          sku: variant.sku,
          batchId: product.active_batch?.id || null,
          batchName: product.active_batch?.name || null,
        },
      ];
    });
    setQuickAddedId(product.id);
    window.setTimeout(() => setQuickAddedId(null), 1500);
  };

  const handleUpdateQuantity = (variantId: string, delta: number) => {
    updateCart((current) =>
      current
        .map((item) => (item.variantId === variantId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const { itemCount } = calculateCartTotals(cart);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StoreNavbar
        config={config}
        cartCount={itemCount}
        wishlistCount={wishlist.count}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenTracking={() => router.push(`/store/${config.slug}/orders`)}
      />

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7 border-b border-separator/70 pb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-primary">{eyebrow}</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <h1 className="text-3xl font-black tracking-[-0.04em] text-foreground sm:text-5xl">{title}</h1>
            <span className="text-xs text-muted">{filteredProducts.length} products</span>
          </div>
        </div>

        <StoreCatalogGrid
          config={config}
          categories={categories}
          products={filteredProducts}
          preorderCount={filteredProducts.filter((p) => p.availability_status === 'PRE_ORDER' || p.active_batch).length}
          selectedCategoryId={selectedCategoryId}
          searchQuery={searchQuery}
          sortBy={sortBy}
          inStockOnly={inStockOnly}
          currency={currency}
          primaryColor={primaryColor}
          quickAddedId={quickAddedId}
          isSaved={wishlist.isSaved}
          onSelectCategory={setSelectedCategoryId}
          onClearSearch={() => setSearchQuery('')}
          onToggleInStock={setInStockOnly}
          onSortChange={setSortBy}
          onToggleWishlist={wishlist.toggleSave}
          onQuickAdd={handleQuickAdd}
          onResetFilters={() => {
            setSelectedCategoryId('all');
            setSearchQuery('');
            setInStockOnly(false);
          }}
        />
      </main>

      {itemCount > 0 && (
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full px-4 py-3 text-xs font-bold text-white shadow-2xl transition hover:opacity-95 active:scale-95 md:bottom-6 md:right-6"
          style={{ backgroundColor: primaryColor }}
        >
          <ShoppingCart size={16} />
          View Cart ({itemCount})
        </button>
      )}

      <StoreSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        categories={categories}
        currency={currency}
        primaryColor={primaryColor}
        onSelectProduct={(product) => router.push(`/store/${config.slug}/products/${slugify(product.name)}`)}
        onSelectCategory={(categoryId) => {
          setSelectedCategoryId(categoryId);
          setIsSearchOpen(false);
        }}
      />
      <StoreCartDrawer
        isOpen={isCartOpen}
        config={config}
        cart={cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={(variantId) => updateCart((current) => current.filter((item) => item.variantId !== variantId))}
        onClearCart={clearCart}
      />
      <StoreWishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        products={products}
        savedIds={wishlist.savedIds}
        onRemove={wishlist.removeProduct}
        onAddToCart={handleQuickAdd}
        onSyncPhone={wishlist.syncWithPhone}
        currency={currency}
        primaryColor={primaryColor}
      />
      <StoreMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        config={config}
        categories={categories}
        onSelectCategory={(categoryId) => {
          setSelectedCategoryId(categoryId);
          setIsMenuOpen(false);
        }}
        onOpenTracking={() => router.push(`/store/${config.slug}/orders`)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
      />
      <StoreBottomNav
        storeSlug={config.slug}
        cartCount={itemCount}
        wishlistCount={wishlist.count}
        primaryColor={primaryColor}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
      />
      <StoreFooter config={config} />
    </div>
  );
}
