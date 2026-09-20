'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LockKeyhole, ShoppingBag } from 'lucide-react';
import { StorefrontConfig, StorefrontCartItem, StoreOrderResponse } from '@/types/storefront';
import { useStorefrontCart } from '@/hooks';
import { calculateCartTotals, formatWhatsAppOrderMessage } from '@/utils/storefront';
import { submitStorefrontOrder } from '@/app/actions/storefront-order';
import { getPublicStorefrontBranches } from '@/app/actions/branches';
import { initiateOrderOnlinePayment } from '@/app/actions/payments-online';
import { CartCheckoutForm, PickupBranchOption } from './cart/CartCheckoutForm';
import { CartItemRow } from './cart/CartItemRow';
import { CartSuccessView } from './cart/CartSuccessView';

interface StoreCheckoutViewProps {
  config: StorefrontConfig;
}

export function StoreCheckoutView({ config }: StoreCheckoutViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { cart, updateCart, clearCart } = useStorefrontCart(config.slug);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [gpsAddress, setGpsAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [fulfillmentMode, setFulfillmentMode] = useState<'delivery' | 'pickup'>('delivery');
  const [pickupBranches, setPickupBranches] = useState<PickupBranchOption[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'whatsapp' | 'mtn_momo' | 'cash_on_delivery'>('mtn_momo');
  const [orderSuccess, setOrderSuccess] = useState<StoreOrderResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getPublicStorefrontBranches(config.slug).then((branches) => {
      setPickupBranches(branches);
      setSelectedBranchId(branches[0]?.id || '');
    });
  }, [config.slug]);

  const { subtotal, itemCount } = calculateCartTotals(cart);
  const currency = config.currency || 'GHS';
  const primaryColor = config.primary_color || '#3b82f6';
  const batchNames = Array.from(new Set(cart.map((item) => item.batchName).filter(Boolean))) as string[];
  const primaryBatchId = cart.find((item) => item.batchId)?.batchId || null;
  const selectedBranch = pickupBranches.find((branch) => branch.id === selectedBranchId) || pickupBranches[0];
  const finalAddress =
    fulfillmentMode === 'pickup' && selectedBranch
      ? `Pickup: ${selectedBranch.name} (${selectedBranch.street_address || selectedBranch.city || 'Store Desk'})`
      : [deliveryAddress.trim(), gpsAddress.trim() ? `[GPS: ${gpsAddress.trim().toUpperCase()}]` : '']
          .filter(Boolean)
          .join(' ') || 'Doorstep Delivery';

  const updateQuantity = (variantId: string, delta: number) => {
    updateCart((current) =>
      current
        .map((item) => (item.variantId === variantId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (variantId: string) => updateCart((current) => current.filter((item) => item.variantId !== variantId));

  const checkoutOnWhatsApp = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Please enter your name and phone number to continue.');
      return;
    }
    const phone = config.whatsapp_phone?.replace(/[^0-9]/g, '');
    if (!phone) {
      setErrorMessage('Merchant WhatsApp contact is not available right now.');
      return;
    }
    const message = formatWhatsAppOrderMessage(config, cart, {
      name: customerName,
      phone: customerPhone,
      address: finalAddress,
      notes: deliveryNotes,
      fulfillmentMode,
    });
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const placeOrder = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    startTransition(async () => {
      const response = await submitStorefrontOrder({
        tenantSlug: config.slug,
        customerName,
        customerPhone,
        deliveryAddress: finalAddress,
        deliveryNotes,
        fulfillmentMode,
        pickupStoreId: fulfillmentMode === 'pickup' ? selectedBranch?.id : undefined,
        paymentMethod,
        batchId: primaryBatchId,
        items: cart.map((item) => ({ variantId: item.variantId, batchId: item.batchId || null, quantity: item.quantity })),
      });

      if (!response.success || response.error) {
        setErrorMessage(response.error || 'Failed to place order.');
        return;
      }

      if (paymentMethod === 'mtn_momo' && response.orderId) {
        const payment = await initiateOrderOnlinePayment({ orderId: response.orderId, customerPhone });
        if (payment.authorizationUrl) {
          window.location.href = payment.authorizationUrl;
          return;
        }
      }

      setOrderSuccess(response);
      clearCart();
    });
  };

  if (orderSuccess) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-12 sm:px-6">
        <CartSuccessView
          customerPhone={customerPhone}
          orderId={orderSuccess.orderId}
          orderShortId={orderSuccess.orderShortId}
          trackingUrl={orderSuccess.trackingUrl}
          slug={config.slug}
          primaryColor={primaryColor}
          onReset={() => router.push(`/store/${config.slug}`)}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push(`/store/${config.slug}`)}
          className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-muted transition hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Continue shopping
        </button>
        <div className="flex items-center gap-2 text-xs text-muted">
          <LockKeyhole size={14} className="text-brand-primary" /> Secure checkout
        </div>
      </div>

      <div className="mb-8 flex items-end justify-between border-b border-separator/70 pb-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-primary">Your order</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Checkout</h1>
        </div>
        <span className="text-xs text-muted">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
      </div>

      {cart.length === 0 ? (
        <div className="mx-auto max-w-md py-20 text-center">
          <ShoppingBag size={42} className="mx-auto text-muted/50" />
          <h2 className="mt-4 text-lg font-bold">Your bag is empty</h2>
          <p className="mt-2 text-sm text-muted">Add something from the collection before checking out.</p>
          <button
            type="button"
            onClick={() => router.push(`/store/${config.slug}`)}
            className="mt-6 rounded-full px-5 py-3 text-xs font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Browse products
          </button>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
          <section className="space-y-4">
            <div className="rounded-2xl border border-separator bg-surface p-4 shadow-2xs sm:p-7">
              {errorMessage && <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">{errorMessage}</p>}
              <CartCheckoutForm
                customerName={customerName}
                customerPhone={customerPhone}
                deliveryAddress={deliveryAddress}
                gpsAddress={gpsAddress}
                deliveryNotes={deliveryNotes}
                fulfillmentMode={fulfillmentMode}
                pickupBranches={pickupBranches}
                selectedBranchId={selectedBranchId}
                paymentMethod={paymentMethod}
                subtotal={subtotal}
                currency={currency}
                primaryColor={primaryColor}
                batchNames={batchNames}
                isPending={isPending}
                onCustomerNameChange={setCustomerName}
                onCustomerPhoneChange={setCustomerPhone}
                onDeliveryAddressChange={setDeliveryAddress}
                onGpsAddressChange={setGpsAddress}
                onDeliveryNotesChange={setDeliveryNotes}
                onFulfillmentModeChange={setFulfillmentMode}
                onSelectedBranchChange={setSelectedBranchId}
                onPaymentMethodChange={setPaymentMethod}
                onWhatsAppCheckout={checkoutOnWhatsApp}
                onDirectCheckout={placeOrder}
              />
            </div>
          </section>

          <aside className="rounded-md border border-separator bg-surface p-5 shadow-xs sm:p-6 lg:sticky lg:top-24">
            <div className="flex items-center justify-between border-b border-separator/70 pb-4">
              <h2 className="text-sm font-black">Order summary</h2>
              <span className="text-xs text-muted">{itemCount} items</span>
            </div>
            <div className="divide-y divide-separator/60">
              {cart.map((item: StorefrontCartItem) => (
                <CartItemRow
                  key={item.variantId}
                  item={item}
                  currency={currency}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeItem}
                />
              ))}
            </div>
            <div className="mt-5 space-y-2 border-t border-separator/70 pt-4 text-xs">
              <div className="flex justify-between text-muted"><span>Subtotal</span><span>{currency} {subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-muted"><span>Delivery</span><span>Calculated at checkout</span></div>
              <div className="flex justify-between border-t border-separator/60 pt-3 text-sm font-black"><span>Total</span><span style={{ color: primaryColor }}>{currency} {subtotal.toFixed(2)}</span></div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
