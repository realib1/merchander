'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, LayoutGrid, Heart, User } from 'lucide-react';

interface StoreBottomNavProps {
  storeSlug: string;
  cartCount?: number;
  wishlistCount: number;
  primaryColor?: string;
  onOpenCart?: () => void;
  onOpenWishlist: () => void;
  onOpenAccount?: () => void;
  onScrollToCatalog?: () => void;
}

export function StoreBottomNav({
  storeSlug,
  wishlistCount,
  primaryColor = '#f97316',
  onOpenWishlist,
  onOpenAccount,
  onScrollToCatalog,
}: StoreBottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isCategoriesActive = pathname?.includes(`/store/${storeSlug}/categories`);
  const isOrdersActive = pathname?.includes(`/store/${storeSlug}/orders`);
  const isHomeActive = !isCategoriesActive && !isOrdersActive;

  const handleHomeClick = () => {
    if (pathname === `/store/${storeSlug}`) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      router.push(`/store/${storeSlug}`);
    }
  };

  const handleCategoriesClick = () => {
    if (pathname === `/store/${storeSlug}/categories`) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (onScrollToCatalog && pathname === `/store/${storeSlug}`) {
      router.push(`/store/${storeSlug}/categories`);
    } else {
      router.push(`/store/${storeSlug}/categories`);
    }
  };

  const handleAccountClick = () => {
    if (onOpenAccount) {
      onOpenAccount();
    } else {
      router.push(`/store/${storeSlug}/orders`);
    }
  };

  return (
    <aside
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/92 backdrop-blur-xl border-t border-separator/80 pb-safe transition-colors shadow-xl"
    >
      <nav className="flex items-center justify-around h-15 px-2">
        {/* 1. Home */}
        <button
          type="button"
          onClick={handleHomeClick}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors cursor-pointer active:scale-95 ${
            isHomeActive ? 'font-semibold' : 'text-muted hover:text-foreground'
          }`}
          aria-label="Scroll to home"
        >
          <Home size={19} style={{ color: isHomeActive ? primaryColor : undefined }} />
          <span
            className="text-[10px] tracking-tight"
            style={{ color: isHomeActive ? primaryColor : undefined }}
          >
            Home
          </span>
        </button>

        {/* 2. Categories (Active Style matching Screen 3) */}
        <button
          type="button"
          onClick={handleCategoriesClick}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors cursor-pointer active:scale-95 ${
            isCategoriesActive ? 'font-semibold' : 'text-muted hover:text-foreground'
          }`}
          aria-label="View categories"
        >
          <LayoutGrid size={19} style={{ color: isCategoriesActive ? primaryColor : undefined }} />
          <span
            className="text-[10px] tracking-tight"
            style={{ color: isCategoriesActive ? primaryColor : undefined }}
          >
            Categories
          </span>
        </button>

        {/* 3. Wishlist */}
        <button
          type="button"
          onClick={onOpenWishlist}
          className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-muted hover:text-foreground transition-colors cursor-pointer active:scale-95"
          aria-label={`Wishlist (${wishlistCount} items)`}
        >
          <div className="relative">
            <Heart size={19} className={wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : ''} />
            {wishlistCount > 0 && (
              <span
                className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center leading-none"
                style={{ backgroundColor: primaryColor }}
              >
                {wishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight">Wishlist</span>
        </button>

        {/* 4. Account */}
        <button
          type="button"
          onClick={handleAccountClick}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors cursor-pointer active:scale-95 ${
            isOrdersActive ? 'font-semibold' : 'text-muted hover:text-foreground'
          }`}
          aria-label="Customer Account & Orders"
        >
          <User size={19} style={{ color: isOrdersActive ? primaryColor : undefined }} />
          <span
            className="text-[10px] tracking-tight"
            style={{ color: isOrdersActive ? primaryColor : undefined }}
          >
            Account
          </span>
        </button>
      </nav>
    </aside>
  );
}
