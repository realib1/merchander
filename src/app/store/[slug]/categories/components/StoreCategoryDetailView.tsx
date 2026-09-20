'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Grid2X2, LucideIcon } from 'lucide-react';
import { StorefrontCategory, StorefrontConfig, StorefrontProduct } from '@/types/storefront';
import { useStorefrontCart, useStorefrontWishlist } from '@/hooks';
import { calculateCartTotals } from '@/utils/storefront';
import { slugify } from '@/utils/format';
import { resolveCategoryMeta, resolveCategoryIcon } from '@/utils/storefront-categories';
import { StoreNavbar } from '../../components/StoreNavbar';
import { StoreFooter } from '../../components/StoreFooter';
import { StoreBottomNav } from '../../components/StoreBottomNav';
import { StoreCartDrawer } from '../../components/StoreCartDrawer';
import { StoreWishlistDrawer } from '../../components/StoreWishlistDrawer';
import { StoreMenuDrawer } from '../../components/StoreMenuDrawer';
import { StoreSearchModal } from '../../components/StoreSearchModal';
import { CategoryDetailHeader } from './CategoryDetailHeader';
import { CategoryDetailSidebar } from './CategoryDetailSidebar';
import { CategoryDetailToolbar, SortOption } from './CategoryDetailToolbar';
import { CategoryProductGrid } from './CategoryProductGrid';

export type { SortOption };

interface StoreCategoryDetailViewProps {
  config: StorefrontConfig;
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
  category: {
    id: string;
    name: string;
    slug: string;
    subtitle?: string;
  };
}

