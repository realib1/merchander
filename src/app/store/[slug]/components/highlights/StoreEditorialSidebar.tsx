'use client';

import React from 'react';
import { StorefrontCategory, StorefrontProduct, StorefrontConfig } from '@/types/storefront';
import { StorePromotionSpotlights } from './StorePromotionSpotlights';

interface StoreEditorialSidebarProps {
  slug: string;
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
  primaryColor: string;
  config?: StorefrontConfig;
}

export function StoreEditorialSidebar({
  slug,
  categories,
  products,
  primaryColor,
  config,
}: StoreEditorialSidebarProps) {
  return (
    <div className="space-y-5 select-none">
      <StorePromotionSpotlights
        slug={slug}
        categories={categories}
        products={products}
        primaryColor={primaryColor}
        config={config}
      />
    </div>
  );
}
