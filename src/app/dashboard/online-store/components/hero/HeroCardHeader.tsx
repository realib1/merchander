'use client';

import React from 'react';
import { Layers, Monitor, Smartphone, Plus } from 'lucide-react';
import { StorefrontHeroSlide } from '@/types/storefront';

interface HeroCardHeaderProps {
  slides: StorefrontHeroSlide[];
  selectedSlideIndex: number;
  previewViewport: 'desktop' | 'mobile';
  primaryColor: string;
  onSelectSlide: (index: number) => void;
  onSelectViewport: (viewport: 'desktop' | 'mobile') => void;
  onAddSlide: () => void;
}

export function HeroCardHeader({
  slides,
  selectedSlideIndex,
  previewViewport,
  primaryColor,
  onSelectSlide,
  onSelectViewport,
  onAddSlide,
}: HeroCardHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Title & Viewport Controls */}
      <div className="pb-4 border-b border-separator/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layers size={16} style={{ color: primaryColor }} />
            Hero Showcase &amp; Carousel Banners
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Configure up to 3 hero slides that greet visitors. Set text contrast, upload imagery, and toggle visibility.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-surface-elevated rounded-xl border border-separator/70 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onSelectViewport('desktop')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              previewViewport === 'desktop' ? 'bg-surface text-foreground shadow-2xs' : 'text-muted hover:text-foreground'
            }`}
          >
            <Monitor size={13} />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectViewport('mobile')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              previewViewport === 'mobile' ? 'bg-surface text-foreground shadow-2xs' : 'text-muted hover:text-foreground'
            }`}
          >
            <Smartphone size={13} />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>
      </div>

      {/* Slide Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {slides.map((slide, idx) => {
          const isSelected = idx === selectedSlideIndex;
          return (
            <button
              key={slide.id || idx}
              type="button"
              onClick={() => onSelectSlide(idx)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                isSelected
                  ? 'bg-surface-elevated border-brand-primary text-foreground shadow-2xs'
                  : 'bg-surface border-separator/80 text-muted hover:text-foreground hover:bg-surface-elevated/50'
              }`}
              style={isSelected ? { borderColor: primaryColor } : undefined}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${slide.is_active ? 'bg-emerald-500' : 'bg-zinc-400'}`}
                title={slide.is_active ? 'Active / Visible' : 'Hidden'}
              />
              <span>Slide {idx + 1}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                  slide.is_active
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-zinc-500/15 text-zinc-500'
                }`}
              >
                {slide.is_active ? 'Active' : 'Hidden'}
              </span>
            </button>
          );
        })}

        {slides.length < 3 && (
          <button
            type="button"
            onClick={onAddSlide}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-dashed border-separator/90 text-muted hover:text-foreground hover:border-brand-primary hover:bg-surface-elevated/40 transition cursor-pointer shrink-0"
          >
            <Plus size={14} />
            <span>Add Slide ({slides.length}/3)</span>
          </button>
        )}
      </div>
    </div>
  );
}
