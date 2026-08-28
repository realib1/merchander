'use client';

import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';

interface OrderSummaryCardProps {
  subtotal: number;
  deliveryFee: number;
  paymentMethod: string;
}

function SubmitButtons({ paymentMethod }: { paymentMethod: string }) {
  const { pending } = useFormStatus();
  const isDirectConfirm = paymentMethod === 'cash_payment' || paymentMethod === 'cash_on_delivery';
  return (
    <>
      <Button
        variant="primary"
        type="submit"
        name="action"
        value="create"
        disabled={pending}
        className="w-full shadow-sm shadow-brand-primary/20"
      >
        {pending ? 'Creating...' : isDirectConfirm ? 'Confirm Order' : 'Create Order & Request Pay'}
      </Button>
      <Button
        variant="secondary"
        type="submit"
        name="action"
        value="draft"
        disabled={pending}
        className="w-full bg-surface-elevated hover:bg-surface-elevated/80"
      >
        {pending ? 'Saving...' : 'Save as Draft'}
      </Button>
    </>
  );
}

export function OrderSummaryCard({ subtotal, deliveryFee, paymentMethod }: OrderSummaryCardProps) {
  const total = subtotal + deliveryFee;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm pb-3 border-b border-separator">
              <span>Delivery</span>
              <span className="font-medium">{formatCurrency(deliveryFee)}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="font-semibold">Total: </span>
              <span className="text-lg font-bold">{formatCurrency(total)}</span>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-3 sticky top-6">
        <SubmitButtons paymentMethod={paymentMethod} />
        <Link href="/dashboard/orders" className="w-full">
          <Button variant="outline" type="button" className="w-full border-separator hover:text-brand-primary">
            Cancel
          </Button>
        </Link>
      </div>
    </>
  );
}
