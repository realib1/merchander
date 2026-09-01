import React from 'react';
import { notFound } from 'next/navigation';
import { getPublicStorefrontBySlug } from '@/app/actions/storefront';
import { getStorefrontOrderTracking } from '@/app/actions/storefront-tracking';
import { OrderTrackingView } from './components/OrderTrackingView';
import type { Metadata } from 'next';

interface OrderPageProps {
  params: Promise<{
    slug: string;
    orderId: string;
  }>;
  searchParams: Promise<{
    token?: string;
    phone?: string;
  }>;
}

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { slug, orderId } = await params;
  return {
    title: `Track Order #${orderId.slice(0, 8)} | ${slug}`,
    description: `Real-time order and delivery tracking for ${slug} on Merchander.`,
  };
}

export default async function StorefrontOrderPage({ params, searchParams }: OrderPageProps) {
  const { slug, orderId } = await params;
  const { token, phone } = await searchParams;

  const storeData = await getPublicStorefrontBySlug(slug);
  if (!storeData) {
    notFound();
  }

  let initialOrder = undefined;
  let initialError = undefined;

  if (token || phone) {
    const trackingRes = await getStorefrontOrderTracking({
      tenantSlug: slug,
      orderIdOrShortId: orderId,
      token,
      phone,
    });

    if (trackingRes.success && trackingRes.order) {
      initialOrder = trackingRes.order;
    } else {
      initialError = trackingRes.error;
    }
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
      <OrderTrackingView
        config={storeData.config}
        initialOrder={initialOrder}
        initialError={initialError}
        orderIdOrShortId={orderId}
        slug={slug}
        token={token}
      />
    </div>
  );
}
