import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicStorefrontBySlug } from '@/app/actions/storefront';
import { StoreDiscoveryView } from '../../components/StoreDiscoveryView';
import { slugify } from '@/utils/format';

interface CategoryPageProps {
  params: Promise<{ slug: string; categoryId: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug, categoryId } = await params;
  const data = await getPublicStorefrontBySlug(slug);
  const category = data?.categories.find((item) => item.id === categoryId || slugify(item.name) === categoryId);
  return { title: `${category?.name || 'Category'} | ${data?.config.store_name || 'Online Store'}` };
}

export default async function StorefrontCategoryPage({ params }: CategoryPageProps) {
  const { slug, categoryId } = await params;
  const data = await getPublicStorefrontBySlug(slug);
  if (!data) notFound();

  const category = data.categories.find((item) => item.id === categoryId || slugify(item.name) === categoryId);
  if (!category) notFound();

  const primaryColor = data.config.primary_color || '#3b82f6';
  return (
    <div style={{ '--color-brand-primary': primaryColor, '--brand-primary': primaryColor } as React.CSSProperties}>
      <StoreDiscoveryView
        config={data.config}
        categories={data.categories}
        products={data.products}
        initialCategoryId={category.id}
        title={category.name}
        eyebrow="Category"
      />
    </div>
  );
}
