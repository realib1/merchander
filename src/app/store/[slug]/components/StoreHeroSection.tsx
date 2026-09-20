'use client';

import React, { useState } from 'react';
import { StorefrontConfig, StorefrontProduct, StorefrontHeroSlide } from '@/types/storefront';
import { resolveActiveHeroSlides } from '@/utils/storefront';
import { useHeroCarousel } from './hero/useHeroCarousel';
import { HeroSlideContent } from './hero/HeroSlideContent';
import { HeroSlideImage } from './hero/HeroSlideImage';
import { HeroCarouselControls } from './hero/HeroCarouselControls';

interface StoreHeroSectionProps {
  config: StorefrontConfig;
  featuredProducts?: StorefrontProduct[];
  products?: StorefrontProduct[];
  onSelectProduct?: (product: StorefrontProduct) => void;
  onSelectCategory?: (categoryId: string) => void;
}

export function StoreHeroSection({
  config,
  featuredProducts = [],
  products = [],
  onSelectProduct,
  onSelectCategory,
}: StoreHeroSectionProps) {
  const primaryColor = config.primary_color || '#f97316';
  const slides = resolveActiveHeroSlides(config);

  const {
    currentSlideIndex, previousSlideIndex, direction, isPaused,
    setCurrentSlideIndex, setIsPaused, handlePrev, handleNext,
  } = useHeroCarousel(slides);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const scrollToCatalog = () => {
    const el = document.getElementById('store-catalog-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCtaClick = (slide: StorefrontHeroSlide) => {
    if (slide.link_type === 'product' && slide.link_id) {
      const targetProduct = [...featuredProducts, ...products].find((p) => p.id === slide.link_id);
      if (targetProduct && onSelectProduct) return onSelectProduct(targetProduct);
    } else if (slide.link_type === 'category' && slide.link_id) {
      if (onSelectCategory) return onSelectCategory(slide.link_id);
    }
    scrollToCatalog();
  };

  const handleSlideClick = (slide: StorefrontHeroSlide) => {
    if (isSwiping) return;
    handleCtaClick(slide);
  };

  const handleTouchStart = (e: React.TouchEvent) => { setTouchStartX(e.touches[0].clientX); setIsSwiping(false); };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      setIsSwiping(true);
      if (diff > 0) handleNext(); else handlePrev();
      setTimeout(() => setIsSwiping(false), 250);
    }
    setTouchStartX(null);
  };

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4"
      aria-label="Hero Showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 dark:border-zinc-800 h-[390px] sm:h-[410px] md:h-[420px] lg:h-[440px] shadow-xs sm:shadow-sm group select-none bg-slate-900">
        {slides.map((slide, idx) => {
          const isActive = idx === currentSlideIndex;
          const isPrevious = idx === previousSlideIndex && !isActive;
          const isFitMode = slide.image_fit === 'fit' || (!slide.image_fit && slide.link_type === 'product');
          const isLinked = Boolean((slide.link_type === 'product' || slide.link_type === 'category') && slide.link_id);
          const bannerSrc = slide.image_url || config.banner_url || '/images/storefront/hero-banner-lifestyle.webp';
          const contrastTheme = slide.contrast_theme || 'auto';

          let stateClass = 'opacity-0 pointer-events-none scale-[0.98]';
          if (isActive) {
            stateClass = 'opacity-100 pointer-events-auto scale-100 translate-x-0 z-10';
          } else if (isPrevious) {
            stateClass = direction === 'next'
              ? 'opacity-0 pointer-events-none scale-[0.98] -translate-x-6 z-0'
              : 'opacity-0 pointer-events-none scale-[0.98] translate-x-6 z-0';
          }

          return (
            <div
              key={slide.id || idx}
              aria-hidden={!isActive}
              role={isLinked ? 'link' : undefined}
              tabIndex={isActive && isLinked ? 0 : undefined}
              onKeyDown={isActive && isLinked ? (e) => { if (e.key === 'Enter') handleSlideClick(slide); } : undefined}
              onClick={isActive && isLinked ? () => handleSlideClick(slide) : undefined}
              className={`absolute inset-0 w-full h-full flex ${
                isFitMode
                  ? 'flex-col md:flex-row items-center justify-between bg-gradient-to-br from-slate-100 via-stone-50 to-slate-100 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-950'
                  : 'items-center overflow-hidden bg-zinc-950'
              } transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${stateClass} ${
                isActive && isLinked ? 'cursor-pointer' : ''
              }`}
            >
              <HeroSlideContent
                headline={slide.headline || config.tagline || 'Everyday Essentials.'}
                tagline={slide.tagline || config.bio || 'Quality, style and comfort in one place.'}
                badgeText={slide.badge_text || 'NEW ARRIVALS'}
                pricePill={slide.price_pill || null}
                compareAtPricePill={slide.compare_at_price_pill || null}
                primaryCta={slide.cta_text || 'Shop Now'}
                primaryColor={primaryColor}
                contrastTheme={contrastTheme}
                isFitMode={isFitMode}
                isActive={isActive}
                onCtaClick={() => handleCtaClick(slide)}
              />

              <HeroSlideImage bannerSrc={bannerSrc} isFitMode={isFitMode} contrastTheme={contrastTheme} isActive={isActive} />
            </div>
          );
        })}

        <HeroCarouselControls
          slides={slides}
          currentSlideIndex={currentSlideIndex}
          primaryColor={primaryColor}
          isPaused={isPaused}
          onPrev={handlePrev}
          onNext={handleNext}
          onSelectSlide={setCurrentSlideIndex}
        />
      </div>
    </section>
  );
}
