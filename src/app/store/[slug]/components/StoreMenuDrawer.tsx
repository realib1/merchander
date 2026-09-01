'use client';

import React, { useState, useEffect } from 'react';
import { StorefrontCategory, StorefrontConfig } from '@/types/storefront';
import { getBusinessInitials } from '@/utils/format';
import { useFocusTrap } from '@/hooks';
import {
  X,
  ShoppingBag,
  Grid,
  Package,
  Heart,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Truck,
} from 'lucide-react';

interface StoreMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: StorefrontConfig;
  categories?: StorefrontCategory[];
  onSelectCategory?: (categoryId: string) => void;
  onOpenTracking: () => void;
  onOpenWishlist: () => void;
}

export function StoreMenuDrawer({
  isOpen,
  onClose,
  config,
  categories = [],
  onSelectCategory,
  onOpenTracking,
  onOpenWishlist,
}: StoreMenuDrawerProps) {
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const containerRef = useFocusTrap(isOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const primaryColor = config.primary_color || '#3b82f6';
  const cleanPhone = config.whatsapp_phone?.replace(/[^0-9]/g, '');
  const whatsappLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hello ${config.store_name}, I have an inquiry about your store.`
      )}`
    : null;

  const handleAction = (cb: () => void) => {
    cb();
    onClose();
  };

  const scrollToCatalog = () => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('store-catalog-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-start animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Store Navigation Menu"
    >
      <div
        className="w-full max-w-xs sm:max-w-sm bg-surface border-r border-separator h-full flex flex-col justify-between shadow-2xl animate-slideRight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-separator flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              {config.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.logo_url} alt={config.store_name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-white text-xs font-display">
                  {getBusinessInitials(config.store_name)}
                </span>
              )}
            </div>
            <div className="min-w-0 truncate">
              <span className="font-bold text-sm text-foreground truncate block">{config.store_name}</span>
              {config.tagline && <p className="text-[10px] text-muted truncate font-medium">{config.tagline}</p>}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-surface-elevated text-muted hover:text-foreground flex items-center justify-center cursor-pointer transition active:scale-95"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar text-xs sm:text-sm">
          {/* 1. Explore */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Explore</p>
            <button
              type="button"
              onClick={() =>
                handleAction(() => {
                  onSelectCategory?.('all');
                  scrollToCatalog();
                })
              }
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-elevated text-foreground font-semibold transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag size={16} style={{ color: primaryColor }} />
                <span>All Products</span>
              </div>
              <ChevronRight size={14} className="text-muted" />
            </button>

            {categories.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-elevated text-foreground font-semibold transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Grid size={16} className="text-muted" />
                    <span>Categories ({categories.length})</span>
                  </div>
                  {isCategoriesExpanded ? (
                    <ChevronDown size={14} className="text-muted" />
                  ) : (
                    <ChevronRight size={14} className="text-muted" />
                  )}
                </button>

                {isCategoriesExpanded && (
                  <div className="pl-8 pr-2 py-1 space-y-1 border-l-2 border-separator/60 ml-5 my-1 animate-fadeIn">
                    <button
                      type="button"
                      onClick={() =>
                        handleAction(() => {
                          onSelectCategory?.('all');
                          scrollToCatalog();
                        })
                      }
                      className="w-full text-left py-1.5 px-2 rounded-lg text-xs text-muted hover:text-foreground hover:bg-surface-elevated/60 transition cursor-pointer font-medium"
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          handleAction(() => {
                            onSelectCategory?.(cat.id);
                            scrollToCatalog();
                          })
                        }
                        className="w-full text-left py-1.5 px-2 rounded-lg text-xs text-muted hover:text-foreground hover:bg-surface-elevated/60 transition cursor-pointer font-medium truncate"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Customer Account & Orders */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Account & Orders</p>
            <button
              type="button"
              onClick={() => handleAction(onOpenTracking)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-elevated text-foreground font-semibold transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Package size={16} style={{ color: primaryColor }} />
                <span>Track My Orders</span>
              </div>
              <ChevronRight size={14} className="text-muted" />
            </button>

            <button
              type="button"
              onClick={() => handleAction(onOpenWishlist)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-elevated text-foreground font-semibold transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Heart size={16} className="text-rose-500" />
                <span>Saved Items (Wishlist)</span>
              </div>
              <ChevronRight size={14} className="text-muted" />
            </button>
          </div>

          {/* 3. Connect & Help */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Connect & Help</p>
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-elevated text-foreground font-semibold transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle size={16} className="text-emerald-500" />
                  <span>Chat on WhatsApp</span>
                </div>
                <ExternalLink size={13} className="text-muted" />
              </a>
            )}

            {config.instagram_handle && (
              <a
                href={`https://instagram.com/${config.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-elevated text-foreground font-semibold transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <ExternalLink size={16} className="text-muted" />
                  <span>Instagram</span>
                </div>
                <ExternalLink size={13} className="text-muted" />
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-separator bg-surface-elevated/30 space-y-2">
          {config.delivery_policy && (
            <div className="flex items-center gap-2 text-[11px] text-muted font-medium">
              <Truck size={13} className="shrink-0 text-brand-primary" />
              <span className="truncate">{config.delivery_policy}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-[11px] text-muted pt-1">
            <span className="font-semibold text-foreground">{config.store_name}</span>
            <span>Powered by Merchander</span>
          </div>
        </div>
      </div>
    </div>
  );
}
