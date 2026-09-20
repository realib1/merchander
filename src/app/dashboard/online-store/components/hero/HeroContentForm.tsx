'use client';

import React from 'react';
import { Eye, EyeOff, Trash2, Tag } from 'lucide-react';
import { StorefrontHeroSlide } from '@/types/storefront';
import { BADGE_SUGGESTIONS } from './hero-defaults';

interface HeroContentFormProps {
  currentSlide: StorefrontHeroSlide;
  selectedSlideIndex: number;
  totalSlides: number;
  primaryColor: string;
  onUpdateSlide: (updates: Partial<StorefrontHeroSlide>) => void;
  onDeleteSlide: (index: number) => void;
}

export function HeroContentForm({
  currentSlide,
  selectedSlideIndex,
  totalSlides,
  primaryColor,
  onUpdateSlide,
  onDeleteSlide,
}: HeroContentFormProps) {
  return (
    <div className="space-y-4">
      {/* Visibility Toggle & Delete Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-separator/60">
        <label className="flex items-center gap-2.5 text-xs font-bold text-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={currentSlide.is_active}
            onChange={(e) => onUpdateSlide({ is_active: e.target.checked })}
            className="rounded text-brand-primary focus:ring-brand-primary/40 w-4 h-4"
          />
          <span className="flex items-center gap-1.5">
            {currentSlide.is_active ? (
              <>
                <Eye size={14} className="text-emerald-500" />
                <span>Show this slide on storefront</span>
              </>
            ) : (
              <>
                <EyeOff size={14} className="text-zinc-400" />
                <span className="text-muted">Hide this slide (Draft)</span>
              </>
            )}
          </span>
        </label>

        {totalSlides > 1 && (
          <button
            type="button"
            onClick={() => onDeleteSlide(selectedSlideIndex)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Delete Slide {selectedSlideIndex + 1}</span>
          </button>
        )}
      </div>

      {/* Headline & Tagline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-foreground mb-1">Headline</label>
          <input
            type="text"
            value={currentSlide.headline || ''}
            onChange={(e) => onUpdateSlide({ headline: e.target.value })}
            placeholder="e.g. Everyday Essentials."
            className="w-full bg-surface border border-separator rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground mb-1">Subtitle / Tagline</label>
          <input
            type="text"
            value={currentSlide.tagline || ''}
            onChange={(e) => onUpdateSlide({ tagline: e.target.value })}
            placeholder="e.g. Quality, style and comfort in one place."
            className="w-full bg-surface border border-separator rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
          />
        </div>
      </div>

      {/* Badge Tag & Price Pill */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
              <Tag size={13} style={{ color: primaryColor }} />
              <span>Badge Tag</span>
            </label>
            <input
              type="text"
              value={currentSlide.badge_text || ''}
              onChange={(e) => onUpdateSlide({ badge_text: e.target.value })}
              placeholder="e.g. PROMO DROP"
              className="w-full bg-surface border border-separator rounded-xl px-3.5 py-2 text-xs uppercase text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Promo Price</label>
            <input
              type="text"
              value={currentSlide.price_pill || ''}
              onChange={(e) => onUpdateSlide({ price_pill: e.target.value })}
              placeholder="e.g. GHS 120"
              className="w-full bg-surface border border-separator rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Original Price (Strike)</label>
            <input
              type="text"
              value={currentSlide.compare_at_price_pill || ''}
              onChange={(e) => onUpdateSlide({ compare_at_price_pill: e.target.value })}
              placeholder="e.g. GHS 180"
              className="w-full bg-surface border border-separator rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] text-muted font-medium">Quick suggestions:</span>
          {BADGE_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onUpdateSlide({ badge_text: suggestion })}
              className="px-2 py-0.5 rounded-md bg-surface border border-separator/80 text-[10px] font-semibold text-muted hover:text-foreground hover:border-brand-primary transition cursor-pointer"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
