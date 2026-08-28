'use client';

import React, { useState } from 'react';
import { StorefrontCartItem, StorefrontCategory, StorefrontConfig, StorefrontProduct } from '@/types/storefront';
import { ProductDetailModal } from './ProductDetailModal';
import { StoreCartDrawer } from './StoreCartDrawer';
import { calculateCartTotals } from '@/utils/storefront';
import { formatCurrency } from '@/utils/format';
import { Search, ShoppingBag, Plus, Sparkles, Package } from 'lucide-react';

interface StoreCatalogProps {
  config: StorefrontConfig;
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
}

export function StoreCatalog({ config, categories, products }: StoreCatalogProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalProduct, setActiveModalProduct] = useState<StorefrontProduct | null>(null);
  const [cart, setCart] = useState<StorefrontCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const currency = config.currency || 'GHS';

  // Filter products by category and search term
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategoryId === 'all' || p.category_id === selectedCategoryId;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (newItem: StorefrontCartItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.variantId === newItem.variantId);
      if (existing) {
        return prev.map((item) =>
          item.variantId === newItem.variantId ? { ...item, quantity: item.quantity + newItem.quantity } : item
        );
      }
      return [...prev, newItem];
    });
  };

  const handleUpdateQuantity = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.variantId === variantId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (variantId: string) => {
    setCart((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const { itemCount } = calculateCartTotals(cart);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Category Pills & Search */}
      <div className="space-y-3.5 mb-6">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search catalog by name or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-separator rounded-2xl pl-9 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary shadow-xs transition"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition border ${
              selectedCategoryId === 'all'
                ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                : 'bg-surface border-separator text-muted hover:text-foreground'
            }`}
          >
            All Products ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition border ${
                selectedCategoryId === cat.id
                  ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                  : 'bg-surface border-separator text-muted hover:text-foreground'
              }`}
            >
              {cat.name} ({cat.product_count})
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-surface border border-separator rounded-2xl p-12 text-center text-muted space-y-2">
          <Package size={36} className="mx-auto opacity-30" />
          <p className="text-sm font-semibold text-foreground">No products found</p>
          <p className="text-xs">Try selecting another category or changing your search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
          {filteredProducts.map((p) => {
            const hasMultiplePrices = p.min_price !== p.max_price && p.max_price > 0;
            const isOutOfStock = p.total_stock <= 0;

            return (
              <div
                key={p.id}
                onClick={() => setActiveModalProduct(p)}
                className="bg-surface border border-separator rounded-2xl overflow-hidden shadow-xs hover:border-separator/80 transition flex flex-col justify-between cursor-pointer group"
              >
                {/* Product Image */}
                <div className="relative aspect-square w-full bg-surface-elevated overflow-hidden">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted">
                      <ShoppingBag size={28} className="opacity-20" />
                    </div>
                  )}

                  {/* Stock pill */}
                  {isOutOfStock ? (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-destructive text-white text-[9px] font-bold">
                      Sold Out
                    </span>
                  ) : p.is_featured ? (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-brand-primary text-white text-[9px] font-bold flex items-center gap-0.5">
                      <Sparkles size={8} /> Featured
                    </span>
                  ) : null}
                </div>

                {/* Details */}
                <div className="p-3 flex flex-col justify-between flex-1">
                  <div>
                    <span className="text-[10px] text-muted font-medium">{p.category_name}</span>
                    <h3 className="text-xs font-bold text-foreground line-clamp-2 mt-0.5 group-hover:text-brand-primary transition">
                      {p.name}
                    </h3>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-separator/50 flex items-center justify-between">
                    <div className="font-bold text-xs text-brand-primary tabular-nums">
                      {hasMultiplePrices
                        ? `${formatCurrency(p.min_price, currency)} - ${formatCurrency(p.max_price, currency)}`
                        : formatCurrency(p.min_price, currency)}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModalProduct(p);
                      }}
                      className="h-6 w-6 rounded-lg bg-surface-elevated hover:bg-brand-primary hover:text-white border border-separator text-muted flex items-center justify-center cursor-pointer transition shadow-xs"
                      title="Select options"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Cart Button */}
      {itemCount > 0 && (
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-5 py-3 rounded-full bg-brand-primary text-white text-xs font-bold shadow-2xl hover:bg-brand-primary/90 transition-transform active:scale-95 cursor-pointer flex items-center gap-2.5 animate-scaleUp"
        >
          <ShoppingBag size={16} />
          <span>View Bag ({itemCount})</span>
        </button>
      )}

      {/* Variant Selector Modal */}
      <ProductDetailModal
        product={activeModalProduct}
        currency={currency}
        onClose={() => setActiveModalProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Slide-over Cart Drawer */}
      <StoreCartDrawer
        isOpen={isCartOpen}
        config={config}
        cart={cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />
    </div>
  );
}
