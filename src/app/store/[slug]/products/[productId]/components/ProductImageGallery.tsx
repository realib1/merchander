'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  children?: React.ReactNode;
}

export function ProductImageGallery({ images, productName, children }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = images.length > 1;

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

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
      <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-surface-elevated border border-separator/80 shadow-xs flex items-center justify-center text-muted">
        <ShoppingBag size={64} className="opacity-30" />
        {children}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Active Image View (Universal across Mobile & Desktop) */}
      <div
        className="relative aspect-square w-full rounded-3xl overflow-hidden bg-surface-elevated border border-separator/80 shadow-xs select-none group"
        role="region"
        aria-label={`Product image ${activeIndex + 1} of ${images.length}`}
      >
        <Image
          key={images[activeIndex]}
          src={images[activeIndex]}
          alt={`${productName} — Image ${activeIndex + 1}`}
          fill
          priority={activeIndex === 0}
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, 600px"
        />

        {/* Prev / Next Navigation Arrows */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full bg-surface/85 backdrop-blur-md border border-separator/70 text-foreground hover:bg-surface shadow-xs cursor-pointer transition active:scale-95 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full bg-surface/85 backdrop-blur-md border border-separator/70 text-foreground hover:bg-surface shadow-xs cursor-pointer transition active:scale-95 z-10"
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Image Counter Badge */}
        {hasMultiple && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold tabular-nums z-10">
            {activeIndex + 1} / {images.length}
          </div>
        )}

        {children}
      </div>

      {/* Universal Thumbnail Strip (Mobile & Desktop) */}
      {hasMultiple && (
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {images.map((url, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={url}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                  isSelected
                    ? 'border-brand-primary ring-1.5 ring-brand-primary/30 shadow-2xs scale-102'
                    : 'border-separator hover:border-separator/90 opacity-70 hover:opacity-100'
                }`}
                aria-label={`View image ${idx + 1}`}
              >
                <Image
                  src={url}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
