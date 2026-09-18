'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag } from 'lucide-react';
import { StorefrontConfig, StorefrontProduct } from '@/types/storefront';
import { useStorefrontCart, useStorefrontWishlist } from '@/hooks';
import { calculateCartTotals } from '@/utils/storefront';
import { slugify } from '@/utils/format';
import { StoreNavbar } from './StoreNavbar';
import { StoreFooter } from './StoreFooter';
import { StoreBottomNav } from './StoreBottomNav';
import { StoreMenuDrawer } from './StoreMenuDrawer';
import { StoreCartDrawer } from './StoreCartDrawer';
import { StoreWishlistDrawer } from './StoreWishlistDrawer';
import { StoreProductCard } from './StoreProductCard';

interface StoreWishlistViewProps {
  config: StorefrontConfig;
  products: StorefrontProduct[];
}

export function StoreWishlistView({ config, products }: StoreWishlistViewProps) {
  const router = useRouter();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [quickAddedId, setQuickAddedId] = useState<string | null>(null);
  const { cart, updateCart, clearCart } = useStorefrontCart(config.slug);
  const wishlist = useStorefrontWishlist(config.slug);
  const primaryColor = config.primary_color || '#3b82f6';
  const currency = config.currency || 'GHS';
  const savedProducts = products.filter((product) => wishlist.savedIds.includes(product.id));
  const { itemCount } = calculateCartTotals(cart);

  const addToCart = (product: StorefrontProduct) => {
    const variant = product.variants[0];
    if (!variant || variant.stock_quantity <= 0 || product.variants.length > 1) {
      router.push(`/store/${config.slug}/products/${slugify(product.name)}`);
      return;
    }
    updateCart((current) => {
      const existing = current.find((item) => item.variantId === variant.id);
      if (existing) return current.map((item) => item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, {
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
      }];
    });
    setQuickAddedId(product.id);
    window.setTimeout(() => setQuickAddedId(null), 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StoreNavbar
        config={config}
        cartCount={itemCount}
        wishlistCount={wishlist.count}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenTracking={() => router.push(`/store/${config.slug}/orders`)}
      />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-separator/70 pb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-primary">Your edit</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-5xl">Wishlist</h1>
            <span className="text-xs text-muted">{savedProducts.length} saved</span>
          </div>
        </div>

        {savedProducts.length === 0 ? (
          <div className="mx-auto max-w-md py-20 text-center">
            <Heart size={42} className="mx-auto text-brand-primary/70" />
            <h2 className="mt-4 text-lg font-bold">Nothing saved yet</h2>
            <p className="mt-2 text-sm text-muted">Save products while you browse and they will stay here on this device.</p>
            <button
              type="button"
              onClick={() => router.push(`/store/${config.slug}`)}
              className="mt-6 rounded-full px-5 py-3 text-xs font-bold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Explore products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {savedProducts.map((product) => (
              <StoreProductCard
                key={product.id}
                product={product}
                storeSlug={config.slug}
                currency={currency}
                primaryColor={primaryColor}
                isSaved
                isQuickAdded={quickAddedId === product.id}
                onToggleWishlist={() => wishlist.toggleSave(product.id)}
                onQuickAdd={() => addToCart(product)}
              />
            ))}
          </div>
        )}
      </main>
      {itemCount > 0 && (
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full px-4 py-3 text-xs font-bold text-white shadow-2xl md:bottom-6 md:right-6"
          style={{ backgroundColor: primaryColor }}
        >
          <ShoppingBag size={16} /> View Cart ({itemCount})
        </button>
      )}
      <StoreCartDrawer
        isOpen={isCartOpen}
        config={config}
        cart={cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={(variantId, delta) => updateCart((current) => current.map((item) => item.variantId === variantId ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0))}
        onRemoveItem={(variantId) => updateCart((current) => current.filter((item) => item.variantId !== variantId))}
        onClearCart={clearCart}
      />
      <StoreWishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        products={products}
        savedIds={wishlist.savedIds}
        onRemove={wishlist.removeProduct}
        onAddToCart={addToCart}
        onSyncPhone={wishlist.syncWithPhone}
        currency={currency}
        primaryColor={primaryColor}
      />
      <StoreMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        config={config}
        categories={[]}
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
