'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShoppingBag, ShoppingCart } from 'lucide-react';
import { StorefrontCategory, StorefrontConfig, StorefrontProduct } from '@/types/storefront';
import { useStorefrontCart, useStorefrontWishlist } from '@/hooks';
import { calculateCartTotals } from '@/utils/storefront';
import { slugify } from '@/utils/format';
import {
  CURATED_STOREFRONT_CATEGORIES,
  CURATED_COLLECTIONS,
  resolveCategoryImage,
} from '@/utils/storefront-categories';
import { StoreNavbar } from '../../components/StoreNavbar';
import { StoreFooter } from '../../components/StoreFooter';
import { StoreBottomNav } from '../../components/StoreBottomNav';
import { StoreCartDrawer } from '../../components/StoreCartDrawer';
import { StoreWishlistDrawer } from '../../components/StoreWishlistDrawer';
import { StoreMenuDrawer } from '../../components/StoreMenuDrawer';
import { StoreSearchModal } from '../../components/StoreSearchModal';

// Dedicated Categories Hub view implementing Screen 3 of App Showcase
interface StoreCategoriesHubViewProps {
  config: StorefrontConfig;
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
}

export function StoreCategoriesHubView({
  config,
  categories,
  products,
}: StoreCategoriesHubViewProps) {
  const router = useRouter();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { cart, updateCart, clearCart } = useStorefrontCart(config.slug);
  const wishlist = useStorefrontWishlist(config.slug);
  const primaryColor = config.primary_color || '#f97316';
  const currency = config.currency || 'GHS';
  const { itemCount } = calculateCartTotals(cart);

  // Derive categories to display: use merchant categories if created, or curated fallback presets
  const displayCategories = React.useMemo(() => {
    if (categories.length === 0) {
      return CURATED_STOREFRONT_CATEGORIES.map((preset) => {
        const lower = preset.name.toLowerCase();
        const count = products.filter(
          (p) =>
            p.category_name?.toLowerCase().includes(lower) ||
            p.name.toLowerCase().includes(preset.id) ||
            preset.keywords.some((k) => p.name.toLowerCase().includes(k)) ||
            preset.aliases?.some(
              (a) => p.category_name?.toLowerCase().includes(a) || p.name.toLowerCase().includes(a)
            )
        ).length;

        return {
          id: preset.id,
          name: preset.name,
          slug: preset.slug,
          count,
          image: resolveCategoryImage(preset.name, products),
          href: `/store/${config.slug}/categories/${preset.slug}`,
        };
      });
    }

    const mapped = categories.map((cat) => {
      const catProducts = products.filter((p) => p.category_id === cat.id);
      const image = resolveCategoryImage(cat.name, catProducts);
      return {
        id: cat.id,
        name: cat.name,
        slug: slugify(cat.name),
        count: cat.product_count || catProducts.length,
        image,
        href: `/store/${config.slug}/categories/${slugify(cat.name)}`,
      };
    });

    // Backfill from default presets if merchant has fewer than 14
    if (mapped.length < CURATED_STOREFRONT_CATEGORIES.length) {
      const existingNames = new Set(mapped.map((m) => m.name.toLowerCase()));
      for (const preset of CURATED_STOREFRONT_CATEGORIES) {
        const lower = preset.name.toLowerCase();
        const isAlreadyPresent =
          existingNames.has(lower) ||
          preset.aliases?.some((a) => existingNames.has(a));

        if (!isAlreadyPresent) {
          const count = products.filter(
            (p) =>
              p.category_name?.toLowerCase().includes(lower) ||
              preset.keywords.some((k) => p.name.toLowerCase().includes(k)) ||
              preset.aliases?.some(
                (a) => p.category_name?.toLowerCase().includes(a) || p.name.toLowerCase().includes(a)
              )
          ).length;

          mapped.push({
            id: preset.id,
            name: preset.name,
            slug: preset.slug,
            count,
            image: resolveCategoryImage(preset.name, products),
            href: `/store/${config.slug}/categories/${preset.slug}`,
          });
        }
      }
    }

    return mapped;
  }, [categories, config.slug, products]);

  const handleUpdateQuantity = (variantId: string, delta: number) => {
    updateCart((current) =>
      current
        .map((item) => (item.variantId === variantId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
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

      <main id="main-content" className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-10">
        {/* Page Header matching Screen 3 of Mockup */}
        <div className="border-b border-separator/70 pb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-primary">BROWSE STORE</p>
          <h1 className="mt-1.5 text-3xl sm:text-5xl font-black tracking-tight text-foreground">Categories</h1>
          <p className="mt-1.5 text-sm sm:text-base text-muted">Find what fits your style.</p>
        </div>

        {/* 2-Column Responsive Visual Category Cards Grid */}
        <section aria-label="Store categories" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {displayCategories.map((cat) => (
              <Link
                key={cat.id}
                href={cat.href}
                className="group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-separator/70 bg-surface shadow-2xs transition hover:-translate-y-1 hover:border-brand-primary/50 hover:shadow-md cursor-pointer"
              >
                {/* Photo container */}
                <div className="relative aspect-square w-full overflow-hidden bg-surface-elevated">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Text Footer */}
                <div className="p-3.5 sm:p-4 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-extrabold text-foreground group-hover:text-brand-primary transition truncate">
                      {cat.name}
                    </h2>
                    <span className="text-[11px] text-muted font-medium block mt-0.5">
                      {cat.count > 0 ? `${cat.count} products` : 'Explore'}
                    </span>
                  </div>

                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-elevated flex items-center justify-center text-muted group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition shrink-0">
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* "Shop by Collection" Section matching Screen 3 */}
        <section aria-label="Shop by collection" className="space-y-4 pt-4 border-t border-separator/70">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Shop by Collection</h2>
            <p className="text-xs sm:text-sm text-muted mt-0.5">Curated drops and essentials.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {CURATED_COLLECTIONS.map((col) => (
              <Link
                key={col.id}
                href={`/store/${config.slug}?sort=${col.filterParam}#store-catalog-section`}
                className="group relative overflow-hidden rounded-2xl sm:rounded-3xl min-h-[160px] sm:min-h-[200px] flex flex-col justify-end p-5 sm:p-7 shadow-sm transition hover:shadow-md cursor-pointer"
              >
                {/* Background image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={col.image}
                  alt={col.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Dark gradient overlay for legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />

                {/* Content */}
                <div className="relative z-10 space-y-1 text-white">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                    <ShoppingBag size={12} />
                    <span>Curated Drop</span>
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">{col.title}</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed max-w-xs">{col.description}</p>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:underline">
                      <span>{col.cta}</span>
                      <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {itemCount > 0 && (
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full px-4 py-3 text-xs font-bold text-white shadow-2xl transition hover:opacity-95 active:scale-95 md:bottom-6 md:right-6"
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
        onSelectProduct={(product) => router.push(`/store/${config.slug}/products/${slugify(product.name)}`)}
        onSelectCategory={(categoryId) => {
          setIsSearchOpen(false);
          router.push(`/store/${config.slug}/categories/${categoryId}`);
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
        onAddToCart={() => {
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
        onSelectCategory={(categoryId) => {
          setIsMenuOpen(false);
          router.push(`/store/${config.slug}/categories/${categoryId}`);
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
        onOpenAccount={() => router.push(`/store/${config.slug}/orders`)}
      />
      <StoreFooter config={config} />
    </div>
  );
}
