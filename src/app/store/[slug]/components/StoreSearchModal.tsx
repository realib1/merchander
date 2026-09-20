'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { StorefrontCategory, StorefrontProduct } from '@/types/storefront';
import { Search, X, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { useFocusTrap } from '@/hooks';

interface StoreSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: StorefrontProduct[];
  categories: StorefrontCategory[];
  currency?: string;
  primaryColor?: string;
  onSelectProduct: (product: StorefrontProduct) => void;
  onSelectCategory: (categoryId: string) => void;
}

export function StoreSearchModal({
  isOpen,
  onClose,
  products,
  categories,
  currency = 'GHS',
  onSelectProduct,
  onSelectCategory,
}: StoreSearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  // Auto focus when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Filtered matching products
  const matchingProducts = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    return products
      .filter((p) => {
        const matchName = p.name.toLowerCase().includes(trimmed);
        const matchCategory = p.category_name?.toLowerCase().includes(trimmed);
        const matchDesc = p.description?.toLowerCase().includes(trimmed);
        const matchVariant = p.variants?.some(
          (v) => v.title?.toLowerCase().includes(trimmed) || v.sku?.toLowerCase().includes(trimmed)
        );
        return matchName || matchCategory || matchDesc || matchVariant;
      })
      .slice(0, 8);
  }, [products, query]);

  const containerRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Search storefront products"
    >
      <div className="bg-surface border border-separator rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl animate-scaleUp flex flex-col max-h-[80vh]">
        {/* 1. Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-separator/80 bg-surface-elevated/40">
          <Search size={18} className="text-muted shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, categories, specs..."
            className="w-full bg-transparent text-sm sm:text-base font-medium placeholder:text-muted focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-muted hover:text-foreground transition cursor-pointer"
              aria-label="Clear search query"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-muted bg-surface border border-separator/80 rounded-md">
              ESC
            </kbd>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="ml-2 sm:hidden p-1 rounded-lg text-muted hover:text-foreground transition cursor-pointer"
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Results / Suggestions Body */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
          {query.trim() === '' ? (
            <div className="space-y-4 py-2">
              {categories.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2 px-1">
                    Explore Categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCategory('all');
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-separator text-xs font-semibold text-foreground transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>All Products</span>
                      <span className="text-[10px] text-muted">({products.length})</span>
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          onSelectCategory(cat.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-separator text-xs font-semibold text-foreground transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{cat.name}</span>
                        <span className="text-[10px] text-muted">({cat.product_count})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2 px-1">Popular in Store</p>
                <div className="space-y-1.5">
                  {products.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onSelectProduct(p);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface-elevated text-left transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-separator/80 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag size={16} className="text-muted opacity-40" />
                          )}
                        </div>
                        <div className="min-w-0 truncate">
                          <p className="text-xs font-bold text-foreground group-hover:text-brand-primary transition truncate">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-muted truncate">{p.category_name}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <p className="text-xs font-bold text-foreground tabular-nums">
                          {formatCurrency(p.min_price, currency)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : matchingProducts.length === 0 ? (
            <div className="text-center py-8 space-y-2 text-muted">
              <Package size={36} className="mx-auto opacity-30" />
              <p className="text-sm font-semibold text-foreground">No products found</p>
              <p className="text-xs max-w-xs mx-auto">
                {`No items match "${query}". Try searching with a different name or category.`}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2 px-1">
                Matching Products ({matchingProducts.length})
              </p>
              {matchingProducts.map((p) => {
                const isOutOfStock = p.total_stock <= 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectProduct(p);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-surface-elevated border border-transparent hover:border-separator/80 text-left transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-separator/80 overflow-hidden shrink-0 flex items-center justify-center relative">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag size={18} className="text-muted opacity-40" />
                        )}
                        {isOutOfStock && (
                          <span className="absolute inset-0 bg-black/60 text-white text-[8px] font-bold flex items-center justify-center">
                            Sold Out
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 truncate">
                        <p className="text-xs font-bold text-foreground group-hover:text-brand-primary transition truncate">
                          {p.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted truncate mt-0.5">
                          <span>{p.category_name}</span>
                          {p.variants.length > 1 && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-muted/60 inline-block shrink-0" />
                              <span>{p.variants.length} options</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pl-2">
                      <div className="text-right">
                        <p className="text-xs font-bold text-foreground tabular-nums">
                          {formatCurrency(p.min_price, currency)}
                        </p>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-surface-elevated border border-separator flex items-center justify-center text-muted group-hover:text-foreground transition">
                        <ArrowRight size={13} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Footer Tip */}
        <div className="p-3 border-t border-separator/60 bg-surface-elevated/20 flex items-center justify-between text-[11px] text-muted px-4">
          <span>
            Showing results from <strong className="text-foreground">{products.length}</strong> items in catalog
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="hover:text-foreground font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
