import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicStorefrontBySlug } from '@/app/actions/storefront';
import { StoreCheckoutView } from '../components/StoreCheckoutView';

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicStorefrontBySlug(slug);
  return { title: `Checkout | ${data?.config.store_name || slug}` };
}

export default async function StorefrontCheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const data = await getPublicStorefrontBySlug(slug);
  if (!data) notFound();

  const primaryColor = data.config.primary_color || '#3b82f6';
  return (
    <div
      style={{ '--color-brand-primary': primaryColor, '--brand-primary': primaryColor } as React.CSSProperties}
    >
      <StoreCheckoutView config={data.config} />
    </div>
  );
}
