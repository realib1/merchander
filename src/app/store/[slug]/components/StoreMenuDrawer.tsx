'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StorefrontCategory, StorefrontConfig } from '@/types/storefront';
import { getBusinessInitials } from '@/utils/format';
import { useFocusTrap } from '@/hooks';
import {
  X,
  Home,
  LayoutGrid,
  Heart,
  ShoppingBag,
  Sparkles,
  User,
  Headphones,
  Settings,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface StoreMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: StorefrontConfig;
  categories?: StorefrontCategory[];
  wishlistCount?: number;
  onSelectCategory?: (categoryId: string) => void;
  onOpenTracking: () => void;
  onOpenWishlist: () => void;
}

export function StoreMenuDrawer({
  isOpen,
  onClose,
  config,
  categories = [],
  wishlistCount = 0,
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

  const primaryColor = config.primary_color || '#f97316';
  const cleanPhone = config.whatsapp_phone?.replace(/[^0-9]/g, '');
  const whatsappLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hello ${config.store_name}, I need help with your store.`
      )}`
    : null;

  const handleAction = (cb: () => void) => {
    cb();
    onClose();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex justify-start animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Store Navigation Menu"
    >
      <div
        className="w-full max-w-[280px] sm:max-w-xs bg-[#121214] text-zinc-100 border-r border-zinc-800/80 h-full flex flex-col justify-between shadow-2xl animate-slideRight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header matching Screen 13 */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            {config.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.logo_url}
                alt={config.store_name}
                className="h-8 w-auto max-w-28 object-contain rounded-md"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                {getBusinessInitials(config.store_name)}
              </div>
            )}
            <span className="font-bold text-sm text-white tracking-tight truncate">
              {config.store_name}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 flex items-center justify-center cursor-pointer transition active:scale-95"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 text-sm custom-scrollbar">
          {/* 1. Home (Active Style) */}
          <button
            type="button"
            onClick={() =>
              handleAction(() => {
                if (typeof window !== 'undefined') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              })
            }
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium transition cursor-pointer text-white bg-zinc-800/70"
          >
            <Home size={18} style={{ color: primaryColor }} />
            <span style={{ color: primaryColor }} className="font-semibold">Home</span>
          </button>

          {/* 2. Categories */}
          <div>
            <div className="flex items-center justify-between">
              <Link
                href={`/store/${config.slug}/categories`}
                onClick={onClose}
                className="flex-1 flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/40 transition cursor-pointer"
              >
                <LayoutGrid size={18} className="text-zinc-400" />
                <span>Categories</span>
              </Link>
              {categories.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                  className="p-2 text-zinc-400 hover:text-white transition"
                  aria-label="Toggle categories list"
                >
                  {isCategoriesExpanded ? (
                    <ChevronDown size={15} className="text-zinc-500" />
                  ) : (
                    <ChevronRight size={15} className="text-zinc-500" />
                  )}
                </button>
              )}
            </div>

            {isCategoriesExpanded && categories.length > 0 && (
              <div className="pl-9 pr-2 py-1 space-y-0.5 animate-fadeIn">
                <Link
                  href={`/store/${config.slug}/categories`}
                  onClick={onClose}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs text-brand-primary hover:text-white hover:bg-zinc-800/50 transition cursor-pointer font-bold"
                >
                  <span>All Categories</span>
                  <ChevronRight size={13} />
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/store/${config.slug}/categories/${cat.id}`}
                    onClick={onClose}
                    className="block w-full text-left py-1.5 px-2.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition cursor-pointer font-medium truncate"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Collections (if enabled) */}
          {config.show_collections && (
            <Link
              href={`/store/${config.slug}/categories#collections`}
              onClick={onClose}
              className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/40 transition cursor-pointer"
            >
              <Sparkles size={18} className="text-zinc-400" />
              <span>Collections</span>
            </Link>
          )}

          {/* 3. Wishlist */}
          <button
            type="button"
            onClick={() => handleAction(onOpenWishlist)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/40 transition cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Heart size={18} className="text-zinc-400" />
              <span>Wishlist</span>
            </div>
            {wishlistCount > 0 && (
              <span
                className="h-5 min-w-5 px-1.5 rounded-full text-[11px] font-bold text-white flex items-center justify-center leading-none"
                style={{ backgroundColor: primaryColor }}
              >
                {wishlistCount}
              </span>
            )}
          </button>

          {/* 4. Orders */}
          <button
            type="button"
            onClick={() => handleAction(onOpenTracking)}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/40 transition cursor-pointer"
          >
            <ShoppingBag size={18} className="text-zinc-400" />
            <span>Orders</span>
          </button>

          {/* 5. Account */}
          <button
            type="button"
            onClick={() => handleAction(onOpenTracking)}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/40 transition cursor-pointer"
          >
            <User size={18} className="text-zinc-400" />
            <span>Account</span>
          </button>

          {/* Divider */}
          <div className="py-2">
            <div className="border-t border-zinc-800/80" />
          </div>

          {/* 6. Help & Support */}
          {whatsappLink ? (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/40 transition cursor-pointer"
            >
              <Headphones size={18} className="text-zinc-400" />
              <span>Help & Support</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => handleAction(onOpenTracking)}
              className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/40 transition cursor-pointer"
            >
              <Headphones size={18} className="text-zinc-400" />
              <span>Help & Support</span>
            </button>
          )}

          {/* 7. Settings */}
          <button
            type="button"
            onClick={() => handleAction(onOpenTracking)}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/40 transition cursor-pointer"
          >
            <Settings size={18} className="text-zinc-400" />
            <span>Settings</span>
          </button>
        </div>

        {/* Bottom brand signature matching Screen 13 */}
        <div className="p-4 border-t border-zinc-800/60 bg-zinc-950/40 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <ShoppingBag size={14} style={{ color: primaryColor }} />
            <span className="font-medium text-zinc-300">Your store. Online.</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-xs flex items-center justify-center text-[9px] font-black text-white"
              style={{ backgroundColor: primaryColor }}
            >
              M
            </div>
            <span className="text-[11px] font-bold text-zinc-400 tracking-tight">
              Merchander
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

