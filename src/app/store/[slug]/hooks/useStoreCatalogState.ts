'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StorefrontConfig, StorefrontProduct } from '@/types/storefront';
import { SortOption } from '../components/StoreCatalogGrid';
import { useStorefrontWishlist, useStorefrontCart } from '@/hooks';
import { slugify } from '@/utils/format';
import { filterAndSortCatalogProducts } from './catalog-filtering';

interface UseStoreCatalogStateProps {
  config: StorefrontConfig;
  products: StorefrontProduct[];
}

export function useStoreCatalogState({ config, products }: UseStoreCatalogStateProps) {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const { cart, updateCart, clearCart } = useStorefrontCart(config.slug);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickAddedId, setQuickAddedId] = useState<string | null>(null);

  const wishlist = useStorefrontWishlist(config.slug);

  const preorderCount = useMemo(
    () => products.filter((p) => p.availability_status === 'PRE_ORDER' || Boolean(p.active_batch)).length,
    [products]
  );

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

  const filteredAndSortedProducts = useMemo(
    () => filterAndSortCatalogProducts(products, { selectedCategoryId, searchQuery, inStockOnly, sortBy }),
    [products, selectedCategoryId, searchQuery, inStockOnly, sortBy]
  );

  const featuredProducts = useMemo(() => {
    const featuredProductIds = config.featured_product_ids;
    if (!featuredProductIds || featuredProductIds.length === 0) {
      return products.filter((p) => p.is_featured).slice(0, 4);
    }
    return products.filter((p) => featuredProductIds.includes(p.id));
  }, [products, config.featured_product_ids]);

  const handleShopPreorders = () => {
    setSelectedCategoryId('preorders');
    const catalogEl = document.getElementById('store-catalog-section');
    if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuickAdd = (product: StorefrontProduct) => {
    const firstVariant = product.variants[0];
    if (product.variants.length > 1 || !firstVariant || firstVariant.stock_quantity <= 0) {
      router.push(`/store/${config.slug}/products/${slugify(product.name)}`);
      return;
    }

    updateCart((prev) => {
      const existing = prev.find((i) => i.variantId === firstVariant.id);
      if (existing) {
        return prev.map((i) => (i.variantId === firstVariant.id ? { ...i, quantity: i.quantity + 1 } : i));
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
          batchId: product.active_batch?.id || null,
        },
      ];
    });

    setQuickAddedId(product.id);
    setTimeout(() => setQuickAddedId(null), 1500);
  };

  const handleUpdateQuantity = (variantId: string, delta: number) => {
    updateCart((prev) =>
      prev
        .map((item) => {
          if (item.variantId === variantId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as typeof prev
    );
  };

  return {
    router,
    selectedCategoryId,
    setSelectedCategoryId,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    inStockOnly,
    setInStockOnly,
    cart,
    updateCart,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    isWishlistOpen,
    setIsWishlistOpen,
    isMenuOpen,
    setIsMenuOpen,
    isSearchOpen,
    setIsSearchOpen,
    quickAddedId,
    wishlist,
    preorderCount,
    filteredAndSortedProducts,
    featuredProducts,
    handleShopPreorders,
    handleQuickAdd,
    handleUpdateQuantity,
  };
}
