import React from 'react';

export interface PickupBranchOption {
  id: string;
  name: string;
  street_address?: string | null;
  city?: string | null;
  landmark?: string | null;
  digital_address?: string | null;
  phone?: string | null;
}

export interface CartCheckoutFormProps {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  gpsAddress: string;
  deliveryNotes: string;
  fulfillmentMode: 'delivery' | 'pickup';
  pickupBranches: PickupBranchOption[];
  selectedBranchId: string;
  paymentMethod: 'whatsapp' | 'mtn_momo' | 'cash_on_delivery';
  subtotal: number;
  currency: string;
  primaryColor?: string;
  batchNames?: string[];
  isPending: boolean;
  onCustomerNameChange: (val: string) => void;
  onCustomerPhoneChange: (val: string) => void;
  onDeliveryAddressChange: (val: string) => void;
  onGpsAddressChange: (val: string) => void;
  onDeliveryNotesChange: (val: string) => void;
  onFulfillmentModeChange: (mode: 'delivery' | 'pickup') => void;
  onSelectedBranchChange: (branchId: string) => void;
  onPaymentMethodChange: (val: 'whatsapp' | 'mtn_momo' | 'cash_on_delivery') => void;
  onWhatsAppCheckout: () => void;
  onDirectCheckout: (e: React.FormEvent) => void;
}
