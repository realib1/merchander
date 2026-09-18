'use client';

import React from 'react';
import Link from 'next/link';
import { BadgeCheck, Grid2X2, Headphones, House, Shirt, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import { StorefrontCategory, StorefrontProduct } from '@/types/storefront';
import { formatCurrency, slugify } from '@/utils/format';

interface StoreHomeHighlightsProps {
  slug: string;
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
  primaryColor: string;
  currency: string;
}

const categoryIcons = [Shirt, ShoppingBag, Sparkles, House, Grid2X2];

export function StoreHomeHighlights({ slug, categories, products, primaryColor, currency }: StoreHomeHighlightsProps) {
  const editorialProducts = products.filter((product) => product.image_url).slice(0, 2);
  const firstProduct = editorialProducts[0];
  const secondProduct = editorialProducts[1] || firstProduct;

  return (
    <section id="store-highlights" className="mx-auto max-w-7xl space-y-8 px-4 pb-2 sm:px-6 lg:px-8" aria-label="Store highlights">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
        {categories.slice(0, 5).map((category, index) => {
          const Icon = categoryIcons[index % categoryIcons.length];
          return (
            <Link
              key={category.id}
              href={`/store/${slug}/categories/${slugify(category.name)}`}
              className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-md border border-separator/60 bg-surface px-3 py-4 text-center transition hover:-translate-y-0.5 hover:border-brand-primary/50 hover:shadow-sm"
            >
              <Icon size={22} strokeWidth={1.7} className="text-foreground transition group-hover:text-brand-primary" />
              <span className="text-xs font-semibold text-foreground">{category.name}</span>
              <span className="text-[10px] text-muted">{category.product_count} items</span>
            </Link>
          );
        })}
        <Link
          href={`/store/${slug}/search`}
          className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-brand-primary/50 bg-brand-primary/5 px-3 py-4 text-center transition hover:bg-brand-primary/10 sm:col-span-3 md:col-span-1"
        >
          <Grid2X2 size={22} className="text-brand-primary" />
          <span className="text-xs font-semibold text-foreground">All categories</span>
          <span className="text-[10px] text-muted">Browse everything</span>
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.35fr_0.85fr]">
        <Link
          href={firstProduct ? `/store/${slug}/products/${slugify(firstProduct.name)}` : `/store/${slug}/search`}
          className="group relative min-h-64 overflow-hidden rounded-md bg-[#121212] text-white"
        >
          {firstProduct?.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={firstProduct.image_url}
              alt={firstProduct.name}
              className="absolute inset-0 h-full w-full object-cover opacity-65 transition duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/45 to-transparent" />
          <div className="relative flex min-h-64 max-w-sm flex-col justify-end gap-3 p-6 sm:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">Everyday essentials</p>
            <h2 className="text-2xl font-black leading-tight tracking-[-0.035em] sm:text-3xl">Stay ready for every order.</h2>
            <p className="text-xs leading-relaxed text-white/75">Durable pieces, thoughtful details, and easy delivery across Ghana.</p>
            <span className="inline-flex w-fit rounded-full px-4 py-2 text-[11px] font-bold text-white" style={{ backgroundColor: primaryColor }}>
              Shop essentials
            </span>
          </div>
        </Link>

        <Link
          href={secondProduct ? `/store/${slug}/products/${slugify(secondProduct.name)}` : `/store/${slug}/search`}
          className="group relative min-h-64 overflow-hidden rounded-md bg-[#e8ded2]"
        >
          {secondProduct?.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={secondProduct.image_url}
              alt={secondProduct.name}
              className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
          <div className="relative flex min-h-64 flex-col justify-end gap-2 p-6 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/75">Fresh picks</p>
            <h2 className="text-2xl font-black tracking-[-0.035em]">Find your next favorite.</h2>
            {secondProduct && <p className="text-xs font-semibold text-white/80">From {formatCurrency(secondProduct.min_price, currency)}</p>}
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-3 divide-x divide-separator border-y border-separator/70 py-5">
        <div className="flex flex-col items-center gap-2 px-3 text-center sm:flex-row sm:justify-center sm:text-left">
          <Truck size={21} className="text-brand-primary" />
          <span className="text-[11px] font-semibold text-foreground">Fast delivery<span className="hidden font-normal text-muted sm:block">Across Ghana</span></span>
        </div>
        <div className="flex flex-col items-center gap-2 px-3 text-center sm:flex-row sm:justify-center sm:text-left">
          <BadgeCheck size={21} className="text-brand-primary" />
          <span className="text-[11px] font-semibold text-foreground">Secure payments<span className="hidden font-normal text-muted sm:block">Multiple options</span></span>
        </div>
        <div className="flex flex-col items-center gap-2 px-3 text-center sm:flex-row sm:justify-center sm:text-left">
          <Headphones size={21} className="text-brand-primary" />
          <span className="text-[11px] font-semibold text-foreground">Always here<span className="hidden font-normal text-muted sm:block">Customer support</span></span>
        </div>
      </div>
    </section>
  );
}
