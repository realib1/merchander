import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicStorefrontBySlug } from '@/app/actions/storefront';
import { StoreCategoryDetailView } from '../components/StoreCategoryDetailView';
import { slugify } from '@/utils/format';
import { CURATED_STOREFRONT_CATEGORIES, resolveCategoryMeta } from '@/utils/storefront-categories';

interface CategoryPageProps {
  params: Promise<{ slug: string; categoryId: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug, categoryId } = await params;
  const data = await getPublicStorefrontBySlug(slug);

  const matched =
    data?.categories.find((item) => item.id === categoryId || slugify(item.name) === categoryId) ||
    CURATED_STOREFRONT_CATEGORIES.find(
      (c) =>
        c.id === categoryId ||
        c.slug === categoryId ||
        c.name.toLowerCase() === categoryId.toLowerCase() ||
        c.aliases?.includes(categoryId.toLowerCase())
    );

  const categoryName =
    matched?.name || categoryId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return {
    title: `${categoryName} | ${data?.config.store_name || 'Online Store'}`,
    description: `Browse ${categoryName} products and collections from ${data?.config.store_name || 'our store'}.`,
  };
}

export default async function StorefrontCategoryPage({ params }: CategoryPageProps) {
  const { slug, categoryId } = await params;
  const data = await getPublicStorefrontBySlug(slug);
  if (!data) notFound();

  // 1. Try matching database category by id or slug
  let category = data.categories.find(
    (item) =>
      item.id === categoryId ||
      slugify(item.name) === categoryId ||
      item.name.toLowerCase() === categoryId.toLowerCase()
  );

  // 2. Fallback to curated preset category
  if (!category) {
    const preset = CURATED_STOREFRONT_CATEGORIES.find(
      (c) =>
        c.id === categoryId ||
        c.slug === categoryId ||
        c.name.toLowerCase() === categoryId.toLowerCase() ||
        c.aliases?.includes(categoryId.toLowerCase())
    );
    if (preset) {
      category = {
        id: preset.id,
        name: preset.name,
        slug: preset.slug,
        product_count: data.products.filter(
          (p) =>
            p.category_name?.toLowerCase().includes(preset.id) ||
            preset.keywords.some((k) => p.name.toLowerCase().includes(k))
        ).length,
      };
    } else {
      // Dynamic clean category object from the slug so custom paths display gracefully
      const titleName = categoryId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      category = {
        id: categoryId,
        name: titleName,
        slug: categoryId,
        product_count: 0,
      };
    }
  }

  const primaryColor = data.config.primary_color || '#3b82f6';
  const meta = resolveCategoryMeta(category.name);

  const resolvedCategory = {
    id: category.id,
    name: category.name,
    slug: category.slug || slugify(category.name),
    subtitle: meta.subtitle,
  };

  return (
    <div style={{ '--color-brand-primary': primaryColor, '--brand-primary': primaryColor } as React.CSSProperties}>
      <StoreCategoryDetailView
        config={data.config}
        categories={data.categories}
        products={data.products}
        category={resolvedCategory}
      />
    </div>
  );
}
