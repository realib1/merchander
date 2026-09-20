import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicStorefrontBySlug } from '@/app/actions/storefront';
import { StoreCategoriesHubView } from './components/StoreCategoriesHubView';

interface CategoriesPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoriesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicStorefrontBySlug(slug);

  if (!data) {
    return { title: 'Categories | Online Store' };
  }

  return {
    title: `Categories | ${data.config.store_name}`,
    description: `Browse all categories and collections from ${data.config.store_name}.`,
  };
}

export default async function StorefrontCategoriesPage({ params }: CategoriesPageProps) {
  const { slug } = await params;
  const data = await getPublicStorefrontBySlug(slug);

  if (!data) {
    notFound();
  }

  const primaryColor = data.config.primary_color || '#3b82f6';

  return (
    <div
      style={
        {
          '--color-brand-primary': primaryColor,
          '--brand-primary': primaryColor,
        } as React.CSSProperties
      }
    >
      <StoreCategoriesHubView
        config={data.config}
        categories={data.categories}
        products={data.products}
      />
    </div>
  );
}
