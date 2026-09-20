'use client';

import React from 'react';
import Link from 'next/link';
import { Tag, Flame, ArrowRight } from 'lucide-react';
import { StorefrontCategory, StorefrontProduct, StorefrontConfig } from '@/types/storefront';
import { slugify } from '@/utils/format';

interface StorePromotionSpotlightsProps {
  slug: string;
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
  primaryColor: string;
  config?: StorefrontConfig;
}

export function StorePromotionSpotlights({
  slug,
  categories,
  products,
  primaryColor,
  config,
}: StorePromotionSpotlightsProps) {
  const spotOne = config?.spotlight_one;
  const spotTwo = config?.spotlight_two;

  const firstCategory = categories[0];
  const secondCategory = categories[1];

  const firstCardProduct = firstCategory
    ? products.find((p) => p.category_id === firstCategory.id && p.image_url) || products[0]
    : products[0];

  const secondCardProduct = secondCategory
    ? products.find((p) => p.category_id === secondCategory.id && p.image_url) || products[1] || products[0]
    : products[1] || products[0];

  const spotOneHeadline = spotOne?.headline || (firstCategory ? firstCategory.name : 'Stay Hydrated.');
  const spotOneTagline =
    spotOne?.tagline ||
    (firstCategory ? `Explore our ${firstCategory.name} collection.` : 'Durable. Stylish. Everyday essentials.');
  const spotOneImage = spotOne?.image_url || firstCardProduct?.image_url;
  const spotOneCta = spotOne?.cta_text || 'Shop Now';
  const spotOneLink =
    spotOne?.link_url ||
    (firstCategory ? `/store/${slug}/categories/${slugify(firstCategory.name)}` : `/store/${slug}#store-catalog-section`);

  const spotTwoHeadline = spotTwo?.headline || (secondCategory ? secondCategory.name : 'Caps for every mood.');
  const spotTwoTagline =
    spotTwo?.tagline ||
    (secondCategory ? `Browse top picks in ${secondCategory.name}.` : 'Simple. Classic. Always made for comfort.');
  const spotTwoImage = spotTwo?.image_url || secondCardProduct?.image_url;
  const spotTwoCta = spotTwo?.cta_text || 'Shop Now';
  const spotTwoLink =
    spotTwo?.link_url ||
    (secondCategory ? `/store/${slug}/categories/${slugify(secondCategory.name)}` : `/store/${slug}#store-catalog-section`);

  const spotOneImageFit = spotOne?.image_fit || 'fit';
  const spotTwoImageFit = spotTwo?.image_fit || 'fit';

  return (
    <div className="space-y-5 select-none">
      {/* Promo Card 1: Featured Spotlight */}
      {spotOneImageFit === 'cover' && spotOneImage ? (
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl min-h-[220px] sm:min-h-[240px] flex items-center p-5 sm:p-6 shadow-sm group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spotOneImage}
            alt={spotOneHeadline}
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-sm space-y-2 pr-2 sm:pr-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-300 drop-shadow-sm">
              <Tag size={12} />
              <span>Featured Spotlight</span>
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight break-words drop-shadow-md">
              {spotOneHeadline}
            </h3>
            <p className="text-xs text-zinc-200 leading-relaxed line-clamp-2 break-words drop-shadow-sm">
              {spotOneTagline}
            </p>
            <div className="pt-2">
              <Link
                href={spotOneLink}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition hover:brightness-110 active:scale-95 whitespace-nowrap"
                style={{ backgroundColor: primaryColor }}
              >
                <span>{spotOneCta}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#0e0e10] text-white p-5 sm:p-6 shadow-sm group">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0 pr-2 sm:pr-3 space-y-2 z-10">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <Tag size={12} />
                <span>Featured Spotlight</span>
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight break-words">
                {spotOneHeadline}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 break-words">
                {spotOneTagline}
              </p>
              <div className="pt-2">
                <Link
                  href={spotOneLink}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition hover:brightness-110 active:scale-95 whitespace-nowrap"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>{spotOneCta}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {spotOneImage && (
              <div className="w-24 sm:w-28 md:w-32 aspect-square shrink-0 flex items-center justify-center pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={spotOneImage}
                  alt={spotOneHeadline}
                  className="max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Promo Card 2: Popular Edit */}
      {spotTwoImageFit === 'cover' && spotTwoImage ? (
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl min-h-[220px] sm:min-h-[240px] flex items-center p-5 sm:p-6 shadow-sm group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spotTwoImage}
            alt={spotTwoHeadline}
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-sm space-y-2 pr-2 sm:pr-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-300 drop-shadow-sm">
              <Flame size={12} className="text-amber-400" />
              <span>Popular Edit</span>
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight break-words drop-shadow-md">
              {spotTwoHeadline}
            </h3>
            <p className="text-xs text-zinc-200 leading-relaxed line-clamp-2 break-words drop-shadow-sm">
              {spotTwoTagline}
            </p>
            <div className="pt-2">
              <Link
                href={spotTwoLink}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition hover:brightness-110 active:scale-95 whitespace-nowrap"
                style={{ backgroundColor: primaryColor }}
              >
                <span>{spotTwoCta}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-surface border border-separator/70 text-foreground p-5 sm:p-6 shadow-2xs group">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0 pr-2 sm:pr-3 space-y-1.5 z-10">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">
                <Flame size={12} className="text-amber-500" />
                <span>Popular Edit</span>
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground leading-tight break-words">
                {spotTwoHeadline}
              </h3>
              <p className="text-xs text-muted leading-relaxed line-clamp-2 break-words">
                {spotTwoTagline}
              </p>
              <div className="pt-2">
                <Link
                  href={spotTwoLink}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition hover:brightness-110 active:scale-95 whitespace-nowrap"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>{spotTwoCta}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {spotTwoImage && (
              <div className="w-24 sm:w-28 md:w-32 aspect-square shrink-0 flex items-center justify-center pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={spotTwoImage}
                  alt={spotTwoHeadline}
                  className="max-h-full max-w-full object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
