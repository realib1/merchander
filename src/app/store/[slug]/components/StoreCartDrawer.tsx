'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { StorefrontCartItem, StorefrontConfig, StoreOrderResponse } from '@/types/storefront';
import { calculateCartTotals, formatWhatsAppOrderMessage } from '@/utils/storefront';
import { submitStorefrontOrder } from '@/app/actions/storefront-order';
import { getPublicStorefrontBranches } from '@/app/actions/branches';
import { initiateOrderOnlinePayment } from '@/app/actions/payments-online';
import { X, ShoppingBag, AlertCircle } from 'lucide-react';
import { useFocusTrap } from '@/hooks';
import { CartItemRow } from './cart/CartItemRow';
import { CartCheckoutForm, PickupBranchOption } from './cart/CartCheckoutForm';
import { CartSuccessView } from './cart/CartSuccessView';

interface StoreCartDrawerProps {
  isOpen: boolean;
  config: StorefrontConfig;
  cart: StorefrontCartItem[];
  onClose: () => void;
  onUpdateQuantity: (variantId: string, delta: number) => void;
  onRemoveItem: (variantId: string) => void;
  onClearCart: () => void;
}

export function StoreCartDrawer({
  isOpen,
  config,
  cart,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: StoreCartDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [gpsAddress, setGpsAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [fulfillmentMode, setFulfillmentMode] = useState<'delivery' | 'pickup'>('delivery');
  const [pickupBranches, setPickupBranches] = useState<PickupBranchOption[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'whatsapp' | 'mtn_momo' | 'cash_on_delivery'>('mtn_momo');
  const [orderSuccess, setOrderSuccess] = useState<StoreOrderResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const containerRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (config?.slug) {
      getPublicStorefrontBranches(config.slug).then((branches) => {
        setPickupBranches(branches);
        if (branches.length > 0) {
          setSelectedBranchId(branches[0].id);
        }
      });
    }
  }, [config?.slug]);

  if (!isOpen) return null;

  const { subtotal, itemCount } = calculateCartTotals(cart);
  const currency = config.currency || 'GHS';
  const primaryColor = config.primary_color || '#3b82f6';
  const batchNames = Array.from(new Set(cart.map((i) => i.batchName).filter(Boolean))) as string[];
  const primaryBatchId = cart.find((i) => i.batchId)?.batchId || null;

  const selectedBranch = pickupBranches.find((b) => b.id === selectedBranchId) || pickupBranches[0];
  const formattedDeliveryAddress = [
    deliveryAddress.trim(),
    gpsAddress.trim() ? `[GPS: ${gpsAddress.trim().toUpperCase()}]` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const finalAddress =
    fulfillmentMode === 'pickup' && selectedBranch
      ? `Pickup: ${selectedBranch.name} (${selectedBranch.street_address || selectedBranch.city || 'Store Desk'})`
      : formattedDeliveryAddress || 'Doorstep Delivery';

  const handleWhatsAppCheckout = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Please enter your name and phone number to continue');
      return;
    }

    const message = formatWhatsAppOrderMessage(config, cart, {
      name: customerName,
      phone: customerPhone,
      address: finalAddress,
      notes: deliveryNotes,
      fulfillmentMode,
    });

    const whatsappNumber = config.whatsapp_phone?.replace(/[^0-9]/g, '');
    if (!whatsappNumber) {
      setErrorMsg('Merchant WhatsApp contact is not available right now.');
      return;
    }

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDirectCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Please provide your name and mobile money / contact phone');
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await submitStorefrontOrder({
        tenantSlug: config.slug,
        customerName,
        customerPhone,
        deliveryAddress: finalAddress,
        deliveryNotes,
        fulfillmentMode,
        pickupStoreId: fulfillmentMode === 'pickup' ? selectedBranch?.id : undefined,
        paymentMethod,
        batchId: primaryBatchId,
        items: cart.map((i) => ({
          variantId: i.variantId,
          batchId: i.batchId || null,
          quantity: i.quantity,
        })),
      });

      if (!res.success || res.error) {
        setErrorMsg(res.error || 'Failed to place order.');
        return;
      }

      if (paymentMethod === 'mtn_momo' && res.orderId) {
        try {
          const payRes = await initiateOrderOnlinePayment({
            orderId: res.orderId,
            customerPhone,
          });

          if (payRes.authorizationUrl) {
            window.location.href = payRes.authorizationUrl;
            return;
          }
        } catch (err) {
          console.warn('Online payment trigger notification:', err);
        }
      }

      setOrderSuccess(res);
      onClearCart();
    });
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart"
    >
      <div className="w-full max-w-md bg-surface border-l border-separator h-full flex flex-col shadow-2xl animate-slideLeft">
        {/* Header */}
        <div className="p-4 border-b border-separator flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} style={{ color: primaryColor }} />
            <h2 className="text-sm font-bold text-foreground">Shopping Bag ({itemCount})</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated cursor-pointer transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar pb-16 sm:pb-6">
          {orderSuccess ? (
            <CartSuccessView
              customerPhone={customerPhone}
              orderId={orderSuccess.orderId}
              orderShortId={orderSuccess.orderShortId}
              trackingUrl={orderSuccess.trackingUrl}
              slug={config.slug}
              primaryColor={primaryColor}
              onReset={() => {
                setOrderSuccess(null);
                onClose();
              }}
            />
          ) : cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-elevated flex items-center justify-center text-muted">
                <ShoppingBag size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Your bag is empty</p>
                <p className="text-xs text-muted mt-1">Browse our catalog to add items.</p>
              </div>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Items List */}
              <div className="divide-y divide-separator/60">
                {cart.map((item) => (
                  <CartItemRow
                    key={item.variantId}
                    item={item}
                    currency={currency}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemoveItem={onRemoveItem}
                  />
                ))}
              </div>

              {/* Checkout Form */}
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
                onWhatsAppCheckout={handleWhatsAppCheckout}
                onDirectCheckout={handleDirectCheckout}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
