'use client';

import React, { useState } from 'react';
import { CheckCircle2, CreditCard, Smartphone, Loader2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { StorefrontTrackingOrder } from '@/types/storefront';
import { formatCurrency } from '@/utils/format';
import { initiateOrderOnlinePayment } from '@/app/actions/payments-online';
import { getStorefrontOrderTracking } from '@/app/actions/storefront-tracking';

interface StorefrontPaymentCardProps {
  order: StorefrontTrackingOrder;
  currency: string;
  primaryColor: string;
  slug: string;
  token?: string;
  onOrderUpdated?: (order: StorefrontTrackingOrder) => void;
}

export function StorefrontPaymentCard({
  order,
  currency,
  primaryColor,
  slug,
  token,
  onOrderUpdated,
}: StorefrontPaymentCardProps) {
  const [providerTab, setProviderTab] = useState<'momo' | 'card'>('momo');
  const [phone, setPhone] = useState(order.customerPhone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptMessage, setPromptMessage] = useState<string | null>(null);

  const isPaid =
    order.status === 'paid' ||
    order.status === 'processing' ||
    order.status === 'dispatched' ||
    order.status === 'delivered';

  // 1. Render Paid / Confirmed State
  if (isPaid) {
    return (
      <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Payment Confirmed
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                Verified
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {formatCurrency(order.totalAmount, currency)} paid in full
            </p>
            <p className="text-xs text-muted mt-0.5">
              Thank you! Your order is secured and being prepared for fulfillment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unpaid / Pending Payment Flow
  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPromptMessage(null);
    setIsSubmitting(true);

    try {
      if (providerTab === 'momo') {
        const cleanPhone = phone.trim();
        if (!cleanPhone) {
          setError('Please enter your Mobile Money phone number.');
          setIsSubmitting(false);
          return;
        }

        const res = await initiateOrderOnlinePayment({
          orderId: order.id,
          provider: 'hubtel',
          customerPhone: cleanPhone,
        });

        if (res.error) {
          setError(res.error);
        } else if (res.success) {
          setPromptMessage(
            res.message ||
              'USSD prompt sent to your phone! Please check your mobile handset and enter your MoMo PIN to authorize payment.'
          );
        }
      } else {
        // Paystack Card / Online Checkout
        const res = await initiateOrderOnlinePayment({
          orderId: order.id,
          provider: 'paystack',
          customerPhone: phone || undefined,
          callbackUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        });

        if (res.error) {
          setError(res.error);
        } else if (res.authorizationUrl) {
          window.location.href = res.authorizationUrl;
        }
      }
    } catch {
      setError('Network error initializing payment gateway. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshStatus = async () => {
    setIsChecking(true);
    setError(null);
    try {
      const res = await getStorefrontOrderTracking({
        tenantSlug: slug,
        orderIdOrShortId: order.shortId || order.id,
        token,
        phone: phone || order.customerPhone,
      });

      if (res.success && res.order) {
        onOrderUpdated?.(res.order);
        if (
          res.order.status === 'paid' ||
          res.order.status === 'processing' ||
          res.order.status === 'dispatched'
        ) {
          setPromptMessage(null);
        }
      } else {
        setError(res.error || 'Could not refresh order status yet.');
      }
    } catch {
      setError('Network error refreshing order status.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-surface-elevated border border-separator shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-separator/60">
        <div>
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Payment Pending</span>
          <h2 className="text-base font-black text-foreground mt-0.5">Complete Your Order Payment</h2>
          <p className="text-xs text-muted mt-0.5">
            Pay safely using Ghanaian Mobile Money (MTN MoMo, Telecel Cash) or Debit/Credit Card.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-xs text-muted block">Amount Due</span>
          <span className="text-lg font-black" style={{ color: primaryColor }}>
            {formatCurrency(order.totalAmount, currency)}
          </span>
        </div>
      </div>

      {/* Payment Provider Selector */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-surface rounded-2xl border border-separator/60">
        <button
          type="button"
          onClick={() => {
            setProviderTab('momo');
            setError(null);
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            providerTab === 'momo'
              ? 'bg-surface-elevated text-foreground shadow-2xs border border-separator'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <Smartphone size={15} />
          <span>Mobile Money Prompt</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setProviderTab('card');
            setError(null);
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            providerTab === 'card'
              ? 'bg-surface-elevated text-foreground shadow-2xs border border-separator'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <CreditCard size={15} />
          <span>Card / Paystack</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {promptMessage ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
          <div className="flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300 font-medium">
            <Smartphone size={18} className="shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p className="font-bold text-foreground">USSD Prompt Dispatched!</p>
              <p className="mt-1 leading-relaxed">{promptMessage}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-amber-500/20">
            <button
              type="button"
              onClick={handleRefreshStatus}
              disabled={isChecking}
              className="px-4 py-2 rounded-xl text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {isChecking ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span>I Have Approved Payment</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleInitiatePayment} className="space-y-4">
          {providerTab === 'momo' ? (
            <div className="space-y-2">
              <label htmlFor="momoPhone" className="text-xs font-bold text-foreground block">
                Mobile Money Phone Number (MTN, Telecel, AT)
              </label>
              <div className="relative">
                <input
                  id="momoPhone"
                  type="tel"
                  required
                  placeholder="e.g. 024 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-surface border border-separator text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-brand-primary/30 transition placeholder:text-muted/60 font-mono"
                />
              </div>
              <p className="text-[11px] text-muted">
                A prompt will pop up on this phone requesting your Mobile Money PIN.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-surface border border-separator space-y-2 text-xs text-muted">
              <p className="font-semibold text-foreground">Paystack Secure Hosted Checkout</p>
              <p>
                You will be securely redirected to Paystack to complete payment with your Visa, Mastercard, or
                Mobile Money wallet.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-2xl text-white text-sm font-black transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Connecting to Payment Gateway...</span>
              </>
            ) : providerTab === 'momo' ? (
              <>
                <Smartphone size={16} />
                <span>Send MoMo Prompt ({formatCurrency(order.totalAmount, currency)})</span>
              </>
            ) : (
              <>
                <ExternalLink size={16} />
                <span>Proceed to Paystack Checkout ({formatCurrency(order.totalAmount, currency)})</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
