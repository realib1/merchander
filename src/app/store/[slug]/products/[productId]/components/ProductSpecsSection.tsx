import React from 'react';
import { Truck } from 'lucide-react';
import { StorefrontConfig, StorefrontProduct } from '@/types/storefront';

interface ProductSpecsSectionProps {
  config: StorefrontConfig;
  product: StorefrontProduct;
}

export function ProductSpecsSection({ config, product }: ProductSpecsSectionProps) {
  const specs = product.specifications || [];
  const hasContent = Boolean(product.description || specs.length > 0 || config.delivery_policy);

  if (!hasContent) return null;

  return (
    <div className="space-y-6 pt-4 border-t border-separator/80">
      {/* Description */}
      {product.description && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">About this Product</h3>
          <p className="text-xs text-muted leading-relaxed whitespace-pre-line">{product.description}</p>
        </div>
      )}

      {/* Specifications Table */}
      {specs.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Specifications</h3>
          <div className="rounded-2xl border overflow-hidden bg-surface divide-y divide-separator/60">
            {specs.map((item, idx) => (
              <div key={idx} className="grid grid-cols-2 p-3 text-xs">
                <span className="font-semibold text-muted">{item.key}</span>
                <span className="text-foreground font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Merchant Delivery Policy */}
      {config.delivery_policy && (
        <div className="p-3.5 rounded-2xl bg-surface-elevated border border-separator/80 flex items-start gap-3">
          <Truck size={18} className="text-brand-primary shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-foreground">Delivery & Dispatch Policy</h4>
            <p className="text-[11px] text-muted">{config.delivery_policy}</p>
          </div>
        </div>
      )}
    </div>
  );
}
