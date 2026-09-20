'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, LucideIcon } from 'lucide-react';

interface CategoryDetailHeaderProps {
  slug: string;
  categoryName: string;
  subtitle?: string;
  icon: LucideIcon;
  totalProducts: number;
  primaryColor: string;
}

export function CategoryDetailHeader({
  slug,
  categoryName,
  subtitle,
  icon: IconComponent,
  totalProducts,
  primaryColor,
}: CategoryDetailHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted">
        <Link href={`/store/${slug}`} className="hover:text-foreground transition">
          Home
        </Link>
        <span>/</span>
        <Link href={`/store/${slug}/categories`} className="hover:text-foreground transition">
          Categories
        </Link>
        <span>/</span>
        <span className="text-foreground font-semibold">{categoryName}</span>
      </nav>

      {/* Mobile Back Link */}
      <div className="lg:hidden flex items-center justify-between">
        <Link
          href={`/store/${slug}/categories`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-foreground transition py-1"
        >
          <ChevronLeft size={16} />
          <span>Back to Categories</span>
        </Link>
      </div>

      {/* Title & Subtitle Banner */}
      <div className="rounded-2xl sm:rounded-3xl border border-separator/80 bg-surface p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                <IconComponent size={20} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {categoryName}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-elevated text-muted font-bold">
                {totalProducts} {totalProducts === 1 ? 'Product' : 'Products'}
              </span>
            </div>
            {subtitle && <p className="text-xs sm:text-sm text-muted leading-relaxed">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
