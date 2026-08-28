'use client';

import { useState } from 'react';
import { createOrderAction } from '@/app/actions/create-order';
import { Variant, Store, LineItem, Customer } from './create-order/types';
import { OrderItemsPicker } from './create-order/OrderItemsPicker';
import { OrderCustomerCard } from './create-order/OrderCustomerCard';
import { OrderFulfillmentCard } from './create-order/OrderFulfillmentCard';
import { OrderSummaryCard } from './create-order/OrderSummaryCard';

export type { Variant, Store, LineItem, Customer };

interface CreateOrderFormProps {
  variants: Variant[];
  stores: Store[];
  userRole: string;
  customers: Customer[];
}

export function CreateOrderForm({ variants, stores, userRole, customers }: CreateOrderFormProps) {
  const [items, setItems] = useState<LineItem[]>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [custPhone, setCustPhone] = useState('');
  const [custName, setCustName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [error, setError] = useState<string | null>(null);

  const handleAddProduct = (variantId: string) => {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;

    const existing = items.find((i) => i.variantId === variantId);
    if (existing) {
      setItems(items.map((i) => (i.variantId === variantId ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setItems([
        ...items,
        {
          id: Math.random().toString(36).substring(7),
          variantId,
          quantity: 1,
          unitPrice: variant.price,
        },
      ]);
    }
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleCustomerSelect = (c: Customer) => {
    setCustPhone(c.phone);
    setCustName(c.name);
    setDeliveryAddress(c.address || '');
  };

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    const res = await createOrderAction(formData);
    if (res?.error) {
      setError(res.error);
    }
  };

  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  return (
    <form action={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pb-12">
      {error && (
        <div className="lg:col-span-3 p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      {/* Main Content (Left Column) */}
      <div className="lg:col-span-2 space-y-6">
        <OrderItemsPicker
          variants={variants}
          items={items}
          onAddProduct={handleAddProduct}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
        />
      </div>

      {/* Sidebar Content (Right Column) */}
      <div className="lg:col-span-1 space-y-6">
        <OrderCustomerCard
          customers={customers}
          custPhone={custPhone}
          custName={custName}
          onPhoneChange={setCustPhone}
          onNameChange={setCustName}
          onCustomerSelect={handleCustomerSelect}
        />

        <OrderFulfillmentCard
          stores={stores}
          userRole={userRole}
          deliveryAddress={deliveryAddress}
          deliveryFee={deliveryFee}
          paymentMethod={paymentMethod}
          onDeliveryAddressChange={setDeliveryAddress}
          onDeliveryFeeChange={setDeliveryFee}
          onPaymentMethodChange={setPaymentMethod}
        />

        <OrderSummaryCard subtotal={subtotal} deliveryFee={deliveryFee} paymentMethod={paymentMethod} />
      </div>
    </form>
  );
}
