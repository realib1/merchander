'use client';

import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { PreorderBatch } from '@/types/preorder';
import { ProductPreorderConfigSection, PreorderCustomBatchState } from './ProductPreorderConfigSection';

interface ProductStatusCardProps {
  isActive: boolean;
  availabilityStatus: 'AVAILABLE' | 'PRE_ORDER' | 'OUT_OF_STOCK';
  preorderShippingMode: 'included' | 'tbd';
  batches?: PreorderBatch[];
  selectedBatchId?: string | null;
  customBatch: PreorderCustomBatchState;
  productName: string;
  onIsActiveChange: (val: boolean) => void;
  onAvailabilityStatusChange: (val: 'AVAILABLE' | 'PRE_ORDER' | 'OUT_OF_STOCK') => void;
  onPreorderShippingModeChange: (val: 'included' | 'tbd') => void;
  onSelectBatchId: (id: string | null) => void;
  onCustomBatchChange: (batch: PreorderCustomBatchState) => void;
}

export function ProductStatusCard({
  isActive,
  availabilityStatus,
  preorderShippingMode,
  batches = [],
  selectedBatchId,
  customBatch,
  productName,
  onIsActiveChange,
  onAvailabilityStatusChange,
  onPreorderShippingModeChange,
  onSelectBatchId,
  onCustomBatchChange,
}: ProductStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status &amp; Availability</CardTitle>
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
          Availability Mode
        </label>
        <select
          id="availability-status"
          value={availabilityStatus}
          onChange={(e) => onAvailabilityStatusChange(e.target.value as 'AVAILABLE' | 'PRE_ORDER' | 'OUT_OF_STOCK')}
          className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
        >
          <option value="AVAILABLE">In Stock / Regular Item</option>
          <option value="PRE_ORDER">Pre-Order (Batch Procurement)</option>
        </select>

        {availabilityStatus === 'PRE_ORDER' && (
          <ProductPreorderConfigSection
            batches={batches}
            selectedBatchId={selectedBatchId}
            customBatch={customBatch}
            shippingMode={preorderShippingMode}
            productName={productName}
            onSelectBatchId={onSelectBatchId}
            onCustomBatchChange={onCustomBatchChange}
            onShippingModeChange={onPreorderShippingModeChange}
          />
        )}
      </CardBody>
    </Card>
  );
}
