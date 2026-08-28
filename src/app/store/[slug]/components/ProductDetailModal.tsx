'use client';

import React, { useState } from 'react';
import { StorefrontCartItem, StorefrontProduct } from '@/types/storefront';
import { formatCurrency } from '@/utils/format';
import { X, Plus, Minus, ShoppingBag, Check } from 'lucide-react';

interface ProductDetailModalProps {
  product: StorefrontProduct | null;
  currency: string;
  onClose: () => void;
  onAddToCart: (item: StorefrontCartItem) => void;
}

export function ProductDetailModal({ product, currency, onClose, onAddToCart }: ProductDetailModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(product?.variants[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const currentVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const price = currentVariant ? currentVariant.price : product.min_price;
  const isAvailable = currentVariant ? currentVariant.is_available && currentVariant.stock_quantity > 0 : true;

  const handleAdd = () => {
    if (!currentVariant || !isAvailable) return;

    onAddToCart({
      variantId: currentVariant.id,
      productId: product.id,
      productName: product.name,
      variantTitle: currentVariant.title || 'Standard',
      price: currentVariant.price,
      quantity,
      imageUrl: product.image_url,
      sku: currentVariant.sku,
    });

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-surface border border-separator rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scaleUp">
        {/* Header Image */}
        <div className="relative h-56 sm:h-64 w-full bg-surface-elevated">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <ShoppingBag size={48} className="opacity-30" />
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-surface/80 backdrop-blur-xs text-foreground flex items-center justify-center hover:bg-surface cursor-pointer transition shadow-xs"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Product Details */}
        <div className="p-5 space-y-4">
          <div>
            <div className="text-xs font-semibold text-muted">{product.category_name}</div>
            <h2 className="text-lg font-bold text-foreground tracking-tight mt-0.5">{product.name}</h2>
            <div className="text-lg font-bold text-brand-primary mt-1">{formatCurrency(price, currency)}</div>
          </div>

          {product.description && (
            <p className="text-xs text-muted leading-relaxed line-clamp-3">{product.description}</p>
          )}

          {/* Variants Selector */}
          {product.variants.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Select Option / Variant
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = v.id === selectedVariantId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition border ${
                        isSelected
                          ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                          : 'bg-surface-elevated border-separator text-foreground hover:border-separator/80'
                      } ${!v.is_available ? 'opacity-50' : ''}`}
                    >
                      <span>{v.title}</span>
                      {v.price !== product.min_price && (
                        <span className="ml-1 opacity-80">({formatCurrency(v.price, currency)})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="flex items-center gap-3 pt-2">
            {/* Quantity Selector */}
            <div className="flex items-center bg-surface-elevated border border-separator rounded-xl p-1 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-foreground disabled:opacity-40 cursor-pointer"
              >
                <Minus size={13} />
              </button>
              <span className="w-8 text-center text-xs font-bold text-foreground tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-foreground cursor-pointer"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={handleAdd}
              disabled={!isAvailable}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                added
                  ? 'bg-success text-white'
                  : isAvailable
                    ? 'bg-brand-primary text-white hover:bg-brand-primary/90'
                    : 'bg-surface-elevated text-muted border border-separator cursor-not-allowed'
              }`}
            >
              {added ? (
                <>
                  <Check size={15} /> Added to Bag
                </>
              ) : isAvailable ? (
                <>
                  <ShoppingBag size={15} /> Add to Bag • {formatCurrency(price * quantity, currency)}
                </>
              ) : (
                'Out of Stock'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
