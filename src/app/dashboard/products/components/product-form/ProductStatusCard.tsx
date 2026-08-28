'use client';

import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';

interface ProductStatusCardProps {
  isActive: boolean;
  availabilityStatus: 'AVAILABLE' | 'PRE_ORDER' | 'OUT_OF_STOCK';
  preorderShippingMode: 'included' | 'tbd';
  onIsActiveChange: (val: boolean) => void;
  onAvailabilityStatusChange: (val: 'AVAILABLE' | 'PRE_ORDER' | 'OUT_OF_STOCK') => void;
  onPreorderShippingModeChange: (val: 'included' | 'tbd') => void;
}

export function ProductStatusCard({
  isActive,
  availabilityStatus,
  preorderShippingMode,
  onIsActiveChange,
  onAvailabilityStatusChange,
  onPreorderShippingModeChange,
}: ProductStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status</CardTitle>
      </CardHeader>
      <CardBody>
        <label htmlFor="product-status" className="sr-only">
          Product Status
        </label>
        <select
          id="product-status"
          value={isActive ? 'active' : 'draft'}
          onChange={(e) => onIsActiveChange(e.target.value === 'active')}
          className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all mb-4"
        >
          <option value="active">Active (Published)</option>
          <option value="draft">Draft (Hidden)</option>
        </select>

        <label htmlFor="availability-status" className="text-body-sm font-semibold mb-2 block">
          Availability
        </label>
        <select
          id="availability-status"
          value={availabilityStatus}
          onChange={(e) => onAvailabilityStatusChange(e.target.value as 'AVAILABLE' | 'PRE_ORDER' | 'OUT_OF_STOCK')}
          className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
        >
          <option value="AVAILABLE">Available</option>
          <option value="PRE_ORDER">Pre-Order</option>
        </select>

        {availabilityStatus === 'PRE_ORDER' && (
          <div className="mt-4">
            <label htmlFor="preorder-shipping-mode" className="text-body-sm font-semibold mb-2 block">
              Pre-Order Shipping
            </label>
            <select
              id="preorder-shipping-mode"
              value={preorderShippingMode}
              onChange={(e) => onPreorderShippingModeChange(e.target.value as 'included' | 'tbd')}
              className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
            >
              <option value="included">Shipping Included in Price</option>
              <option value="tbd">TBD (Calculated on Arrival)</option>
            </select>
            <p className="text-xs text-muted mt-1.5">If TBD, customer pays shipping fee when goods arrive.</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
