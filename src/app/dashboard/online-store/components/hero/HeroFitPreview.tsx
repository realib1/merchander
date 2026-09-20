'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { HeroPriceBadge } from '@/app/store/[slug]/components/hero/HeroPriceBadge';

interface HeroFitPreviewProps {
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

export function HeroFitPreview({
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
}: HeroFitPreviewProps) {
  const badgeTextClass = contrastTheme === 'light'
    ? 'text-slate-950'
    : contrastTheme === 'dark'
      ? 'text-white'
      : 'text-slate-900 dark:text-zinc-100';

  const headlineColorClass = contrastTheme === 'light'
    ? 'text-slate-950'
    : contrastTheme === 'dark'
      ? 'text-white'
      : 'text-slate-900 dark:text-white';

  const taglineColorClass = contrastTheme === 'light'
    ? 'text-slate-800'
    : contrastTheme === 'dark'
      ? 'text-zinc-200'
      : 'text-slate-600 dark:text-zinc-300';

  return (
    <div
      className={`relative w-full h-full min-h-[280px] sm:min-h-[320px] flex ${
        previewViewport === 'mobile'
          ? 'flex-col justify-between p-4'
          : 'flex-row items-center justify-between p-6 sm:p-8'
      } bg-gradient-to-br from-slate-100 via-stone-50 to-slate-100 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-950`}
    >
      <div
        className={`space-y-2 z-10 ${
          previewViewport === 'mobile' ? 'w-full order-2' : 'max-w-[58%] order-1'
        }`}
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] inline-block ${badgeTextClass}`}>
            {badgeText}
          </span>
          {(pricePill || compareAtPricePill) && (
            <span className="text-slate-400 dark:text-zinc-500 text-[10px] font-bold select-none">•</span>
          )}
          <HeroPriceBadge
            pricePill={pricePill}
            compareAtPricePill={compareAtPricePill}
            contrastTheme={contrastTheme}
          />
        </div>

        <h4
          className={`font-black leading-tight tracking-tight line-clamp-2 ${
            previewViewport === 'mobile' ? 'text-base' : 'text-2xl sm:text-3xl'
          } ${headlineColorClass}`}
        >
          {headline}
        </h4>

        <p className={`line-clamp-2 leading-relaxed ${previewViewport === 'mobile' ? 'text-[11px]' : 'text-xs sm:text-sm'} ${taglineColorClass}`}>
          {tagline}
        </p>

        <div className="pt-1">
          <span
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-xs"
            style={{ backgroundColor: primaryColor }}
          >
            <span>{ctaText}</span>
            <ArrowRight size={12} />
          </span>
        </div>
      </div>

      <div
        className={`flex items-center justify-center relative z-10 ${
          previewViewport === 'mobile' ? 'w-full order-1 py-1' : 'w-[36%] order-2'
        }`}
      >
        <div className="w-36 h-36 rounded-full bg-brand-primary/10 dark:bg-brand-primary/15 blur-2xl absolute pointer-events-none" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bannerSrc}
          alt="Product preview"
          className={`relative z-10 w-auto object-contain drop-shadow-xl transition-transform hover:scale-105 pointer-events-none ${
            previewViewport === 'mobile' ? 'max-h-[95px]' : 'max-h-[160px] sm:max-h-[180px]'
          }`}
        />
      </div>
    </div>
  );
}
