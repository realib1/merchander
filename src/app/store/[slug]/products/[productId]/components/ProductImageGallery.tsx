'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  /** Overlay content (badges, action buttons) rendered on top of the active image */
  children?: React.ReactNode;
}

export function ProductImageGallery({ images, productName, children }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasMultiple = images.length > 1;

  // Sync scroll position to active index on mobile
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.offsetWidth;
    const newIndex = Math.round(scrollLeft / itemWidth);
    if (newIndex >= 0 && newIndex < images.length && newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  }, [images.length, activeIndex]);

  // Thumbnail click scrolls the mobile strip to the correct image
  const scrollToIndex = useCallback((index: number) => {
    setActiveIndex(index);
    const container = scrollRef.current;
    if (container) {
      container.scrollTo({ left: index * container.offsetWidth, behavior: 'smooth' });
    }
  }, []);

  const goNext = useCallback(
    () => scrollToIndex((activeIndex + 1) % images.length),
    [activeIndex, images.length, scrollToIndex]
  );
  const goPrev = useCallback(
    () => scrollToIndex((activeIndex - 1 + images.length) % images.length),
    [activeIndex, images.length, scrollToIndex]
  );

  // Keyboard nav
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  if (images.length === 0) {
    return (
      <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-surface-elevated border border-separator/80 shadow-xs">
        <div className="w-full h-full flex items-center justify-center text-muted">
          <ShoppingBag size={64} />
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Mobile: Full-width horizontal scroll strip (snap scroll, like Jumia/Amazon) ── */}
      <div className="sm:hidden relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar rounded-3xl border border-separator/80 shadow-xs"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {images.map((url, idx) => (
            <div key={url} className="relative aspect-square w-full shrink-0 snap-center bg-surface-elevated">
              <Image
                src={url}
                alt={`${productName} — Image ${idx + 1}`}
                fill
                priority={idx === 0}
                className="object-cover"
                sizes="100vw"
              />
            </div>
          ))}
        </div>

        {/* Image counter pill */}
        {hasMultiple && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-xs text-white text-[10px] font-bold">
            {activeIndex + 1} / {images.length}
          </div>
        )}

        {/* Overlays (badges, wishlist/share buttons) */}
        {children}
      </div>

      {/* ── Desktop: Single active image with arrows ── */}
      <div
        className="hidden sm:block relative aspect-square w-full rounded-3xl overflow-hidden bg-surface-elevated border border-separator/80 shadow-xs select-none"
        role="region"
        aria-label={`Product image ${activeIndex + 1} of ${images.length}`}
        aria-roledescription="carousel"
      >
        <Image
          key={images[activeIndex]}
          src={images[activeIndex]}
          alt={`${productName} — Image ${activeIndex + 1}`}
          fill
          priority={activeIndex === 0}
          className="object-cover animate-fade-in"
          sizes="500px"
        />

        {/* Prev / Next Arrows */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-surface/80 backdrop-blur-md border border-separator/60 text-foreground hover:bg-surface shadow-xs cursor-pointer transition active:scale-95"
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-surface/80 backdrop-blur-md border border-separator/60 text-foreground hover:bg-surface shadow-xs cursor-pointer transition active:scale-95"
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Image Counter */}
        {hasMultiple && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
            {activeIndex + 1} / {images.length}
          </div>
        )}

        {/* Overlays (badges, wishlist/share buttons) */}
        {children}
      </div>

      {/* ── Desktop Thumbnail Strip ── */}
      {hasMultiple && (
        <div className="hidden sm:flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {images.map((url, idx) => (
            <button
              key={url}
              type="button"
              onClick={() => scrollToIndex(idx)}
              className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                idx === activeIndex
                  ? 'border-brand-primary ring-2 ring-brand-primary/30'
                  : 'border-separator hover:border-brand-primary/50'
              }`}
              aria-label={`View image ${idx + 1}`}
            >
              <Image src={url} alt={`${productName} thumbnail ${idx + 1}`} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
