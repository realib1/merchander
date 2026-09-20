'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StorefrontConfig } from '@/types/storefront';
import { getBusinessInitials } from '@/utils/format';
import { StoreNavbarActions } from './StoreNavbarActions';

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
  const pathname = usePathname();
  const primaryColor = config.primary_color || '#f97316';
  const storeHomeUrl = `/store/${config.slug}`;
  const storeOrdersUrl = `/store/${config.slug}/orders`;
  const isHomePage = Boolean(pathname && (pathname === storeHomeUrl || pathname === `${storeHomeUrl}/`));
  const isCategoriesPage = Boolean(pathname && pathname.includes(`/store/${config.slug}/categories`));

  const [logoError, setLogoError] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-separator/70 bg-background/95 backdrop-blur-md transition-all"
      style={{ '--color-brand-primary': primaryColor, '--brand-primary': primaryColor } as React.CSSProperties}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-surface focus:text-foreground focus:top-0 focus:left-0 focus:outline-none focus:ring-2 focus:ring-brand-primary"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        {/* 1. Brand Identity */}
        <div className="flex items-center gap-6 min-w-0">
          <Link href={storeHomeUrl} className="flex items-center gap-2.5 min-w-0 group">
            {config.logo_url && !logoError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.logo_url}
                alt={config.store_name}
                onError={() => setLogoError(true)}
                className="h-8 sm:h-9 w-auto max-h-8 sm:max-h-9 max-w-32 sm:max-w-44 object-contain shrink-0 rounded-md group-hover:opacity-90 transition"
              />
            ) : (
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center overflow-hidden shrink-0 rounded-xl font-black font-display text-white text-xs sm:text-sm shadow-xs select-none group-hover:scale-105 transition-transform"
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

          {/* Desktop Navigation Links: Shop, Categories, Collections, About */}
          <nav className="hidden lg:flex items-center gap-1.5 ml-2">
            <Link
              href={`${storeHomeUrl}#store-catalog-section`}
              className={`relative px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                isHomePage ? 'text-brand-primary' : 'text-muted hover:text-foreground'
              }`}
            >
              <span>Shop</span>
              {isHomePage && (
                <span
                  className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </Link>

            <Link
              href={`/store/${config.slug}/categories`}
              className={`relative px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                isCategoriesPage ? 'text-brand-primary' : 'text-muted hover:text-foreground'
              }`}
            >
              <span>Categories</span>
              {isCategoriesPage && (
                <span
                  className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </Link>

            {config.show_collections && (
              <Link
                href={`/store/${config.slug}/categories#collections`}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-muted hover:text-foreground transition cursor-pointer"
              >
                Collections
              </Link>
            )}

            <Link
              href="/about"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-muted hover:text-foreground transition cursor-pointer"
            >
              About
            </Link>
          </nav>
        </div>

        {/* 2. Center-Right Search Capsule & Actions */}
        <StoreNavbarActions
          primaryColor={primaryColor}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          storeOrdersUrl={storeOrdersUrl}
          onOpenCart={onOpenCart}
          onOpenWishlist={onOpenWishlist}
          onOpenMenu={onOpenMenu}
          onOpenSearch={onOpenSearch}
          onOpenTracking={onOpenTracking}
        />
      </div>
    </header>
  );
}
