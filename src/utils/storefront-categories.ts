import { LucideIcon, Tag } from 'lucide-react';
import { slugify } from './format';
import { StorefrontProduct } from '@/types/storefront';
import { StorefrontCategoryMeta } from './storefront-categories/types';
import { APPAREL_CATEGORIES } from './storefront-categories/apparel-categories';
import { TECH_HOME_CATEGORIES } from './storefront-categories/tech-home-categories';
import { LIFESTYLE_CATEGORIES } from './storefront-categories/lifestyle-categories';
import { GENERAL_CATEGORIES } from './storefront-categories/general-categories';
import { CURATED_COLLECTIONS } from './storefront-categories/collections-data';

export type { StorefrontCategoryMeta };
export { CURATED_COLLECTIONS };

export const CURATED_STOREFRONT_CATEGORIES: StorefrontCategoryMeta[] = [
  ...APPAREL_CATEGORIES,
  ...TECH_HOME_CATEGORIES,
  ...LIFESTYLE_CATEGORIES,
  ...GENERAL_CATEGORIES,
];

/**
 * Resolves an appropriate image for a category:
 * 1. Checks if any product in the category has a valid image_url
 * 2. Matches against curated category presets
 * 3. Falls back to a clean default
 */
export function resolveCategoryImage(
  categoryName: string,
  categoryProducts: StorefrontProduct[] = []
): string {
  const productWithImg = categoryProducts.find((p) => p.image_url);
  if (productWithImg?.image_url) {
    return productWithImg.image_url;
  }

  const lower = categoryName.toLowerCase();
  const matched = CURATED_STOREFRONT_CATEGORIES.find(
    (c) =>
      c.name.toLowerCase() === lower ||
      c.id === lower ||
      c.slug === lower ||
      c.aliases?.some((a) => lower.includes(a)) ||
      c.keywords.some((k) => lower.includes(k))
  );

  return matched?.image || '/images/categories/category-apparel.jpg';
}

/**
 * Resolves an appropriate icon for a category
 */
export function resolveCategoryIcon(categoryName: string): LucideIcon {
  const lower = categoryName.toLowerCase();
  const matched = CURATED_STOREFRONT_CATEGORIES.find(
    (c) =>
      c.name.toLowerCase() === lower ||
      c.id === lower ||
      c.slug === lower ||
      c.aliases?.some((a) => lower.includes(a)) ||
      c.keywords.some((k) => lower.includes(k))
  );
  return matched?.icon || Tag;
}

/**
 * Resolves category metadata (tags, subtitle, keywords) for a given category
 */
export function resolveCategoryMeta(categoryName: string): StorefrontCategoryMeta {
  const lower = categoryName.toLowerCase();
  const matched = CURATED_STOREFRONT_CATEGORIES.find(
    (c) =>
      c.name.toLowerCase() === lower ||
      c.id === lower ||
      c.slug === lower ||
      c.aliases?.some((a) => lower.includes(a)) ||
      c.keywords.some((k) => lower.includes(k))
  );

  if (matched) {
    return {
      ...matched,
      name: categoryName,
      slug: slugify(categoryName),
    };
  }

  return {
    id: slugify(categoryName),
    name: categoryName,
    slug: slugify(categoryName),
    subtitle: `Explore our curated ${categoryName} collection.`,
    icon: Tag,
    image: '/images/categories/category-apparel.jpg',
    tags: ['All', 'Popular', 'Featured', 'New'],
    keywords: [categoryName.toLowerCase()],
  };
}
