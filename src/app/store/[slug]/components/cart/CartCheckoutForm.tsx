'use client';

import React, { useState } from 'react';
import { CheckoutStepIndicator } from './CheckoutStepIndicator';
import { CheckoutContactStep } from './CheckoutContactStep';
import { CheckoutFulfillmentStep } from './CheckoutFulfillmentStep';
import { CheckoutPaymentStep } from './CheckoutPaymentStep';
import type { PickupBranchOption, CartCheckoutFormProps } from './checkout-types';

export type { PickupBranchOption, CartCheckoutFormProps };

const WIZARD_STEPS = [
  { num: 1 as const, label: 'Contact' },
  { num: 2 as const, label: 'Delivery' },
  { num: 3 as const, label: 'Payment' },
];

export function CartCheckoutForm(props: CartCheckoutFormProps) {
  const {
    customerName,
    customerPhone,
    deliveryAddress,
    gpsAddress,
    deliveryNotes,
    fulfillmentMode,
    pickupBranches = [],
    selectedBranchId,
    paymentMethod,
    subtotal,
    currency,
    primaryColor = '#3b82f6',
    batchNames = [],
    isPending,
    onCustomerNameChange,
    onCustomerPhoneChange,
    onDeliveryAddressChange,
    onGpsAddressChange,
    onDeliveryNotesChange,
    onFulfillmentModeChange,
    onSelectedBranchChange,
    onPaymentMethodChange,
    onWhatsAppCheckout,
    onDirectCheckout,
  } = props;

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [stepError, setStepError] = useState<string | null>(null);

  const hasBranches = pickupBranches.length > 0;

  const handleProceedToDelivery = () => {
    setStepError(null);
    if (!customerName.trim()) {
      setStepError('Please enter your full name.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 9) {
      setStepError('Please enter a valid WhatsApp or contact phone number.');
      return;
    }
    setActiveStep(2);
  };

  const handleProceedToPayment = () => {
    setStepError(null);
    if (fulfillmentMode === 'delivery' && !deliveryAddress.trim()) {
      setStepError('Please provide your delivery address or nearest landmark.');
      return;
    }
    if (fulfillmentMode === 'pickup' && hasBranches && !selectedBranchId) {
      setStepError('Please select a store pickup branch.');
      return;
    }
    setActiveStep(3);
  };

  return (
    <form onSubmit={onDirectCheckout} className="space-y-6 pt-2">
      <CheckoutStepIndicator
        steps={WIZARD_STEPS}
        activeStep={activeStep}
        primaryColor={primaryColor}
        onSelectStep={setActiveStep}
      />

      {stepError && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold animate-scaleUp">
          {stepError}
        </div>
      )}

      {activeStep === 1 && (
        <CheckoutContactStep
          customerName={customerName}
          customerPhone={customerPhone}
          primaryColor={primaryColor}
          onCustomerNameChange={onCustomerNameChange}
          onCustomerPhoneChange={onCustomerPhoneChange}
          onProceed={handleProceedToDelivery}
        />
      )}

      {activeStep === 2 && (
        <CheckoutFulfillmentStep
          fulfillmentMode={fulfillmentMode}
          hasBranches={hasBranches}
          pickupBranches={pickupBranches}
          selectedBranchId={selectedBranchId}
          deliveryAddress={deliveryAddress}
          gpsAddress={gpsAddress}
          deliveryNotes={deliveryNotes}
          primaryColor={primaryColor}
          onFulfillmentModeChange={onFulfillmentModeChange}
          onSelectedBranchChange={onSelectedBranchChange}
          onDeliveryAddressChange={onDeliveryAddressChange}
          onGpsAddressChange={onGpsAddressChange}
          onDeliveryNotesChange={onDeliveryNotesChange}
          onBack={() => setActiveStep(1)}
          onProceed={handleProceedToPayment}
        />
      )}

      {activeStep === 3 && (
        <CheckoutPaymentStep
          paymentMethod={paymentMethod}
          fulfillmentMode={fulfillmentMode}
          subtotal={subtotal}
          currency={currency}
          primaryColor={primaryColor}
          batchNames={batchNames}
          isPending={isPending}
          onPaymentMethodChange={onPaymentMethodChange}
          onWhatsAppCheckout={onWhatsAppCheckout}
          onBack={() => setActiveStep(2)}
        />
      )}
    </form>
  );
}
