'use client';

import React from 'react';
import { StorefrontHeroSlide } from '@/types/storefront';
import { ProductPickerDropdown } from '../ProductPickerDropdown';
import { HeroProduct } from './hero-defaults';

interface HeroLinkSelectorProps {
  currentSlide: StorefrontHeroSlide;
  products: HeroProduct[];
  currency: string;
  onUpdateSlide: (updates: Partial<StorefrontHeroSlide>) => void;
  onProductSelect: (productId: string) => void;
}

export function HeroLinkSelector({
  currentSlide,
  products,
  currency,
  onUpdateSlide,
  onProductSelect,
}: HeroLinkSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-separator/50">
      <div>
        <label className="block text-xs font-bold text-foreground mb-1">Button Label</label>
        <input
          type="text"
          value={currentSlide.cta_text || 'Shop Now'}
          onChange={(e) => onUpdateSlide({ cta_text: e.target.value })}
          placeholder="Shop Now"
          className="w-full bg-surface border border-separator rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-foreground mb-1">Link Destination</label>
        <div className="grid grid-cols-3 gap-1 p-1 bg-surface border border-separator rounded-xl">
          {[
            { id: 'catalog', label: 'All Catalog' },
            { id: 'product', label: 'Product' },
            { id: 'category', label: 'Category' },
          ].map((dest) => {
            const isActive = (currentSlide.link_type || 'catalog') === dest.id;
            return (
              <button
                key={dest.id}
                type="button"
                onClick={() =>
                  onUpdateSlide({
                    link_type: dest.id as 'catalog' | 'product' | 'category',
                    link_id: '',
                  })
                }
                className={`py-1.5 text-center text-xs font-semibold rounded-lg transition cursor-pointer ${
                  isActive
                    ? 'bg-surface-elevated text-foreground shadow-2xs border border-separator/80'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {dest.label}
              </button>
            );
          })}
        </div>
      </div>

      {currentSlide.link_type === 'product' && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-foreground">Target Product</label>
            {currentSlide.link_id && (
              <button
                type="button"
                onClick={() => onProductSelect(currentSlide.link_id!)}
                className="text-[10px] font-bold text-brand-primary hover:underline cursor-pointer"
                title="Re-populate headline, tagline, image, and price from this product"
              >
                Re-fill details
              </button>
            )}
          </div>
          <ProductPickerDropdown
            products={products}
            selectedProductId={currentSlide.link_id || ''}
            currency={currency}
            onSelect={(productId) => {
              if (productId) {
                onProductSelect(productId);
              } else {
                onUpdateSlide({ link_id: '' });
              }
            }}
            placeholder="Select a product to auto-fill..."
            compact={false}
          />
          <p className="text-[10px] text-muted mt-1">
            Selecting a product auto-fills its photo, headline, tagline, and price.
          </p>
        </div>
      )}

      {currentSlide.link_type === 'category' && (
        <div>
          <label className="block text-xs font-bold text-foreground mb-1">Target Category Slug</label>
          <input
            type="text"
            value={currentSlide.link_id || ''}
            onChange={(e) => onUpdateSlide({ link_id: e.target.value })}
            placeholder="e.g. fashion-clothing"
            className="w-full bg-surface border border-separator rounded-xl px-3.5 py-2 text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
          />
        </div>
      )}
    </div>
  );
}
