'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { StorefrontConfig, StorefrontTrackingOrder } from '@/types/storefront';
import { formatDate } from '@/utils/format';
import { getStorefrontOrderTracking, lookupCustomerOrder } from '@/app/actions/storefront-tracking';
import { StoreNavbar } from '@/app/store/[slug]/components/StoreNavbar';
import { StoreFooter } from '@/app/store/[slug]/components/StoreFooter';
import { TrackingTimeline } from './TrackingTimeline';
import { TrackingSummaryCards } from './TrackingSummaryCards';
import { TrackingLookupForm } from './TrackingLookupForm';
import { StorefrontPaymentCard } from './StorefrontPaymentCard';

interface OrderTrackingViewProps {
  config: StorefrontConfig;
  initialOrder?: StorefrontTrackingOrder;
  initialError?: string;
  orderIdOrShortId: string;
  slug: string;
  token?: string;
}

export function OrderTrackingView({
  config,
  initialOrder,
  initialError,
  orderIdOrShortId,
  slug,
  token,
}: OrderTrackingViewProps) {
  const [order, setOrder] = useState<StorefrontTrackingOrder | undefined>(initialOrder);
  const [error, setError] = useState<string | undefined>(initialError);
  const [phoneInput, setPhoneInput] = useState('');
  const [generalQuery, setGeneralQuery] = useState(orderIdOrShortId || '');
  const [isVerifying, setIsVerifying] = useState(false);

  const primaryColor = config.primary_color || '#3b82f6';
  const currency = config.currency || 'GHS';

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = (generalQuery || phoneInput).trim();
    if (!query) return;

    setIsVerifying(true);
    setError(undefined);

    try {
      if (orderIdOrShortId) {
        const res = await getStorefrontOrderTracking({
          tenantSlug: slug,
          orderIdOrShortId,
          token,
          phone: query,
        });

        if (res.success && res.order) {
          setOrder(res.order);
        } else {
          setError(res.error || 'Could not verify order with this phone number.');
        }
      } else {
        const res = await lookupCustomerOrder(slug, query);
        if (res.error) {
          setError(res.error);
        } else if (res.order) {
          setOrder({
            id: res.order.id,
            shortId: res.order.shortId,
            status: res.order.status as StorefrontTrackingOrder['status'],
            totalAmount: res.order.totalAmount,
            currency: res.order.currency,
            deliveryAddress: res.order.deliveryAddress,
            notes: null,
            createdAt: res.order.createdAt,
            updatedAt: res.order.createdAt,
            customerName: 'Customer',
            customerPhone: '',
            items: res.order.items.map((it, idx) => ({
              id: `item-${idx}`,
              variantId: '',
              productName: it.title,
              variantTitle: '',
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              totalPrice: it.unitPrice * it.quantity,
              imageUrl: null,
            })),
            waybill: null,
          });
        }
      }
    } catch {
      setError('Network error while looking up order.');
    } finally {
      setIsVerifying(false);
    }
  };

  const whatsappInquiryUrl = `https://wa.me/${config.whatsapp_phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Hi ${config.store_name}, I am following up on my order *#${order?.shortId || orderIdOrShortId}*. Could you please provide an update?`
  )}`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <StoreNavbar config={config} cartCount={0} onOpenCart={() => {}} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 md:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href={`/store/${slug}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-elevated border border-separator text-xs font-semibold text-muted hover:text-foreground transition group shadow-2xs cursor-pointer"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Store</span>
          </Link>
          <span className="text-xs font-bold text-muted">Order Tracking</span>
        </div>

        {!order ? (
          <TrackingLookupForm
            orderIdOrShortId={orderIdOrShortId}
            phoneInput={phoneInput}
            generalQuery={generalQuery}
            error={error}
            isVerifying={isVerifying}
            primaryColor={primaryColor}
            onPhoneChange={setPhoneInput}
            onGeneralQueryChange={setGeneralQuery}
            onSubmit={handleSearch}
          />
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-surface-elevated border border-separator shadow-xs">
              <div>
                <span className="text-[11px] font-bold text-brand-primary uppercase tracking-wider">Order Details</span>
                <h1 className="text-lg font-black text-foreground tracking-tight mt-0.5">Order #{order.shortId}</h1>
                <p className="text-xs text-muted mt-1">
                  Placed on {formatDate(order.createdAt)} • {order.items.length} item(s)
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOrder(undefined);
                    setGeneralQuery('');
                    setPhoneInput('');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-surface border border-separator text-xs font-semibold text-muted hover:text-foreground transition cursor-pointer"
                >
                  Track Another
                </button>
                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20ba59] transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            <TrackingTimeline status={order.status} batch={order.batch} primaryColor={primaryColor} />

            <StorefrontPaymentCard
              order={order}
              currency={currency}
              primaryColor={primaryColor}
              slug={slug}
              token={token}
              onOrderUpdated={(updatedOrder) => setOrder(updatedOrder)}
            />

            <TrackingSummaryCards order={order} currency={currency} primaryColor={primaryColor} />
          </div>
        )}
      </main>

      <StoreFooter config={config} />
    </div>
  );
}
