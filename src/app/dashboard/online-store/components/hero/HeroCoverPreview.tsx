'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { HeroPriceBadge } from '@/app/store/[slug]/components/hero/HeroPriceBadge';

interface HeroCoverPreviewProps {
  previewViewport: 'desktop' | 'mobile';
  contrastTheme: 'auto' | 'light' | 'dark';
  badgeText: string;
  pricePill: string | null;
  compareAtPricePill: string | null;
  headline: string;
  tagline: string;
  ctaText: string;
  bannerSrc: string;
  primaryColor: string;
}

export function HeroCoverPreview({
  previewViewport,
  contrastTheme,
  badgeText,
  pricePill,
  compareAtPricePill,
  headline,
  tagline,
  ctaText,
  bannerSrc,
  primaryColor,
}: HeroCoverPreviewProps) {
  return (
    <div className="relative w-full h-full min-h-[280px] sm:min-h-[320px] flex items-center overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bannerSrc}
        alt="Banner preview"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-300 ${
          contrastTheme === 'light'
            ? 'bg-gradient-to-r from-white/95 via-white/75 sm:via-white/50 to-transparent'
            : 'bg-gradient-to-r from-black/90 via-black/60 sm:via-black/40 to-transparent'
        }`}
      />
      <div
        className={`relative z-10 p-5 sm:p-7 max-w-md space-y-2.5 ${
          previewViewport === 'mobile' ? 'w-full' : 'max-w-[70%]'
        }`}
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] inline-block ${
              contrastTheme === 'light' ? 'text-slate-950' : 'text-white drop-shadow-xs'
            }`}
          >
            {badgeText}
          </span>
          {(pricePill || compareAtPricePill) && (
            <span className="text-white/60 text-[10px] font-bold select-none">•</span>
          )}
          <HeroPriceBadge
            pricePill={pricePill}
            compareAtPricePill={compareAtPricePill}
            contrastTheme={contrastTheme}
          />
        </div>

        <h4
          className={`font-black leading-tight tracking-tight line-clamp-2 ${
            previewViewport === 'mobile' ? 'text-base' : 'text-xl sm:text-2xl'
          } ${
            contrastTheme === 'light' ? 'text-slate-950' : 'text-white drop-shadow-md'
          }`}
        >
          {headline}
        </h4>

        <p
          className={`line-clamp-2 leading-relaxed ${
            previewViewport === 'mobile' ? 'text-[11px]' : 'text-xs'
          } ${
            contrastTheme === 'light' ? 'text-slate-800 font-medium' : 'text-slate-100/90 font-medium drop-shadow-xs'
          }`}
        >
          {tagline}
        </p>

        <div className="pt-1">
          <span
            className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            <span>{ctaText}</span>
            <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </div>
  );
}
