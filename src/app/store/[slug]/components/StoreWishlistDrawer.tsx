'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Trash2, ShoppingBag, Heart, Smartphone, Loader2, CheckCircle2 } from 'lucide-react';
import { StorefrontProduct } from '@/types/storefront';
import { formatCurrency } from '@/utils/format';
import { useFocusTrap } from '@/hooks';

interface StoreWishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: StorefrontProduct[];
  savedIds: string[];
  onRemove: (productId: string) => void;
  onAddToCart: (product: StorefrontProduct) => void;
  onSyncPhone: (phone: string) => Promise<{ success: boolean; error?: string }>;
  currency: string;
  primaryColor?: string;
}

export function StoreWishlistDrawer({
  isOpen,
  onClose,
  products,
  savedIds,
  onRemove,
  onAddToCart,
  onSyncPhone,
  currency,
  primaryColor = '#3b82f6',
}: StoreWishlistDrawerProps) {
  const [phoneInput, setPhoneInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  const containerRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  const savedProducts = products.filter((p) => savedIds.includes(p.id));

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;

    setIsSyncing(true);
    setSyncStatus('idle');
    setSyncMessage('');

    try {
      const res = await onSyncPhone(phoneInput.trim());
      if (res.success) {
        setSyncStatus('success');
        setSyncMessage('Wishlist synced successfully! You can access it anytime.');
      } else {
        setSyncStatus('error');
        setSyncMessage(res.error || 'Failed to sync wishlist. Please verify phone number.');
      }
    } catch {
      setSyncStatus('error');
      setSyncMessage('Network error while syncing. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Saved items wishlist"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface border-l border-separator shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-separator flex items-center justify-between bg-surface-elevated">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <Heart size={16} className="fill-current" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Saved Items</h2>
                <p className="text-[11px] text-muted">
                  {savedProducts.length} {savedProducts.length === 1 ? 'item' : 'items'} in wishlist
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface transition cursor-pointer"
              aria-label="Close saved items drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-16 sm:pb-6 custom-scrollbar">
            {savedProducts.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-surface-elevated flex items-center justify-center text-muted">
                  <Heart size={24} />
                </div>
                <h3 className="text-sm font-bold text-foreground">Your wishlist is empty</h3>
                <p className="text-xs text-muted max-w-xs mx-auto">
                  Tap the heart icon on any product to save it for later without creating an account.
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Explore Products
                </button>
              </div>
            ) : (
              savedProducts.map((product) => {
                const isAvailable = product.total_stock > 0;
                return (
                  <div
                    key={product.id}
                    className="flex gap-3 p-3 rounded-2xl bg-surface-elevated border border-separator/80 hover:border-separator transition"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-18 h-18 rounded-xl overflow-hidden bg-surface border border-separator/40 shrink-0">
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="72px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted">
                          <ShoppingBag size={20} />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-foreground truncate">{product.name}</h4>
                        <p className="text-xs font-bold text-foreground mt-0.5" style={{ color: primaryColor }}>
                          {formatCurrency(product.min_price, currency)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        {isAvailable ? (
                          <button
                            onClick={() => onAddToCart(product)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shadow-xs transition hover:opacity-90 flex items-center gap-1 cursor-pointer"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <ShoppingBag size={12} />
                            <span>Add to Cart</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-danger bg-danger/10 px-2 py-0.5 rounded-md">
                            Out of Stock
                          </span>
                        )}

                        <button
                          onClick={() => onRemove(product.id)}
                          className="p-1 text-muted hover:text-danger rounded-md transition cursor-pointer"
                          aria-label={`Remove ${product.name} from wishlist`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer - Cross-Device Sync Prompt */}
          {savedProducts.length > 0 && (
            <div className="p-4 border-t border-separator bg-surface-elevated space-y-3">
              <div className="flex items-start gap-2 text-xs text-muted">
                <Smartphone size={16} className="text-brand-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Sync across devices:</strong> Enter your phone number to access your saved items anytime on
                  WhatsApp.
                </span>
              </div>

              <form onSubmit={handleSync} className="flex gap-2">
                <input
                  type="tel"
                  placeholder="024 123 4567"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="flex-1 text-xs rounded-xl bg-surface border border-separator px-3 py-2 placeholder:text-muted/60 focus:ring-1 focus:ring-brand-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSyncing || !phoneInput.trim()}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSyncing ? <Loader2 size={14} className="animate-spin" /> : 'Sync'}
                </button>
              </form>

              {syncStatus === 'success' && (
                <div className="p-2 rounded-lg bg-success/10 border border-success/20 text-success text-[11px] flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={14} />
                  <span>{syncMessage}</span>
                </div>
              )}

              {syncStatus === 'error' && (
                <div className="p-2 rounded-lg bg-danger/10 border border-danger/20 text-danger text-[11px] font-medium">
                  {syncMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
