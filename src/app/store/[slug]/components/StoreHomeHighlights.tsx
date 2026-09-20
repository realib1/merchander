'use client';

import React from 'react';
import { StorefrontCategory, StorefrontProduct } from '@/types/storefront';
import { DEFAULT_CATEGORY_TEMPLATES } from './highlights/category-templates';
import { StoreCategoryIconsStrip } from './highlights/StoreCategoryIconsStrip';
import { StoreTrustBadges } from './highlights/StoreTrustBadges';
import { StoreTrustBar } from './highlights/StoreTrustBar';
import { StorePromotionSpotlights } from './highlights/StorePromotionSpotlights';
import { StoreEditorialSidebar } from './highlights/StoreEditorialSidebar';

export {
  DEFAULT_CATEGORY_TEMPLATES,
  StoreCategoryIconsStrip,
  StoreTrustBadges,
  StoreTrustBar,
  StorePromotionSpotlights,
  StoreEditorialSidebar,
};

interface StoreHomeHighlightsProps {
  slug: string;
  categories: StorefrontCategory[];
  products?: StorefrontProduct[];
  primaryColor?: string;
  currency?: string;
}

export function StoreHomeHighlights({ primaryColor }: StoreHomeHighlightsProps) {
  return (
    <section id="store-highlights" className="mx-auto max-w-7xl px-4 pt-2 pb-4 sm:px-6 lg:px-8" aria-label="Store highlights">
      <StoreTrustBar primaryColor={primaryColor} />
    </section>
  );
}
