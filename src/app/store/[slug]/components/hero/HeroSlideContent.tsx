'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { getSlideContrastStyles } from './hero-slide-styles';
import { HeroPriceBadge } from './HeroPriceBadge';

interface HeroSlideContentProps {
  headline: string;
  tagline: string;
  badgeText: string;
  pricePill: string | null;
  compareAtPricePill?: string | null;
  primaryCta: string;
  primaryColor: string;
  contrastTheme: 'auto' | 'light' | 'dark';
  isFitMode: boolean;
  isActive?: boolean;
  onCtaClick: () => void;
}

export function HeroSlideContent({
  headline,
  tagline,
  badgeText,
  pricePill,
  compareAtPricePill,
  primaryCta,
  primaryColor,
  contrastTheme,
  isFitMode,
  isActive = true,
  onCtaClick,
}: HeroSlideContentProps) {
  const { headlineStyle, taglineStyle, badgeStyle } = getSlideContrastStyles(contrastTheme);

  const getTransition = (delayMs: number) => ({
    className: `transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
      isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
    }`,
    style: { transitionDelay: isActive ? `${delayMs}ms` : '0ms' },
  });

  const badgeProps = getTransition(60);
  const headlineProps = getTransition(120);
  const taglineProps = getTransition(180);
  const ctaProps = getTransition(240);

  const badgeTextClass = contrastTheme === 'light'
    ? 'text-slate-950'
    : contrastTheme === 'dark'
      ? 'text-white drop-shadow-xs'
      : isFitMode
        ? 'text-slate-900 dark:text-zinc-100'
        : 'text-white drop-shadow-xs';

  const headlineClass = isFitMode
    ? contrastTheme === 'light'
      ? 'text-slate-950'
      : contrastTheme === 'dark'
        ? 'text-white'
        : 'text-slate-900 dark:text-white'
    : contrastTheme === 'light'
      ? 'text-slate-950'
      : 'text-white drop-shadow-md';

  const taglineClass = isFitMode
    ? contrastTheme === 'light'
      ? 'text-slate-800'
      : contrastTheme === 'dark'
        ? 'text-zinc-200'
        : 'text-slate-600 dark:text-zinc-300'
    : contrastTheme === 'light'
      ? 'text-slate-800 font-medium'
      : 'text-slate-100/90 font-medium drop-shadow-xs';

  const containerClass = isFitMode
    ? 'flex-1 w-full max-w-xl px-5 sm:px-8 lg:px-14 pt-1 pb-10 sm:py-6 lg:py-10 z-10 space-y-2 sm:space-y-3.5 order-2 md:order-1 flex flex-col justify-center'
    : 'relative z-10 p-6 sm:p-10 lg:p-14 max-w-xl sm:max-w-2xl space-y-3 sm:space-y-4';

  const headlineSize = isFitMode
    ? 'text-lg sm:text-2xl md:text-4xl lg:text-[46px]'
    : 'text-2xl sm:text-4xl md:text-5xl lg:text-6xl';

  return (
    <div className={containerClass}>
      <div {...badgeProps} className={`flex items-center gap-2 sm:gap-2.5 flex-wrap ${badgeProps.className}`}>
        <span
          style={badgeStyle}
          className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] sm:tracking-[0.25em] inline-block ${badgeTextClass}`}
        >
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

      <h1
        {...headlineProps}
        style={{ ...headlineStyle, ...headlineProps.style }}
        className={`${headlineSize} font-black tracking-tight sm:tracking-[-0.03em] leading-[1.15] sm:leading-[1.08] line-clamp-2 ${headlineProps.className} ${headlineClass}`}
      >
        {headline}
      </h1>

      <p
        {...taglineProps}
        style={{ ...taglineStyle, ...taglineProps.style }}
        className={`text-[11px] sm:text-xs lg:text-base leading-relaxed line-clamp-2 max-w-xs sm:max-w-md ${taglineProps.className} ${taglineClass}`}
      >
        {tagline}
      </p>

      <div {...ctaProps} className={`pt-1 sm:pt-2 ${ctaProps.className}`}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCtaClick();
          }}
          className="inline-flex items-center gap-1.5 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          <span>{primaryCta}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
