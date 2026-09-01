'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StorefrontCartItem, StorefrontCategory, StorefrontConfig, StorefrontProduct } from '@/types/storefront';
import { StoreCartDrawer } from './StoreCartDrawer';
import { StoreWishlistDrawer } from './StoreWishlistDrawer';
import { StoreNavbar } from './StoreNavbar';
import { StoreHeroSection } from './StoreHeroSection';
import { StoreFooter } from './StoreFooter';
import { StoreBottomNav } from './StoreBottomNav';
import { StoreMenuDrawer } from './StoreMenuDrawer';
import { StoreSearchModal } from './StoreSearchModal';
import { StoreFloatingWhatsApp } from './StoreFloatingWhatsApp';
import { StoreCatalogGrid, SortOption } from './StoreCatalogGrid';
import { calculateCartTotals } from '@/utils/storefront';
import { slugify } from '@/utils/format';
import { ShoppingCart } from 'lucide-react';
import { useStorefrontWishlist } from '@/hooks/useStorefrontWishlist';

interface StoreCatalogProps {
  config: StorefrontConfig;
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
}

export function StoreCatalog({ config, categories, products }: StoreCatalogProps) {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [cart, setCart] = useState<StorefrontCartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`merchander_cart_${config.slug}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickAddedId, setQuickAddedId] = useState<string | null>(null);

  const wishlist = useStorefrontWishlist(config.slug);
  const currency = config.currency || 'GHS';
  const primaryColor = config.primary_color || '#3b82f6';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchesCategory = selectedCategoryId === 'all' || p.category_id === selectedCategoryId;
      const matchesSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStock = !inStockOnly || p.total_stock > 0;
      return matchesCategory && matchesSearch && matchesStock;
    });

    switch (sortBy) {
      case 'price_asc':
        result = [...result].sort((a, b) => a.min_price - b.min_price);
        break;
      case 'price_desc':
        result = [...result].sort((a, b) => b.min_price - a.min_price);
        break;
      case 'name':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'featured':
      default:
        result = [...result].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
        break;
    }
    return result;
  }, [products, selectedCategoryId, searchQuery, inStockOnly, sortBy]);

  const featuredProducts = useMemo(() => {
    const featuredProductIds = config.featured_product_ids;
    if (!featuredProductIds || featuredProductIds.length === 0) {
      return products.filter((p) => p.is_featured).slice(0, 4);
    }
    return products.filter((p) => featuredProductIds.includes(p.id));
  }, [products, config.featured_product_ids]);

  const updateCart = (updater: (prev: StorefrontCartItem[]) => StorefrontCartItem[]) => {
    setCart((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(`merchander_cart_${config.slug}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleQuickAdd = (product: StorefrontProduct) => {
    const firstVariant = product.variants[0];
    if (product.variants.length > 1 || !firstVariant || firstVariant.stock_quantity <= 0) {
      router.push(`/store/${config.slug}/products/${slugify(product.name)}`);
      return;
    }

    updateCart((prev) => {
      const existing = prev.find((item) => item.variantId === firstVariant.id);
      if (existing) {
        return prev.map((item) =>
          item.variantId === firstVariant.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          variantId: firstVariant.id,
          productId: product.id,
          productName: product.name,
          variantTitle: firstVariant.title || 'Standard',
          price: firstVariant.price,
          quantity: 1,
          imageUrl: product.image_url,
          sku: firstVariant.sku,
        },
      ];
    });

    setQuickAddedId(product.id);
    setTimeout(() => setQuickAddedId(null), 1500);
  };

  const handleUpdateQuantity = (variantId: string, delta: number) => {
    updateCart((prev) =>
      prev
        .map((item) => (item.variantId === variantId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const { itemCount } = calculateCartTotals(cart);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <StoreNavbar
          config={config}
          cartCount={itemCount}
          wishlistCount={wishlist.count}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenWishlist={() => setIsWishlistOpen(true)}
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenTracking={() => router.push(`/store/${config.slug}/orders`)}
          onSelectFilter={() => setSelectedCategoryId('all')}
        />

        <StoreHeroSection
          config={config}
          featuredProducts={featuredProducts}
          onSelectProduct={(p) => router.push(`/store/${config.slug}/products/${slugify(p.name)}`)}
        />

        <StoreCatalogGrid
          config={config}
          categories={categories}
          products={filteredAndSortedProducts}
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
      </div>

      {itemCount > 0 && (
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-5 py-3 rounded-full text-white text-xs font-bold shadow-2xl hover:opacity-95 transition-transform active:scale-95 cursor-pointer flex items-center gap-2.5 animate-scaleUp"
          style={{ backgroundColor: primaryColor }}
        >
          <ShoppingCart size={16} />
          <span>View Cart ({itemCount})</span>
        </button>
      )}

      <StoreSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        categories={categories}
        currency={currency}
        primaryColor={primaryColor}
        onSelectProduct={(p) => {
          setIsSearchOpen(false);
          router.push(`/store/${config.slug}/products/${slugify(p.name)}`);
        }}
        onSelectCategory={(catId) => setSelectedCategoryId(catId)}
      />

      <StoreCartDrawer
        isOpen={isCartOpen}
        config={config}
        cart={cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={(vId) => updateCart((prev) => prev.filter((i) => i.variantId !== vId))}
        onClearCart={() => updateCart(() => [])}
      />

      <StoreWishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        products={products}
        savedIds={wishlist.savedIds}
        onRemove={wishlist.removeProduct}
        onAddToCart={(p) => {
          handleQuickAdd(p);
          setIsWishlistOpen(false);
          setIsCartOpen(true);
        }}
        onSyncPhone={wishlist.syncWithPhone}
        currency={currency}
        primaryColor={primaryColor}
      />

      <StoreMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        config={config}
        categories={categories}
        onSelectCategory={(catId) => setSelectedCategoryId(catId)}
        onOpenTracking={() => {
          setIsMenuOpen(false);
          router.push(`/store/${config.slug}/orders`);
        }}
        onOpenWishlist={() => setIsWishlistOpen(true)}
      />

      <StoreFloatingWhatsApp whatsappPhone={config.whatsapp_phone} storeName={config.store_name} />
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
