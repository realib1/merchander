'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';

interface ProductPricingCardProps {
  basePrice: number | '';
  baseCostPrice: number | '';
  onBasePriceChange: (val: number | '') => void;
  onBaseCostPriceChange: (val: number | '') => void;
}

export function ProductPricingCard({
  basePrice,
  baseCostPrice,
  onBasePriceChange,
  onBaseCostPriceChange,
}: ProductPricingCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing</CardTitle>
        <CardDescription>Set the default base price for this product.</CardDescription>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-body-sm font-semibold">Selling Price (GHS)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">₵</span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={basePrice === '' ? '' : basePrice}
                onChange={(e) => onBasePriceChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-body-sm font-semibold">Cost Price (GHS)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">₵</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={baseCostPrice === '' ? '' : baseCostPrice}
                onChange={(e) => onBaseCostPriceChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted"
              />
            </div>
            <p className="text-xs text-muted">Used for profit calculation (not visible to customers).</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
