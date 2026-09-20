'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, ShoppingCart, Search, Heart, User } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

interface StoreNavbarActionsProps {
  primaryColor: string;
  cartCount: number;
  wishlistCount?: number;
  storeOrdersUrl: string;
  onOpenCart: () => void;
  onOpenWishlist?: () => void;
  onOpenMenu?: () => void;
  onOpenSearch?: () => void;
  onOpenTracking?: () => void;
}

export function StoreNavbarActions({
  primaryColor,
  cartCount,
  wishlistCount = 0,
  storeOrdersUrl,
  onOpenCart,
  onOpenWishlist,
  onOpenMenu,
  onOpenSearch,
  onOpenTracking,
}: StoreNavbarActionsProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
      {onOpenSearch && (
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-full border border-separator/80 bg-surface text-muted text-xs transition hover:border-separator hover:bg-surface-elevated w-48 lg:w-64 cursor-pointer"
        >
          <Search size={14} className="text-muted shrink-0" />
          <span className="truncate text-muted/80">Search products...</span>
        </button>
      )}

      {onOpenSearch && (
        <button
          type="button"
          onClick={onOpenSearch}
          className="md:hidden h-9 w-9 rounded-full border border-separator/70 bg-surface text-muted transition hover:text-foreground flex items-center justify-center cursor-pointer active:scale-95"
          aria-label="Search catalog"
        >
          <Search size={16} />
        </button>
      )}

      {onOpenWishlist && (
        <button
          type="button"
          onClick={onOpenWishlist}
          className="relative hidden sm:flex h-9 w-9 rounded-full border border-separator/70 bg-surface text-muted transition hover:text-foreground hover:bg-surface-elevated items-center justify-center cursor-pointer active:scale-95"
          aria-label="Saved items wishlist"
        >
          <Heart size={16} className={wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : ''} />
          {wishlistCount > 0 && (
            <span
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center leading-none"
              style={{ backgroundColor: primaryColor }}
            >
              {wishlistCount}
            </span>
          )}
        </button>
      )}

      <button
        type="button"
        onClick={onOpenCart}
        className="relative h-9 w-9 sm:w-auto sm:px-3.5 rounded-full border sm:border-transparent border-separator/70 bg-surface sm:bg-brand-primary text-foreground sm:text-white flex items-center justify-center gap-1.5 transition hover:opacity-90 active:scale-98 cursor-pointer text-xs font-bold"
        aria-label={`Shopping cart (${cartCount} items)`}
      >
        <ShoppingCart size={16} className="text-foreground sm:text-white" />
        <span className="hidden sm:inline">Cart</span>
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 sm:static sm:h-4 sm:min-w-4 px-1 rounded-full text-[10px] font-black text-white sm:text-slate-900 bg-brand-primary sm:bg-white flex items-center justify-center leading-none">
            {cartCount}
          </span>
        )}
      </button>

      {onOpenTracking ? (
        <button
          type="button"
          onClick={onOpenTracking}
          className="hidden sm:flex h-9 w-9 rounded-full border border-separator/70 bg-surface text-muted hover:text-foreground hover:bg-surface-elevated items-center justify-center cursor-pointer transition active:scale-95"
          aria-label="Customer account and orders"
          title="My Orders & Tracking"
        >
          <User size={16} />
        </button>
      ) : (
        <Link
          href={storeOrdersUrl}
          className="hidden sm:flex h-9 w-9 rounded-full border border-separator/70 bg-surface text-muted hover:text-foreground hover:bg-surface-elevated items-center justify-center cursor-pointer transition active:scale-95"
          aria-label="Customer account and orders"
          title="My Orders & Tracking"
        >
          <User size={16} />
        </Link>
      )}

      <ThemeToggle variant="toggle" className="h-9 w-9 rounded-full bg-surface border-separator/70 hidden sm:flex" />

      {onOpenMenu && (
        <button
          type="button"
          onClick={onOpenMenu}
          className="md:hidden h-9 w-9 rounded-full bg-surface hover:bg-surface-elevated border border-separator/70 text-muted hover:text-foreground flex items-center justify-center cursor-pointer transition active:scale-95"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>
      )}
    </div>
  );
}
