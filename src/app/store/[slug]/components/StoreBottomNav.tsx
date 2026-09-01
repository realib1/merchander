'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, LayoutGrid, Heart, ShoppingCart } from 'lucide-react';

interface StoreBottomNavProps {
  storeSlug: string;
  cartCount: number;
  wishlistCount: number;
  primaryColor?: string;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onScrollToCatalog?: () => void;
}

export function StoreBottomNav({
  storeSlug,
  cartCount,
  wishlistCount,
  primaryColor = '#3b82f6',
  onOpenCart,
  onOpenWishlist,
  onScrollToCatalog,
}: StoreBottomNavProps) {
  const router = useRouter();

  const handleHomeClick = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCatalogClick = () => {
    if (onScrollToCatalog) {
      onScrollToCatalog();
    } else if (typeof window !== 'undefined') {
      const catalogEl = document.getElementById('store-catalog-section') || document.getElementById('store-catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push(`/store/${storeSlug}#store-catalog-section`);
      }
    }
  };

  return (
    <aside
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-separator/80 pb-safe transition-colors shadow-xl"
    >
      <nav className="flex items-center justify-around h-15 px-2">
        {/* 1. Home */}
        <button
          type="button"
          onClick={handleHomeClick}
          className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-muted hover:text-foreground transition-colors cursor-pointer active:scale-95"
          aria-label="Scroll to home"
        >
          <Home size={19} />
          <span className="text-[10px] font-medium tracking-tight">Home</span>
        </button>

        {/* 2. Shop / Catalog */}
        <button
          type="button"
          onClick={handleCatalogClick}
          className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-muted hover:text-foreground transition-colors cursor-pointer active:scale-95"
          aria-label="View catalog"
        >
          <LayoutGrid size={19} />
          <span className="text-[10px] font-medium tracking-tight">Shop</span>
        </button>

        {/* 3. Wishlist */}
        <button
          type="button"
          onClick={onOpenWishlist}
          className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-muted hover:text-foreground transition-colors cursor-pointer active:scale-95"
          aria-label={`Wishlist (${wishlistCount} items)`}
        >
          <div className="relative">
            <Heart size={19} className={wishlistCount > 0 ? 'text-danger fill-danger' : ''} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {wishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight">Wishlist</span>
        </button>

        {/* 4. Cart / Bag */}
        <button
          type="button"
          onClick={onOpenCart}
          className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-muted hover:text-foreground transition-colors cursor-pointer active:scale-95"
          aria-label={`Shopping bag (${cartCount} items)`}
        >
          <div className="relative">
            <ShoppingCart size={19} style={cartCount > 0 ? { color: primaryColor } : undefined} />
            {cartCount > 0 && (
              <span
                className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight">Cart</span>
        </button>
      </nav>
    </aside>
  );
}
