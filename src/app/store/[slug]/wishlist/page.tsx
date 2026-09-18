import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicStorefrontBySlug } from '@/app/actions/storefront';
import { StoreWishlistView } from '../components/StoreWishlistView';

interface WishlistPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: WishlistPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicStorefrontBySlug(slug);
  return { title: `Wishlist | ${data?.config.store_name || slug}` };
}

export default async function StorefrontWishlistPage({ params }: WishlistPageProps) {
  const { slug } = await params;
  const data = await getPublicStorefrontBySlug(slug);
  if (!data) notFound();

  const primaryColor = data.config.primary_color || '#3b82f6';
  return (
    <div style={{ '--color-brand-primary': primaryColor, '--brand-primary': primaryColor } as React.CSSProperties}>
      <StoreWishlistView config={data.config} products={data.products} />
    </div>
  );
}
