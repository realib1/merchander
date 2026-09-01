'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Star, ShoppingBag, Check, Plus, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { updateFeaturedProductIds } from '@/app/actions/storefront-dashboard';
import { toast } from 'sonner';

interface ProductItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  isFeatured: boolean;
}

interface FeaturedProductsManagerProps {
  products: ProductItem[];
  initialFeaturedIds: string[];
  currency: string;
  onFeaturedChange?: (ids: string[]) => void;
}

export function FeaturedProductsManager({
  products,
  initialFeaturedIds,
  currency,
  onFeaturedChange,
}: FeaturedProductsManagerProps) {
  const [featuredIds, setFeaturedIds] = useState<string[]>(initialFeaturedIds);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (productId: string) => {
    const nextIds = featuredIds.includes(productId)
      ? featuredIds.filter((id) => id !== productId)
      : [...featuredIds, productId];

    setFeaturedIds(nextIds);
    onFeaturedChange?.(nextIds);

    startTransition(async () => {
      const res = await updateFeaturedProductIds(nextIds);
      if (res.error) {
        toast.error(res.error);
        // revert on error
        setFeaturedIds(featuredIds);
        onFeaturedChange?.(featuredIds);
      } else {
        toast.success(
          nextIds.includes(productId)
            ? 'Product pinned as Featured on storefront'
            : 'Product removed from Featured section'
        );
      }
    });
  };

  if (products.length === 0) return null;

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
              <Star className="h-5 w-5 fill-amber-500/20" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Featured Products Showcase</CardTitle>
              <CardDescription className="text-xs text-muted">
                Pin best-sellers and promotional products to appear first with a Featured badge on your storefront.
              </CardDescription>
            </div>
          </div>
          {isPending && <Loader2 size={16} className="animate-spin text-brand-primary" />}
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map((p) => {
            const isFeatured = featuredIds.includes(p.id);

            return (
              <div
                key={p.id}
                onClick={() => handleToggle(p.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isFeatured
                    ? 'border-brand-primary bg-brand-primary/5 shadow-xs ring-1 ring-brand-primary/50'
                    : 'border-separator bg-surface hover:bg-surface-elevated/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-surface-elevated overflow-hidden border border-separator shrink-0 flex items-center justify-center">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag size={16} className="text-muted" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                    <p className="text-[11px] font-mono text-muted">{formatCurrency(p.price, currency)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={isFeatured ? 'Unpin product' : 'Pin product'}
                  className={`h-7 w-7 rounded-xl flex items-center justify-center text-xs transition shrink-0 ${
                    isFeatured ? 'bg-brand-primary text-white' : 'bg-surface-elevated text-muted hover:text-foreground'
                  }`}
                >
                  {isFeatured ? <Check size={14} /> : <Plus size={14} />}
                </button>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
