import React from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/utils/format';
import { Package } from 'lucide-react';

export interface TopProduct {
  id: string;
  name: string;
  price: number;
  quantitySold?: number;
  image_url: string | null;
}

export function TopProductsList({ products }: { products: TopProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-muted">
        <Package className="w-10 h-10 mb-2 opacity-20" />
        <p className="text-sm">No products found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-separator">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center gap-3 py-3 px-4 hover:bg-surface-elevated/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-separator overflow-hidden shrink-0 flex items-center justify-center relative">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} fill className="object-cover" />
            ) : (
              <Package size={16} className="text-muted" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold truncate text-foreground">{product.name}</h4>
            <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
              <span className="tabular-nums font-medium text-foreground">{formatCurrency(product.price)}</span>
              {product.quantitySold !== undefined && (
                <>
                  <span>•</span>
                  <span className="tabular-nums font-medium text-brand-primary">{product.quantitySold} sold</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
