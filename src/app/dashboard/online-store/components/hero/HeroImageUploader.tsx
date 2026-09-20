'use client';

import React, { useRef } from 'react';
import { Upload, Loader2, Trash2, Package, Layers, SunMoon, Sun, Moon } from 'lucide-react';
import { StorefrontHeroSlide } from '@/types/storefront';
import { HeroProduct } from './hero-defaults';

interface HeroImageUploaderProps {
  currentSlide: StorefrontHeroSlide;
  products: HeroProduct[];
  isUploading: boolean;
  onUploadFile: (file: File) => void;
  onUpdateSlide: (updates: Partial<StorefrontHeroSlide>) => void;
}

export function HeroImageUploader({
  currentSlide,
  products,
  isUploading,
  onUploadFile,
  onUpdateSlide,
}: HeroImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerSrc = currentSlide.image_url || '/images/storefront/hero-banner-lifestyle.webp';
  const isFitMode =
    currentSlide.image_fit === 'fit' ||
    (!currentSlide.image_fit && currentSlide.link_type === 'product');
  const contrastTheme = currentSlide.contrast_theme || 'auto';

  const linkedProd =
    currentSlide.link_type === 'product' && currentSlide.link_id
      ? products.find((p) => p.id === currentSlide.link_id)
      : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadFile(file);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground">Banner Background Image</label>
          <span className="text-[11px] text-muted">Recommended: Landscape 16:9 or 21:9</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl border border-separator/80 bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerSrc}
            alt="Slide image"
            className="w-28 h-18 object-cover rounded-lg border border-separator/60 shrink-0 bg-surface-elevated"
          />

          <div className="flex-1 space-y-1 text-center sm:text-left">
            <p className="text-xs font-medium text-foreground">
              {currentSlide.image_url ? 'Custom image uploaded' : 'Default lifestyle backdrop active'}
            </p>
            <p className="text-[11px] text-muted">Supports JPG, PNG, WebP up to 10MB.</p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {linkedProd?.imageUrl && (
              currentSlide.image_url === linkedProd.imageUrl ? (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl flex items-center gap-1">
                  Product photo active
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onUpdateSlide({ image_url: linkedProd.imageUrl })}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/25 hover:bg-brand-primary/20 transition cursor-pointer flex items-center gap-1.5"
                  title={`Use photo from ${linkedProd.name}`}
                >
                  <Package size={13} />
                  <span>Use Product Photo</span>
                </button>
              )
            )}

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-elevated border border-separator text-foreground hover:bg-surface-elevated/80 transition cursor-pointer flex items-center gap-1.5"
            >
              {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              <span>{isUploading ? 'Uploading...' : currentSlide.image_url ? 'Change Image' : 'Upload Image'}</span>
            </button>

            {currentSlide.image_url && (
              <button
                type="button"
                onClick={() => onUpdateSlide({ image_url: null })}
                className="p-2 rounded-xl text-muted hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
                title="Reset to default image"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Display Mode Toggle */}
        <div className="space-y-1.5 pt-2 border-t border-separator/50">
          <label className="block text-xs font-bold text-foreground">Image Display Mode</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdateSlide({ image_fit: 'fit' })}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                isFitMode
                  ? 'border-brand-primary bg-surface shadow-2xs ring-1 ring-brand-primary/50'
                  : 'border-separator/80 bg-surface hover:border-separator text-muted hover:text-foreground'
              }`}
            >
              <div className="p-1 rounded-lg bg-brand-primary/10 text-brand-primary shrink-0 mt-0.5">
                <Package size={14} />
              </div>
              <div>
                <span className="text-xs font-bold block text-foreground">Product Showcase (Fit)</span>
                <span className="text-[11px] text-muted block leading-tight">
                  Uncropped product on dedicated stage. Fits any image color, zero fade.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onUpdateSlide({ image_fit: 'cover' })}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                !isFitMode
                  ? 'border-brand-primary bg-surface shadow-2xs ring-1 ring-brand-primary/50'
                  : 'border-separator/80 bg-surface hover:border-separator text-muted hover:text-foreground'
              }`}
            >
              <div className="p-1 rounded-lg bg-brand-primary/10 text-brand-primary shrink-0 mt-0.5">
                <Layers size={14} />
              </div>
              <div>
                <span className="text-xs font-bold block text-foreground">Full Bleed Banner (Cover)</span>
                <span className="text-[11px] text-muted block leading-tight">
                  Edge-to-edge landscape photo with floating frosted glass text card.
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Contrast Theme */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-foreground">Text Contrast Theme</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => onUpdateSlide({ contrast_theme: 'auto' })}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
              contrastTheme === 'auto'
                ? 'border-brand-primary bg-surface shadow-2xs ring-1 ring-brand-primary/50'
                : 'border-separator/80 bg-surface hover:border-separator text-muted hover:text-foreground'
            }`}
          >
            <SunMoon size={16} className="mt-0.5 text-amber-500 shrink-0" />
            <div>
              <span className="text-xs font-bold block text-foreground">Adapt to Image</span>
              <span className="text-[11px] text-muted block leading-tight">Smart contrast adapted to store theme</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSlide({ contrast_theme: 'light' })}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
              contrastTheme === 'light'
                ? 'border-brand-primary bg-surface shadow-2xs ring-1 ring-brand-primary/50'
                : 'border-separator/80 bg-surface hover:border-separator text-muted hover:text-foreground'
            }`}
          >
            <Sun size={16} className="mt-0.5 text-amber-600 shrink-0" />
            <div>
              <span className="text-xs font-bold block text-foreground">Light Backdrop</span>
              <span className="text-[11px] text-muted block leading-tight">Crisp dark text for bright images</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSlide({ contrast_theme: 'dark' })}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
              contrastTheme === 'dark'
                ? 'border-brand-primary bg-surface shadow-2xs ring-1 ring-brand-primary/50'
                : 'border-separator/80 bg-surface hover:border-separator text-muted hover:text-foreground'
            }`}
          >
            <Moon size={16} className="mt-0.5 text-indigo-500 shrink-0" />
            <div>
              <span className="text-xs font-bold block text-foreground">Dark Backdrop</span>
              <span className="text-[11px] text-muted block leading-tight">Crisp white text for rich photos</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
