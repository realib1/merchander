'use client';

import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { MapPin } from 'lucide-react';
import { Store } from './types';

interface OrderFulfillmentCardProps {
  stores: Store[];
  userRole: string;
  deliveryAddress: string;
  deliveryFee: number;
  paymentMethod: string;
  onDeliveryAddressChange: (address: string) => void;
  onDeliveryFeeChange: (fee: number) => void;
  onPaymentMethodChange: (method: string) => void;
}

export function OrderFulfillmentCard({
  stores,
  userRole,
  deliveryAddress,
  deliveryFee,
  paymentMethod,
  onDeliveryAddressChange,
  onDeliveryFeeChange,
  onPaymentMethodChange,
}: OrderFulfillmentCardProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Delivery Info</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <FormField
            name="deliveryAddress"
            label="Delivery Address"
            placeholder="e.g. Jisonayili, Near Central Mosque"
            isTextarea
            rows={2}
            value={deliveryAddress}
            onChange={(e) => onDeliveryAddressChange(e.target.value)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fulfillment</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Fulfillment Branch</label>
            {userRole === 'admin' || userRole === 'owner' ? (
              <select
                name="storeId"
                className="w-full rounded-xl border border-separator bg-surface text-sm px-4 py-2.5 focus:ring-brand-primary outline-none transition-shadow"
                required
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input type="hidden" name="storeId" value={stores[0]?.id || ''} />
                <div className="w-full rounded-xl border border-separator bg-surface-elevated/50 text-sm px-4 py-2.5 cursor-not-allowed">
                  {stores[0]?.name || 'No Branch Available'}
                </div>
              </>
            )}
          </div>
          <FormField
            name="deliveryFee"
            label="Delivery Fee (GHS)"
            type="number"
            min="0"
            step="0.01"
            value={deliveryFee.toString()}
            onChange={(e) => onDeliveryFeeChange(parseFloat(e.target.value) || 0)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardBody>
          <select
            name="paymentMethod"
            className="w-full rounded-xl border border-separator bg-surface text-sm px-4 py-2.5 focus:ring-brand-primary outline-none transition-shadow"
            required
            value={paymentMethod}
            onChange={(e) => onPaymentMethodChange(e.target.value)}
          >
            <option value="momo">Mobile Money (MoMo)</option>
            <option value="card_payment">Card Payment</option>
            <option value="cash_payment">Cash Payment</option>
            <option value="cash_on_delivery">Cash on Delivery</option>
          </select>
        </CardBody>
      </Card>
    </>
  );
}
