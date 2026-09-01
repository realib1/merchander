'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StorefrontConfig, StorefrontProduct, StorefrontProductVariant, StorefrontCartItem } from '@/types/storefront';
import { slugify } from '@/utils/format';
import { useStorefrontWishlist } from '@/hooks/useStorefrontWishlist';
import { StoreCartDrawer } from '@/app/store/[slug]/components/StoreCartDrawer';
import { StoreWishlistDrawer } from '@/app/store/[slug]/components/StoreWishlistDrawer';
import { StoreSearchModal } from '@/app/store/[slug]/components/StoreSearchModal';
import { StoreFooter } from '@/app/store/[slug]/components/StoreFooter';
import { StoreBottomNav } from '@/app/store/[slug]/components/StoreBottomNav';
import { StoreMenuDrawer } from '@/app/store/[slug]/components/StoreMenuDrawer';
import { StoreNavbar } from '@/app/store/[slug]/components/StoreNavbar';
import { ProductImageGallery } from './ProductImageGallery';
import { ProductHeaderInfo } from './ProductHeaderInfo';
import { ProductVariantPicker } from './ProductVariantPicker';
import { ProductSpecsSection } from './ProductSpecsSection';
import { ProductRelatedRow } from './ProductRelatedRow';
import { calculateCartTotals } from '@/utils/storefront';
import { toast } from 'sonner';

interface DirectProductViewProps {
  config: StorefrontConfig;
  product: StorefrontProduct;
  relatedProducts: StorefrontProduct[];
  slug: string;
}

export function DirectProductView({ config, product, relatedProducts, slug }: DirectProductViewProps) {
  const router = useRouter();
  const primaryColor = config.primary_color || '#3b82f6';
  const currency = config.currency || 'GHS';

  const defaultVariant = product.variants.find((v) => v.is_available) || product.variants[0];
  const [selectedVariant, setSelectedVariant] = useState<StorefrontProductVariant | undefined>(defaultVariant);
  const [quantity, setQuantity] = useState(1);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [cart, setCart] = useState<StorefrontCartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`merchander_cart_${slug}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const wishlist = useStorefrontWishlist(slug);

  const updateCart = (updater: (prev: StorefrontCartItem[]) => StorefrontCartItem[]) => {
    setCart((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(`merchander_cart_${slug}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const isSelectedOutOfStock = selectedVariant
    ? (selectedVariant.stock_quantity ?? 0) <= 0
    : (product.total_stock ?? 0) <= 0;
  const isAvailable = !isSelectedOutOfStock;

  const handleAddToCart = (openDrawer = true) => {
    if (!selectedVariant || isSelectedOutOfStock) return;

    updateCart((prev) => {
      const existing = prev.find((item) => item.variantId === selectedVariant.id);
      if (existing) {
        return prev.map((item) =>
          item.variantId === selectedVariant.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          variantId: selectedVariant.id,
          productId: product.id,
          productName: product.name,
          variantTitle: selectedVariant.title || 'Standard',
          price: selectedVariant.price,
          quantity,
          imageUrl: product.image_url,
          sku: selectedVariant.sku,
        },
      ];
    });

    toast.success(`Added ${product.name} to bag`);
    if (openDrawer) setIsCartOpen(true);
  };

  const handleShare = async () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} | ${config.store_name}`,
          text: `Check out ${product.name} on ${config.store_name}:`,
          url: currentUrl,
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(currentUrl);
      toast.success('Product link copied to clipboard!');
    }
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
          onOpenTracking={() => router.push(`/store/${slug}/orders`)}
        />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-12">
          {/* Main 2-Column Product Detail Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
            <ProductImageGallery
              images={product.image_urls.length > 0 ? product.image_urls : product.image_url ? [product.image_url] : []}
              productName={product.name}
            />

            <div className="space-y-6">
              <ProductHeaderInfo
                product={product}
                selectedVariant={selectedVariant}
                slug={slug}
                primaryColor={primaryColor}
                currency={currency}
              />

              <ProductVariantPicker
                config={config}
                product={product}
                selectedVariant={selectedVariant}
                quantity={quantity}
                isAvailable={isAvailable}
                primaryColor={primaryColor}
                onSelectVariant={setSelectedVariant}
                onQuantityChange={setQuantity}
                onAddToCart={() => handleAddToCart(true)}
                onBuyNow={() => handleAddToCart(true)}
                onShare={handleShare}
              />

              <ProductSpecsSection config={config} product={product} />
            </div>
          </div>

          <ProductRelatedRow
            relatedProducts={relatedProducts}
            storeSlug={slug}
            currency={currency}
            primaryColor={primaryColor}
            isSaved={wishlist.isSaved}
            onToggleWishlist={wishlist.toggleSave}
            onQuickAdd={(p) => router.push(`/store/${slug}/products/${slugify(p.name)}`)}
          />
        </main>
      </div>

      <StoreSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={relatedProducts}
        categories={[]}
        currency={currency}
        primaryColor={primaryColor}
        onSelectProduct={(p) => {
          setIsSearchOpen(false);
          router.push(`/store/${slug}/products/${slugify(p.name)}`);
        }}
        onSelectCategory={() => {
          setIsSearchOpen(false);
          router.push(`/store/${slug}`);
        }}
      />

      <StoreCartDrawer
        isOpen={isCartOpen}
        config={config}
        cart={cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={(vId, delta) =>
          updateCart((prev) =>
            prev
              .map((i) => (i.variantId === vId ? { ...i, quantity: i.quantity + delta } : i))
              .filter((i) => i.quantity > 0)
          )
        }
        onRemoveItem={(vId) => updateCart((prev) => prev.filter((i) => i.variantId !== vId))}
        onClearCart={() => updateCart(() => [])}
      />

      <StoreWishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        products={relatedProducts}
        savedIds={wishlist.savedIds}
        onRemove={wishlist.removeProduct}
        onAddToCart={(p) => router.push(`/store/${slug}/products/${slugify(p.name)}`)}
        onSyncPhone={wishlist.syncWithPhone}
        currency={currency}
        primaryColor={primaryColor}
      />

      <StoreMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        config={config}
        onOpenTracking={() => {
          setIsMenuOpen(false);
          router.push(`/store/${slug}/orders`);
        }}
        onOpenWishlist={() => setIsWishlistOpen(true)}
      />

      <StoreBottomNav
        storeSlug={slug}
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
