'use client';

import React from 'react';
import { StorefrontHeroSlide } from '@/types/storefront';
import { HeroFitPreview } from './HeroFitPreview';
import { HeroCoverPreview } from './HeroCoverPreview';

interface HeroSlidePreviewProps {
  slide: StorefrontHeroSlide;
  slideIndex: number;
  previewViewport: 'desktop' | 'mobile';
  primaryColor: string;
}

export function HeroSlidePreview({
  slide,
  slideIndex,
  previewViewport,
  primaryColor,
}: HeroSlidePreviewProps) {
  const contrastTheme = slide.contrast_theme || 'auto';
  const bannerSrc = slide.image_url || '/images/storefront/hero-banner-lifestyle.webp';
  const headline = slide.headline || 'Everyday Essentials.';
  const tagline = slide.tagline || 'Quality, style and comfort in one place.';
  const ctaText = slide.cta_text || 'Shop Now';
  const badgeText = slide.badge_text || 'NEW ARRIVALS';
  const pricePill = slide.price_pill || null;
  const compareAtPricePill = slide.compare_at_price_pill || null;

  const isFitMode =
    slide.image_fit === 'fit' ||
    (!slide.image_fit && slide.link_type === 'product');

  const previewProps = {
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
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-muted">
        <span>Live Storefront Preview (Slide {slideIndex + 1})</span>
        <span>{slide.is_active ? 'Visible to shoppers' : 'Hidden from storefront'}</span>
      </div>

      <div className="flex justify-center bg-zinc-950/5 dark:bg-black/40 border border-separator/80 rounded-2xl p-3 sm:p-4 overflow-hidden">
        <div
          className={`transition-all duration-300 relative rounded-2xl overflow-hidden border border-separator shadow-sm ${
            previewViewport === 'mobile' ? 'w-[360px] min-h-[220px]' : 'w-full min-h-[280px] sm:min-h-[320px]'
          }`}
        >
          {isFitMode ? <HeroFitPreview {...previewProps} /> : <HeroCoverPreview {...previewProps} />}
        </div>
      </div>
    </div>
  );
}
