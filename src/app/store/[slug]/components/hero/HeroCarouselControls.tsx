'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StorefrontHeroSlide } from '@/types/storefront';

interface HeroCarouselControlsProps {
  slides: StorefrontHeroSlide[];
  currentSlideIndex: number;
  primaryColor: string;
  isPaused?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelectSlide: (index: number) => void;
}

export function HeroCarouselControls({
  slides,
  currentSlideIndex,
  primaryColor,
  isPaused = false,
  onPrev,
  onNext,
  onSelectSlide,
}: HeroCarouselControlsProps) {
  if (slides.length <= 1) return null;

  return (
    <>
      {/* Navigation Arrows */}
      <div className="absolute inset-y-0 left-3 sm:left-4 z-20 flex items-center pointer-events-none">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Previous Slide"
          className="p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md border border-white/10 transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 cursor-pointer shadow-lg hover:scale-110 active:scale-95 pointer-events-auto"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <div className="absolute inset-y-0 right-3 sm:right-4 z-20 flex items-center pointer-events-none">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Next Slide"
          className="p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md border border-white/10 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 cursor-pointer shadow-lg hover:scale-110 active:scale-95 pointer-events-auto"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Slide Indicators with smooth expanding pill & progress bar */}
      <div className="absolute bottom-3 sm:bottom-4 inset-x-0 z-20 flex justify-center items-center gap-2 pointer-events-auto">
        {slides.map((_, idx) => {
          const isActive = idx === currentSlideIndex;
          return (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectSlide(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
              className={`rounded-full h-1.5 sm:h-2 cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden relative ${
                isActive ? 'w-8 sm:w-10 bg-white/30 backdrop-blur-xs shadow-sm' : 'w-2 sm:w-2.5 bg-white/45 hover:bg-white/80 hover:w-3.5'
              }`}
            >
              {isActive && (
                <div
                  key={`progress-${currentSlideIndex}-${isPaused}`}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: primaryColor,
                    animation: isPaused ? 'none' : 'heroProgress 6s linear forwards',
                    width: isPaused ? '100%' : undefined,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
