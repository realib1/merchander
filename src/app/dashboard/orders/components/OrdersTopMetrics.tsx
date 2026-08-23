import React from 'react';
import { ShoppingCart, Clock, Truck, XCircle } from 'lucide-react';

export interface OrdersMetricsProps {
  metrics: {
    total: number;
    pendingPayment: number;
    toDispatch: number;
    cancelled: number;
  };
}

export function OrdersTopMetrics({ metrics }: OrdersMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Total orders */}
      <div className="bg-surface border border-separator rounded-2xl p-6 flex flex-col min-h-[130px]">
        <h3 className="text-[15px] font-medium text-text-secondary mb-3">Total orders</h3>
        <div className="text-[32px] font-bold text-text-primary leading-none mb-3">
          {metrics.total.toLocaleString()}
        </div>
        <div className="text-sm font-medium text-success mt-auto">
          +12.4% this month
        </div>
      </div>

      {/* Processing / Pending */}
      <div className="bg-surface border border-separator rounded-2xl p-6 flex flex-col min-h-[130px]">
        <h3 className="text-[15px] font-medium text-text-secondary mb-3">Pending payment</h3>
        <div className="text-[32px] font-bold text-text-primary leading-none mb-3">
          {metrics.pendingPayment.toLocaleString()}
        </div>
        <div className="text-sm font-medium text-text-muted mt-auto">
          Awaiting fulfillment
        </div>
      </div>

      {/* To Dispatch / In transit */}
      <div className="bg-surface border border-separator rounded-2xl p-6 flex flex-col min-h-[130px]">
        <h3 className="text-[15px] font-medium text-text-secondary mb-3">To dispatch</h3>
        <div className="text-[32px] font-bold text-text-primary leading-none mb-3">
          {metrics.toDispatch.toLocaleString()}
        </div>
        <div className="text-sm font-medium text-text-muted mt-auto">
          Currently shipping
        </div>
      </div>

      {/* Cancelled / Returns */}
      <div className="bg-surface border border-separator rounded-2xl p-6 flex flex-col min-h-[130px]">
        <h3 className="text-[15px] font-medium text-text-secondary mb-3">Cancelled</h3>
        <div className="text-[32px] font-bold text-text-primary leading-none mb-3">
          {metrics.cancelled.toLocaleString()}
        </div>
        <div className="text-sm font-medium text-warning mt-auto">
          Requires review
        </div>
      </div>
    </div>
  );
}
