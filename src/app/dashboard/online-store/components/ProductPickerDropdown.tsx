'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Package, ChevronDown, Search, Check, X } from 'lucide-react';

export interface ProductPickerItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  description?: string | null;
}

interface ProductPickerDropdownProps {
  products: ProductPickerItem[];
  selectedProductId: string;
  currency?: string;
  onSelect: (productId: string) => void;
  placeholder?: string;
  compact?: boolean;
  className?: string;
  showClear?: boolean;
}

export function ProductPickerDropdown({
  products,
  selectedProductId,
  currency = 'GHS',
  onSelect,
  placeholder = 'Select a product...',
  compact = false,
  className = '',
  showClear = true,
}: ProductPickerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredProducts = searchQuery.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      {compact ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 bg-surface border border-separator/80 hover:border-separator rounded-xl px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-surface-elevated/80 transition cursor-pointer shadow-2xs max-w-[200px] sm:max-w-[240px] truncate"
          title={selectedProduct ? `Selected: ${selectedProduct.name}` : placeholder}
        >
          <Package size={13} className="text-brand-primary shrink-0" />
          <span className="text-[11px] font-semibold text-muted shrink-0">Auto-fill:</span>
          <span className="truncate text-foreground font-medium">
            {selectedProduct ? selectedProduct.name : placeholder}
          </span>
          <ChevronDown
            size={12}
            className={`text-muted shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full bg-surface border border-separator hover:border-brand-primary/60 rounded-xl px-3.5 py-2 text-xs text-foreground font-medium hover:bg-surface-elevated/50 transition cursor-pointer flex items-center justify-between gap-2 shadow-2xs text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {selectedProduct?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedProduct.imageUrl}
                alt=""
                className="w-6 h-6 rounded-md object-cover border border-separator/60 shrink-0 bg-surface"
              />
            ) : (
              <div className="w-6 h-6 rounded-md border border-separator/60 bg-surface flex items-center justify-center shrink-0 text-muted">
                <Package size={12} />
              </div>
            )}
            <span className={`truncate ${selectedProduct ? 'text-foreground font-semibold' : 'text-muted'}`}>
              {selectedProduct
                ? `${selectedProduct.name} ${selectedProduct.price ? `(${currency} ${selectedProduct.price.toFixed(2)})` : ''}`
                : placeholder}
            </span>
          </div>
          <ChevronDown
            size={14}
            className={`text-muted shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 z-50 rounded-xl border border-separator bg-surface-elevated shadow-xl overflow-hidden ${
            compact ? 'right-0 w-72 sm:w-80' : 'left-0 right-0 w-full min-w-[280px]'
          }`}
        >
          {/* Search bar when multiple products exist */}
          {products.length > 3 && (
            <div className="p-2 border-b border-separator/60 bg-surface/50">
              <div className="relative flex items-center">
                <Search size={13} className="absolute left-2.5 text-muted pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full bg-surface border border-separator rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Optional Clear Option */}
          {showClear && selectedProductId && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect('');
                setIsOpen(false);
                setSearchQuery('');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-secondary/70 transition cursor-pointer text-left border-b border-separator/40"
            >
              <X size={13} className="shrink-0" />
              <span>Clear selection</span>
            </button>
          )}

          {/* Product List */}
          <div className="max-h-60 overflow-y-auto p-1 divide-y divide-separator/30">
            {filteredProducts.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted">
                No products match &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = p.id === selectedProductId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(p.id);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-xs transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                        : 'text-foreground hover:bg-surface-secondary/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover border border-separator/60 shrink-0 bg-surface"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg border border-separator/60 bg-surface flex items-center justify-center shrink-0 text-muted">
                          <Package size={14} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium leading-tight">{p.name}</div>
                        <div className="flex items-center gap-2 text-[10px] text-muted mt-0.5">
                          {p.price > 0 && (
                            <span>
                              {currency} {p.price.toFixed(2)}
                            </span>
                          )}
                          {p.stock > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              In stock ({p.stock})
                            </span>
                          ) : (
                            <span className="text-rose-500 font-medium">Out of stock</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-brand-primary shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
