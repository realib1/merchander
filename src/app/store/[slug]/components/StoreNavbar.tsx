import React from 'react';
import Link from 'next/link';
import { StorefrontConfig } from '@/types/storefront';
import { Menu, ShoppingCart, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { getBusinessInitials } from '@/utils/format';

interface StoreNavbarProps {
  config: StorefrontConfig;
  cartCount: number;
  wishlistCount?: number;
  onOpenCart: () => void;
  onOpenWishlist?: () => void;
  onOpenMenu?: () => void;
  onOpenSearch?: () => void;
  onOpenTracking?: () => void;
  onSelectFilter?: (filter: 'all' | 'new' | 'sale') => void;
}

export function StoreNavbar({
  config,
  cartCount,
  wishlistCount = 0,
  onOpenCart,
  onOpenWishlist,
  onOpenMenu,
  onOpenSearch,
  onOpenTracking,
}: StoreNavbarProps) {
  const primaryColor = config.primary_color || '#3b82f6';
  const storeHomeUrl = `/store/${config.slug}`;
  const storeOrdersUrl = `/store/${config.slug}/orders`;

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-separator/80 transition-all shadow-xs">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-surface focus:text-foreground focus:top-0 focus:left-0 focus:outline-none focus:ring-2 focus:ring-brand-primary"
      >
        Skip to main content
      </a>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* 1. Brand Identity */}
        <div className="flex items-center gap-6 min-w-0">
          <Link href={storeHomeUrl} className="flex items-center gap-2.5 min-w-0 group">
            {config.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.logo_url}
                alt={config.store_name}
                className="h-8 sm:h-9 w-auto max-h-8 sm:max-h-9 max-w-32 sm:max-w-50 object-contain shrink-0 rounded-lg group-hover:opacity-90 transition"
              />
            ) : (
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center overflow-hidden shrink-0 rounded-xl font-bold font-display text-white text-xs sm:text-sm shadow-xs select-none group-hover:scale-105 transition-transform"
                style={{ backgroundColor: primaryColor }}
              >
                {getBusinessInitials(config.store_name)}
              </div>
            )}

            <div className="hidden sm:block min-w-0 truncate">
              <span className="font-bold text-sm sm:text-base text-foreground tracking-tight truncate block group-hover:text-brand-primary transition">
                {config.store_name}
              </span>
              {config.tagline && <p className="text-[10px] text-muted truncate font-medium">{config.tagline}</p>}
            </div>
          </Link>

          {/* Desktop Navigation Links (Visible on md and above) */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href={storeHomeUrl}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-elevated transition cursor-pointer"
            >
              Shop
            </Link>

            {onOpenTracking ? (
              <button
                type="button"
                onClick={onOpenTracking}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-elevated transition cursor-pointer"
              >
                Track Order
              </button>
            ) : (
              <Link
                href={storeOrdersUrl}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-elevated transition cursor-pointer"
              >
                Track Order
              </Link>
            )}

            {onOpenWishlist && (
              <button
                type="button"
                onClick={onOpenWishlist}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-elevated transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Saved Items</span>
                {wishlistCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold leading-none">
                    {wishlistCount}
                  </span>
                )}
              </button>
            )}
          </nav>
        </div>

        {/* 2. Right Actions: Search, Cart, Theme Toggle, Mobile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Search Button */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="h-8 w-8 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-separator text-muted hover:text-foreground flex items-center justify-center cursor-pointer transition active:scale-95"
              aria-label="Search catalog"
              title="Search (Press /)"
            >
              <Search size={15} />
            </button>
          )}

          {/* Shopping Cart Button */}
          <button
            type="button"
            onClick={onOpenCart}
            className="hidden sm:flex relative items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-90 transition active:scale-95 cursor-pointer"
            style={{ backgroundColor: primaryColor }}
            aria-label={`Shopping cart (${cartCount} items)`}
          >
            <ShoppingCart size={14} />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-white text-[10px] font-black text-slate-900 leading-none">
                {cartCount}
              </span>
            )}
          </button>

          {/* Theme Switcher */}
          <ThemeToggle variant="toggle" className="h-8 w-8 rounded-xl bg-surface-elevated border-separator" />

          {/* Mobile Menu Hamburger Button (strictly hidden on md and above) */}
          {onOpenMenu && (
            <button
              type="button"
              onClick={onOpenMenu}
              className="md:hidden h-8 w-8 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-separator text-muted hover:text-foreground flex items-center justify-center cursor-pointer transition active:scale-95"
              aria-label="Open storefront menu"
            >
              <Menu size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