export function StoreCategoryDetailView({
  config,
  categories,
  products,
  category,
}: StoreCategoryDetailViewProps) {
  const router = useRouter();
  const [selectedTag, setSelectedTag] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickAddedId, setQuickAddedId] = useState<string | null>(null);

  const { cart, updateCart, clearCart } = useStorefrontCart(config.slug);
  const wishlist = useStorefrontWishlist(config.slug);
  const primaryColor = config.primary_color || '#f97316';
  const currency = config.currency || 'GHS';
  const { itemCount } = calculateCartTotals(cart);

  const categoryMeta = useMemo(() => resolveCategoryMeta(category.name), [category.name]);

  const sidebarCategories = useMemo(() => {
    const list: Array<{ id: string; name: string; slug: string; icon: LucideIcon; count: number; href: string; isActive: boolean }> = [
      { id: 'all', name: 'All Categories', slug: 'all', icon: Grid2X2, count: products.length, href: `/store/${config.slug}/categories`, isActive: false },
    ];
    categories.forEach((c) => {
      const isCurrent = c.id === category.id || slugify(c.name) === category.slug;
      list.push({ id: c.id, name: c.name, slug: slugify(c.name), icon: resolveCategoryIcon(c.name), count: products.filter((p) => p.category_id === c.id).length, href: `/store/${config.slug}/categories/${slugify(c.name)}`, isActive: isCurrent });
    });
    return list;
  }, [categories, category.id, category.slug, config.slug, products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = products.filter((p) => {
      const inCat = p.category_id === category.id || slugify(p.category_name) === category.slug || slugify(category.name) === 'all';
      if (!inCat) return false;

      let matchesTag = true;
      if (selectedTag !== 'All') {
        const tagLower = selectedTag.toLowerCase();
        const pText = `${p.name} ${p.description || ''}`.toLowerCase();
        matchesTag = pText.includes(tagLower) || pText.includes(tagLower.replace(/s$/, ''));
      }
      const matchesQuery = !query || p.name.toLowerCase().includes(query) || Boolean(p.description?.toLowerCase().includes(query));
      const matchesStock = !inStockOnly || p.total_stock > 0 || p.availability_status === 'PRE_ORDER';
      return matchesTag && matchesQuery && matchesStock;
    });

    return [...result].sort((a, b) => {
      if (sortBy === 'price_asc') return a.min_price - b.min_price;
      if (sortBy === 'price_desc') return b.min_price - a.min_price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return Number(b.is_featured) - Number(a.is_featured);
    });
  }, [category.id, category.name, category.slug, inStockOnly, products, searchQuery, selectedTag, sortBy]);

  const handleQuickAdd = (product: StorefrontProduct) => {
    const variant = product.variants[0];
    if (product.variants.length > 1 || !variant || variant.stock_quantity <= 0) {
      return router.push(`/store/${config.slug}/products/${slugify(product.name)}`);
    }
    updateCart((current) => {
      const existing = current.find((item) => item.variantId === variant.id);
      if (existing) return current.map((item) => item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { variantId: variant.id, productId: product.id, productName: product.name, variantTitle: variant.title || 'Standard', price: variant.price, quantity: 1, imageUrl: product.image_url, sku: variant.sku, batchId: product.active_batch?.id || null, batchName: product.active_batch?.name || null }];
    });
    setQuickAddedId(product.id);
    window.setTimeout(() => setQuickAddedId(null), 1500);
  };

  const handleUpdateQuantity = (variantId: string, delta: number) => {
    updateCart((current) => current.map((i) => i.variantId === variantId ? { ...i, quantity: i.quantity + delta } : i).filter((i) => i.quantity > 0));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <StoreNavbar config={config} cartCount={itemCount} wishlistCount={wishlist.count} onOpenCart={() => setIsCartOpen(true)} onOpenWishlist={() => setIsWishlistOpen(true)} onOpenMenu={() => setIsMenuOpen(true)} onOpenSearch={() => setIsSearchOpen(true)} onOpenTracking={() => router.push(`/store/${config.slug}/orders`)} />

      <main id="main-content" className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <CategoryDetailHeader slug={config.slug} categoryName={category.name} subtitle={category.subtitle || categoryMeta.subtitle} icon={resolveCategoryIcon(category.name)} totalProducts={filteredProducts.length} primaryColor={primaryColor} />

        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-8 items-start">
          <CategoryDetailSidebar categories={sidebarCategories} primaryColor={primaryColor} />

          <div className="space-y-6 min-w-0">
            <CategoryDetailToolbar categoryName={category.name} subtitle={category.subtitle || categoryMeta.subtitle} icon={resolveCategoryIcon(category.name)} searchQuery={searchQuery} tags={categoryMeta.tags} selectedTag={selectedTag} inStockOnly={inStockOnly} sortBy={sortBy} primaryColor={primaryColor} onSearchChange={setSearchQuery} onSelectTag={setSelectedTag} onToggleInStock={setInStockOnly} onSortChange={setSortBy} />

            <CategoryProductGrid products={filteredProducts} categoryName={category.name} selectedTag={selectedTag} storeSlug={config.slug} currency={currency} primaryColor={primaryColor} savedIds={wishlist.savedIds} quickAddedId={quickAddedId} onClearFilter={() => setSelectedTag('All')} onResetAllFilters={() => { setSelectedTag('All'); setSearchQuery(''); setInStockOnly(false); }} onToggleWishlist={(p) => wishlist.toggleSave(p.id)} onQuickAdd={handleQuickAdd} />
          </div>
        </div>
      </main>

      <StoreFooter config={config} />
      <StoreBottomNav storeSlug={config.slug} cartCount={itemCount} wishlistCount={wishlist.count} primaryColor={primaryColor} onOpenCart={() => setIsCartOpen(true)} onOpenWishlist={() => setIsWishlistOpen(true)} onOpenAccount={() => router.push(`/store/${config.slug}/orders`)} />
      <StoreCartDrawer isOpen={isCartOpen} config={config} cart={cart} onClose={() => setIsCartOpen(false)} onUpdateQuantity={handleUpdateQuantity} onRemoveItem={(vId) => updateCart((prev) => prev.filter((i) => i.variantId !== vId))} onClearCart={clearCart} />
      <StoreWishlistDrawer isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} products={products} savedIds={wishlist.savedIds} onRemove={wishlist.removeProduct} onAddToCart={(p) => { handleQuickAdd(p); setIsWishlistOpen(false); setIsCartOpen(true); }} onSyncPhone={wishlist.syncWithPhone} currency={currency} primaryColor={primaryColor} />
      <StoreMenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} config={config} categories={categories} wishlistCount={wishlist.count} onSelectCategory={(catId) => router.push(`/store/${config.slug}/categories/${catId}`)} onOpenTracking={() => { setIsMenuOpen(false); router.push(`/store/${config.slug}/orders`); }} onOpenWishlist={() => setIsWishlistOpen(true)} />
      <StoreSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} products={products} categories={categories} currency={currency} primaryColor={primaryColor} onSelectProduct={(p) => { setIsSearchOpen(false); router.push(`/store/${config.slug}/products/${slugify(p.name)}`); }} onSelectCategory={(catId) => router.push(`/store/${config.slug}/categories/${catId}`)} />
    </div>
  );
}
