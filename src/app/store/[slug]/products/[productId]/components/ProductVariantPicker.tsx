'use client';

import React from 'react';
import { ShoppingCart, Share2, MessageCircle, Plus, Minus } from 'lucide-react';
import { StorefrontConfig, StorefrontProduct, StorefrontProductVariant } from '@/types/storefront';

interface ProductVariantPickerProps {
  config: StorefrontConfig;
  product: StorefrontProduct;
  selectedVariant?: StorefrontProductVariant;
  quantity: number;
  isAvailable: boolean;
  primaryColor: string;
  onSelectVariant: (v: StorefrontProductVariant) => void;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onShare: () => void;
}

export function ProductVariantPicker({
  config,
  product,
  selectedVariant,
  quantity,
  isAvailable,
  primaryColor,
  onSelectVariant,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  onShare,
}: ProductVariantPickerProps) {
  const maxStock = selectedVariant ? selectedVariant.stock_quantity : product.total_stock;
  const whatsappUrl = `https://wa.me/${config.whatsapp_phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Hi ${config.store_name}, I'm interested in ordering "${product.name}"${selectedVariant?.title && selectedVariant.title !== 'Default' ? ` (${selectedVariant.title})` : ''}. Is this currently available?`
  )}`;

  return (
    <div className="space-y-5 pt-2">
      {/* Variant Pills */}
      {product.variants.length > 1 && (
        <div className="space-y-2">
          <label className="block text-xs font-bold text-foreground">
            Select Option: <span className="text-brand-primary">{selectedVariant?.title}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              const isVariantOut = v.stock_quantity <= 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onSelectVariant(v)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? 'text-white shadow-xs'
                      : isVariantOut
                        ? 'bg-surface/50 border-separator text-muted line-through opacity-60'
                        : 'bg-surface border-separator text-foreground hover:bg-surface-elevated'
                  }`}
                  style={isSelected ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
                >
                  <span>{v.title || 'Standard'}</span>
                  {isVariantOut && <span className="text-[10px] font-normal">(Sold out)</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-foreground">Quantity</label>
        <div className="inline-flex items-center rounded-xl bg-surface border border-separator p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-elevated disabled:opacity-40 transition cursor-pointer"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="w-10 text-center text-xs font-bold tabular-nums text-foreground">{quantity}</span>
          <button
            type="button"
            onClick={() => onQuantityChange(maxStock > 0 ? Math.min(maxStock, quantity + 1) : quantity + 1)}
            disabled={maxStock > 0 && quantity >= maxStock}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-elevated disabled:opacity-40 transition cursor-pointer"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onAddToCart}
            disabled={!isAvailable}
            className="w-full py-3.5 px-4 rounded-2xl bg-surface-elevated border border-separator text-foreground text-xs font-bold hover:bg-surface transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <ShoppingCart size={16} />
            <span>Add to Cart</span>
          </button>

          <button
            type="button"
            onClick={onBuyNow}
            disabled={!isAvailable}
            className="w-full py-3.5 px-4 rounded-2xl text-white text-xs font-bold shadow-md hover:opacity-90 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            <span>
              {product.active_batch
                ? `Join ${product.active_batch.name || 'Batch'}`
                : product.availability_status === 'PRE_ORDER'
                  ? 'Pre-Order Now'
                  : 'Buy Now'}
            </span>
          </button>
        </div>

        {/* Social Actions (WhatsApp & Share) */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {config.whatsapp_phone && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-[#25D366]/10 text-[#25D366] text-xs font-bold hover:bg-[#25D366]/20 transition flex items-center justify-center gap-1.5 cursor-pointer border border-[#25D366]/20"
            >
              <MessageCircle size={15} />
              <span>Ask on WhatsApp</span>
            </a>
          )}

          <button
            type="button"
            onClick={onShare}
            className="py-2.5 px-3 rounded-xl bg-surface border border-separator text-muted hover:text-foreground text-xs font-semibold hover:bg-surface-elevated transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Share2 size={14} />
            <span>Share Product</span>
          </button>
        </div>
      </div>
    </div>
  );
}
