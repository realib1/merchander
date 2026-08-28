import React from 'react';
import { notFound } from 'next/navigation';
import { getPublicStorefrontBySlug } from '@/app/actions/storefront';
import { StoreHeader } from './components/StoreHeader';
import { StoreCatalog } from './components/StoreCatalog';
import { ShoppingBag, ShieldCheck } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-brand-primary/20">
      <main className="flex-1 pb-24">
        {/* Store Header */}
        <StoreHeader config={data.config} />

        {/* Store Catalog & Cart */}
        <StoreCatalog config={data.config} categories={data.categories} products={data.products} />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-separator/60 py-6 text-center text-xs text-muted bg-surface/50">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">{data.config.store_name}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[11px]">
              <ShieldCheck size={13} className="text-brand-primary" /> Verified Merchant
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span>Powered by</span>
            <span className="font-bold text-foreground flex items-center gap-1">
              <ShoppingBag size={13} className="text-brand-primary" /> Merchander
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
