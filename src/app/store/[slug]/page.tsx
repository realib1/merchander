import React from 'react';
import { notFound } from 'next/navigation';
import { getPublicStorefrontBySlug } from '@/app/actions/storefront';
import { StoreCatalog } from './components/StoreCatalog';
import type { Metadata } from 'next';

interface StorePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicStorefrontBySlug(slug);

  if (!data) {
    return {
      title: 'Store Not Found | Merchander',
    };
  }

  return {
    title: `${data.config.store_name} | Online Store`,
    description: data.config.tagline || data.config.bio || `Browse products and order from ${data.config.store_name}.`,
    openGraph: {
      title: data.config.store_name,
      description: data.config.tagline || `Browse products from ${data.config.store_name}.`,
      images: data.config.banner_url ? [data.config.banner_url] : [],
    },
  };
}

export default async function PublicStorefrontPage({ params }: StorePageProps) {
  const { slug } = await params;
  const data = await getPublicStorefrontBySlug(slug);

  if (!data) {
    notFound();
  }

  const primaryColor = data.config.primary_color || '#3b82f6';

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={
        {
          '--color-brand-primary': primaryColor,
          '--brand-primary': primaryColor,
        } as React.CSSProperties
      }
    >
      <StoreCatalog
        config={data.config}
        categories={data.categories}
        products={data.products}
        activeBatches={data.activeBatches}
      />
    </div>
  );
}
