'use client';

import { StorefrontCartItem } from '@/types/storefront';
import { formatCurrency } from '@/utils/format';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import Image from 'next/image';

interface CartItemRowProps {
  item: StorefrontCartItem;
  currency: string;
  onUpdateQuantity: (variantId: string, delta: number) => void;
  onRemoveItem: (variantId: string) => void;
}

export function CartItemRow({ item, currency, onUpdateQuantity, onRemoveItem }: CartItemRowProps) {
  return (
    <div className="p-2.5 rounded-xl bg-surface-elevated border border-separator/60 flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg bg-surface border border-separator overflow-hidden shrink-0 flex items-center justify-center text-muted relative">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" sizes="48px" />
        ) : (
          <ShoppingBag size={16} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-foreground truncate">{item.productName}</h4>
        {item.variantTitle && item.variantTitle !== 'Standard' && (
          <p className="text-[10px] text-muted">{item.variantTitle}</p>
        )}
        <p className="text-xs font-bold text-brand-primary mt-0.5">{formatCurrency(item.price, currency)}</p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onUpdateQuantity(item.variantId, -1)}
          className="h-6 w-6 rounded-md bg-surface border border-separator text-muted hover:text-foreground flex items-center justify-center cursor-pointer"
        >
          <Minus size={11} />
        </button>
        <span className="text-xs font-bold text-foreground tabular-nums w-4 text-center">{item.quantity}</span>
        <button
          type="button"
          onClick={() => onUpdateQuantity(item.variantId, 1)}
          className="h-6 w-6 rounded-md bg-surface border border-separator text-muted hover:text-foreground flex items-center justify-center cursor-pointer"
        >
          <Plus size={11} />
        </button>
        <button
          type="button"
          onClick={() => onRemoveItem(item.variantId)}
          className="h-6 w-6 rounded-md text-destructive/70 hover:text-destructive flex items-center justify-center cursor-pointer ml-1"
          title="Remove"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
