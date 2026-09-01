'use client';

import React, { useState } from 'react';
import { StorefrontCartItem, StorefrontProduct } from '@/types/storefront';
import { formatCurrency, slugify } from '@/utils/format';
import { useFocusTrap } from '@/hooks';
import { X, Plus, Minus, ShoppingBag, ShoppingCart, Check, MessageCircle, ArrowRight } from 'lucide-react';

interface ProductDetailModalProps {
  product: StorefrontProduct | null;
  currency: string;
  primaryColor?: string;
  slug?: string;
  whatsappPhone?: string | null;
  onClose: () => void;
  onAddToCart: (item: StorefrontCartItem) => void;
}

export function ProductDetailModal({
  product,
  currency,
  primaryColor = '#3b82f6',
  slug,
  whatsappPhone,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(product?.variants[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const containerRef = useFocusTrap(!!product);

  if (!product) return null;

  const currentVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const price = currentVariant ? currentVariant.price : product.min_price;
  const isAvailable = currentVariant ? currentVariant.is_available && currentVariant.stock_quantity > 0 : true;

  const cleanWhatsapp = whatsappPhone?.replace(/[^0-9]/g, '');
  const whatsappUrl = cleanWhatsapp
    ? `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
        `Hello, I would like to order: ${product.name}\nVariant: ${
          currentVariant?.title || 'Standard'
        }\nQuantity: ${quantity}\nTotal: ${formatCurrency(price * quantity, currency)}`
      )}`
    : null;

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
    }, 1200);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Product Details"
    >
      <div
        className="bg-surface border border-separator rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleUp custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Image */}
        <div className="relative h-72 sm:h-80 w-full bg-surface-elevated overflow-hidden flex items-center justify-center p-3 sm:p-4">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.name} className="w-full h-full object-contain drop-shadow-sm" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <ShoppingBag size={48} className="opacity-20" />
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-surface/80 backdrop-blur-md text-foreground flex items-center justify-center cursor-pointer hover:bg-surface transition shadow-sm z-10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: primaryColor }}>
                  {product.category_name}
                </span>
                {product.availability_status === 'PRE_ORDER' && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold shadow-xs">
                    Pre-Order
                  </span>
                )}
                {product.availability_status === 'OUT_OF_STOCK' && (
                  <span className="px-2 py-0.5 rounded-md bg-destructive text-white text-[10px] font-bold shadow-xs">
                    Sold Out
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-foreground mt-0.5">{product.name}</h2>
              <div className="text-base font-bold mt-1" style={{ color: primaryColor }}>
                {formatCurrency(price, currency)}
              </div>
            </div>

            {slug && (
              <a
                href={`/store/${slug}/products/${slugify(product.name)}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-surface border border-separator text-xs font-semibold text-brand-primary transition shrink-0 group"
              >
                <span>Details</span>
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            )}
          </div>

          {product.description && (
            <p className="text-xs text-muted leading-relaxed line-clamp-3">{product.description}</p>
          )}

          {/* Variant Selector */}
          {product.variants.length > 1 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Select Variant</label>
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
                          ? 'text-white shadow-xs'
                          : 'bg-surface-elevated border-separator text-foreground hover:border-separator/80'
                      } ${!v.is_available ? 'opacity-50' : ''}`}
                      style={isSelected ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
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
          <div className="space-y-2.5 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Quantity Selector */}
              <div className="flex items-center bg-surface-elevated border border-separator rounded-xl p-1 shrink-0 w-fit">
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
                      ? 'text-white hover:opacity-90 active:scale-95'
                      : 'bg-surface-elevated text-muted border border-separator cursor-not-allowed'
                }`}
                style={!added && isAvailable ? { backgroundColor: primaryColor } : undefined}
              >
                {added ? (
                  <>
                    <Check size={15} /> Added to Cart
                  </>
                ) : isAvailable ? (
                  <>
                    <ShoppingCart size={15} />{' '}
                    {product.availability_status === 'PRE_ORDER' ? 'Pre-Order Now' : 'Add to Cart'}
                  </>
                ) : (
                  'Out of Stock'
                )}
              </button>
            </div>

            {/* WhatsApp Direct Buy */}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-success/15 hover:bg-success/20 text-success border border-success/30 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle size={14} />
                <span>Order this item on WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
