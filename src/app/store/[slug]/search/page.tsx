import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicStorefrontBySlug } from '@/app/actions/storefront';
import { StoreDiscoveryView } from '../components/StoreDiscoveryView';

interface SearchPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ params, searchParams }: SearchPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { q } = await searchParams;
  const data = await getPublicStorefrontBySlug(slug);
  return {
    title: `${q ? `Search: ${q}` : 'Search Products'} | ${data?.config.store_name || 'Online Store'}`,
  };
}

export default async function StorefrontSearchPage({ params, searchParams }: SearchPageProps) {
  const { slug } = await params;
  const { q = '' } = await searchParams;
  const data = await getPublicStorefrontBySlug(slug);
  if (!data) notFound();

  const primaryColor = data.config.primary_color || '#3b82f6';
  return (
    <div style={{ '--color-brand-primary': primaryColor, '--brand-primary': primaryColor } as React.CSSProperties}>
      <StoreDiscoveryView
        config={data.config}
        categories={data.categories}
        products={data.products}
        initialSearchQuery={q}
        title={q ? `Results for "${q}"` : 'Search products'}
        eyebrow="Find your next favorite"
      />
    </div>
  );
}
