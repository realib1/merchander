'use client';

import React, { useState, useTransition } from 'react';
import { StorefrontCartItem, StorefrontConfig } from '@/types/storefront';
import { calculateCartTotals, formatWhatsAppOrderMessage, createWhatsAppOrderLink } from '@/utils/storefront';
import { submitPublicStoreOrder } from '@/app/actions/storefront';
import { X, ShoppingBag, AlertCircle } from 'lucide-react';
import { CartItemRow } from './cart/CartItemRow';
import { CartCheckoutForm } from './cart/CartCheckoutForm';
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
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'whatsapp' | 'mtn_momo' | 'cash_on_delivery'>('whatsapp');
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const { subtotal, itemCount } = calculateCartTotals(cart);
  const currency = config.currency || 'GHS';

  const handleWhatsAppCheckout = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Please enter your name and phone number to continue');
      return;
    }

    const message = formatWhatsAppOrderMessage(config, cart, {
      name: customerName,
      phone: customerPhone,
      address: deliveryAddress,
      notes: deliveryNotes,
    });

    const targetPhone = config.whatsapp_phone || '+233241234567';
    const waLink = createWhatsAppOrderLink(targetPhone, message);

    startTransition(async () => {
      await submitPublicStoreOrder({
        tenantId: config.tenant_id,
        customerName,
        customerPhone,
        deliveryAddress: deliveryAddress || 'Order via WhatsApp Chat',
        deliveryNotes,
        paymentMethod: 'whatsapp',
        items: cart.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
      });
      onClearCart();
      window.open(waLink, '_blank');
      onClose();
    });
  };

  const handleDirectCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Please provide your name and mobile money / contact phone');
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await submitPublicStoreOrder({
        tenantId: config.tenant_id,
        customerName,
        customerPhone,
        deliveryAddress: deliveryAddress || 'Pending Confirmation',
        deliveryNotes,
        paymentMethod,
        items: cart.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setOrderSuccess(res.orderId || 'SUCCESS');
        onClearCart();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-surface border-l border-separator h-full flex flex-col shadow-2xl animate-slideLeft">
        {/* Header */}
        <div className="p-4 border-b border-separator flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-brand-primary" />
            <h2 className="text-sm font-bold text-foreground">
              Your Bag ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-surface-elevated text-muted hover:text-foreground flex items-center justify-center cursor-pointer transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {orderSuccess ? (
            <CartSuccessView
              customerPhone={customerPhone}
              onReset={() => {
                setOrderSuccess(null);
                onClose();
              }}
            />
          ) : cart.length === 0 ? (
            <div className="p-12 text-center text-muted space-y-2">
              <ShoppingBag size={36} className="mx-auto opacity-30" />
              <p className="text-xs font-medium">Your bag is empty</p>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2.5">
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

              <CartCheckoutForm
                customerName={customerName}
                customerPhone={customerPhone}
                deliveryAddress={deliveryAddress}
                deliveryNotes={deliveryNotes}
                paymentMethod={paymentMethod}
                subtotal={subtotal}
                currency={currency}
                isPending={isPending}
                onCustomerNameChange={setCustomerName}
                onCustomerPhoneChange={setCustomerPhone}
                onDeliveryAddressChange={setDeliveryAddress}
                onDeliveryNotesChange={setDeliveryNotes}
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
