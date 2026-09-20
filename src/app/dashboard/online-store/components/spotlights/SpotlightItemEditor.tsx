'use client';

import React, { useRef } from 'react';
import { Tag, ArrowRight, Upload, Loader2, Trash2, Package, Layers } from 'lucide-react';

export interface SpotlightItemEditorProps {
  title: string;
  themeBadge: string;
  badgeLabel: string;
  variant: 'dark' | 'light';
  headline: string;
  tagline: string;
  imageUrl: string;
  ctaText: string;
  linkUrl: string;
  imageFit?: 'fit' | 'cover';
  primaryColor: string;
  isUploading: boolean;
  defaultHeadline: string;
  defaultTagline: string;
  defaultLink: string;
  onHeadlineChange: (val: string) => void;
  onTaglineChange: (val: string) => void;
  onImageUrlChange: (val: string) => void;
  onCtaTextChange: (val: string) => void;
  onLinkUrlChange: (val: string) => void;
  onImageFitChange: (fit: 'fit' | 'cover') => void;
  onUploadFile: (file: File) => void;
}

export function SpotlightItemEditor({
  title,
  themeBadge,
  badgeLabel,
  variant,
  headline,
  tagline,
  imageUrl,
  ctaText,
  linkUrl,
  imageFit = 'fit',
  primaryColor,
  isUploading,
  defaultHeadline,
  defaultTagline,
  defaultLink,
  onHeadlineChange,
  onTaglineChange,
  onImageUrlChange,
  onCtaTextChange,
  onLinkUrlChange,
  onImageFitChange,
  onUploadFile,
}: SpotlightItemEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = variant === 'dark';
  const previewBg = isDark
    ? 'bg-[#0e0e10] text-white'
    : 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent text-foreground border border-amber-500/20';

  return (
    <div className="space-y-4 p-4 rounded-xl border border-separator/70 bg-surface-elevated/40">
      <div className="flex items-center justify-between pb-2 border-b border-separator/50">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
          <Tag size={13} style={{ color: primaryColor }} /> {title}
        </span>
        <span className="text-[10px] text-muted font-medium">{themeBadge}</span>
      </div>

      {/* Live Preview */}
      {imageFit === 'cover' && imageUrl ? (
        <div className="relative overflow-hidden rounded-2xl min-h-[140px] flex items-center p-4 shadow-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent pointer-events-none" />
          <div className="relative z-10 flex-1 min-w-0 pr-2 space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 drop-shadow-sm">{badgeLabel}</span>
            <h4 className="text-base font-extrabold text-white leading-tight truncate drop-shadow-md">{headline || defaultHeadline}</h4>
            <p className="text-[11px] text-zinc-200 leading-snug line-clamp-2 drop-shadow-sm">{tagline || defaultTagline}</p>
            <div className="pt-1.5">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold text-white shadow-xs" style={{ backgroundColor: primaryColor }}>
                <span>{ctaText || 'Shop Now'}</span>
                <ArrowRight size={11} />
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className={`relative overflow-hidden rounded-2xl p-4 shadow-xs ${previewBg}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0 pr-2 space-y-1 z-10">
              <span className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-amber-600 dark:text-amber-400'}`}>{badgeLabel}</span>
              <h4 className={`text-base font-extrabold leading-tight truncate ${isDark ? 'text-white' : 'text-foreground'}`}>{headline || defaultHeadline}</h4>
              <p className={`text-[11px] leading-snug line-clamp-2 ${isDark ? 'text-zinc-400' : 'text-muted'}`}>{tagline || defaultTagline}</p>
              <div className="pt-1.5">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold text-white shadow-xs" style={{ backgroundColor: primaryColor }}>
                  <span>{ctaText || 'Shop Now'}</span>
                  <ArrowRight size={11} />
                </span>
              </div>
            </div>
            <div className="w-20 h-20 aspect-square shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={title} className="max-h-full max-w-full object-contain p-1" />
              ) : (
                <span className="text-[10px] text-zinc-500 font-medium">Auto Image</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Headline</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => onHeadlineChange(e.target.value)}
            placeholder={defaultHeadline}
            maxLength={100}
            className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Tagline / Subtitle</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => onTaglineChange(e.target.value)}
            placeholder={defaultTagline}
            maxLength={150}
            className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Button Label</label>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => onCtaTextChange(e.target.value)}
              placeholder="Shop Now"
              maxLength={40}
              className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Target Link URL</label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => onLinkUrlChange(e.target.value)}
              placeholder={defaultLink}
              maxLength={200}
              className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Spotlight Image</label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUploadFile(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1 py-2 px-3 rounded-xl border border-separator bg-surface text-foreground hover:bg-surface-elevated text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              <span>{isUploading ? 'Uploading...' : imageUrl ? 'Change Image' : 'Upload Image'}</span>
            </button>
            {imageUrl && (
              <button
                type="button"
                onClick={() => onImageUrlChange('')}
                className="p-2 rounded-xl text-muted hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
                title="Remove image"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-separator/40 space-y-1.5">
          <label className="block text-[11px] font-semibold text-foreground">Image Display Mode</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onImageFitChange('fit')}
              className={`py-1.5 px-2 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                imageFit === 'fit' ? 'border-brand-primary bg-surface shadow-2xs text-brand-primary font-bold' : 'border-separator/80 bg-surface text-muted text-xs'
              }`}
            >
              <Package size={12} />
              <span className="text-[11px]">Product Fit</span>
            </button>
            <button
              type="button"
              onClick={() => onImageFitChange('cover')}
              className={`py-1.5 px-2 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                imageFit === 'cover' ? 'border-brand-primary bg-surface shadow-2xs text-brand-primary font-bold' : 'border-separator/80 bg-surface text-muted text-xs'
              }`}
            >
              <Layers size={12} />
              <span className="text-[11px]">Cover Banner</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
