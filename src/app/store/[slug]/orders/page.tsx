import React from 'react';
import { notFound } from 'next/navigation';
import { getPublicStorefrontBySlug } from '@/app/actions/storefront';
import { OrderTrackingView } from './[orderId]/components/OrderTrackingView';
import type { Metadata } from 'next';

interface OrdersLookupPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    orderId?: string;
    phone?: string;
  }>;
}

export async function generateMetadata({ params }: OrdersLookupPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Track Your Order | ${slug}`,
    description: `Look up your order status and delivery updates on ${slug}.`,
  };
}

export default async function OrdersLookupPage({ params, searchParams }: OrdersLookupPageProps) {
  const { slug } = await params;
  const { orderId } = await searchParams;

  const storeData = await getPublicStorefrontBySlug(slug);
  if (!storeData) {
    notFound();
  }

  const primaryColor = storeData.config.primary_color || '#3b82f6';

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
      <OrderTrackingView config={storeData.config} orderIdOrShortId={orderId || ''} slug={slug} />
    </div>
  );
}
