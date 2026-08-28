'use client';

import { CheckCircle } from 'lucide-react';

interface CartSuccessViewProps {
  customerPhone: string;
  onReset: () => void;
}

export function CartSuccessView({ customerPhone, onReset }: CartSuccessViewProps) {
  return (
    <div className="p-6 text-center space-y-3 my-auto">
      <div className="w-12 h-12 rounded-full bg-success/15 text-success mx-auto flex items-center justify-center">
        <CheckCircle size={24} />
      </div>
      <h3 className="text-base font-bold text-foreground">Order Received!</h3>
      <p className="text-xs text-muted leading-relaxed">
        Thank you for your order. We have recorded your request and our team will contact you shortly on{' '}
        <span className="font-semibold text-foreground">{customerPhone}</span> to confirm delivery.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 transition cursor-pointer mt-4"
      >
        Continue Shopping
      </button>
    </div>
  );
}
