'use client';

import React, { useRef, useTransition } from 'react';
import { Image as ImageIcon, Zap, Store, Projector, Upload, Loader2, Trash2 } from 'lucide-react';
import { uploadStorefrontBanner } from '@/app/actions/storefront';
import { toast } from 'sonner';

interface StorefrontHeroCardProps {
  heroMode: 'banner' | 'featured_product' | 'default';
  bannerUrl: string;
  bannerHeadline: string;
  bannerTagline: string;
  bannerCtaText: string;
  primaryColor: string;
  onHeroModeChange: (mode: 'banner' | 'featured_product' | 'default') => void;
  onBannerUrlChange: (url: string) => void;
  onBannerHeadlineChange: (val: string) => void;
  onBannerTaglineChange: (val: string) => void;
  onBannerCtaTextChange: (val: string) => void;
}

export function StorefrontHeroCard({
  heroMode,
  bannerUrl,
  bannerHeadline,
  bannerTagline,
  bannerCtaText,
  primaryColor,
  onHeroModeChange,
  onBannerUrlChange,
  onBannerHeadlineChange,
  onBannerTaglineChange,
  onBannerCtaTextChange,
}: StorefrontHeroCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, startUpload] = useTransition();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Flyer image must be under 10MB');
      return;
    }

    startUpload(async () => {
      try {
        const formData = new FormData();
        formData.append('bannerFile', file);
        const res = await uploadStorefrontBanner(formData);
        if (res.error) {
          toast.error(res.error);
        } else if (res.url) {
          onBannerUrlChange(res.url);
          toast.success('Promotional flyer uploaded successfully!');
        }
      } catch (err) {
        console.error('Banner upload error:', err);
        toast.error('Failed to upload promotional flyer');
      }
    });
  };

  return (
    <div className="bg-surface border border-separator rounded-2xl p-6 shadow-xs space-y-4">
      <div className="pb-3 border-b border-separator/60 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Projector size={16} style={{ color: primaryColor }} /> Hero Showcase &amp; Promo Flyer
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Choose what customers see first when they land on your online store (Jumia-style banner or product
            spotlight).
          </p>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {[
          {
            id: 'banner' as const,
            title: 'Promotional Flyer',
            desc: 'Custom sale/campaign banner image',
            icon: ImageIcon,
          },
          {
            id: 'featured_product' as const,
            title: 'Product Spotlight',
            desc: 'Spotlight top pinned featured item',
            icon: Zap,
          },
          {
            id: 'default' as const,
            title: 'Brand Overview',
            desc: 'Store monogram, tagline, and WhatsApp CTA',
            icon: Store,
          },
        ].map((mode) => {
          const isSelected = heroMode === mode.id;
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onHeroModeChange(mode.id)}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? 'bg-brand-primary/5 border-brand-primary ring-1 ring-brand-primary/50'
                  : 'bg-surface border-separator hover:bg-surface-elevated'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon size={16} className={isSelected ? 'text-brand-primary' : 'text-muted'} />
                <span className="text-xs font-bold text-foreground">{mode.title}</span>
              </div>
              <p className="text-[10px] text-muted leading-tight">{mode.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Banner Upload & Configuration Form (Visible when Flyer mode is selected) */}
      {heroMode === 'banner' && (
        <div className="pt-3 border-t border-separator/50 space-y-4 animate-fadeIn">
          {/* File Upload / Image Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground">Flyer Banner Image</label>

            {bannerUrl ? (
              <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-separator bg-surface-elevated group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bannerUrl} alt="Flyer banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 text-xs font-bold hover:bg-white transition flex items-center gap-1 cursor-pointer"
                  >
                    <Upload size={13} />
                    <span>Replace Flyer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onBannerUrlChange('')}
                    className="px-3 py-1.5 rounded-lg bg-destructive text-white text-xs font-bold hover:opacity-90 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-separator hover:border-brand-primary rounded-2xl bg-surface-elevated/40 flex flex-col items-center justify-center gap-2 cursor-pointer transition p-4 text-center"
              >
                {isUploading ? (
                  <Loader2 size={24} className="animate-spin text-brand-primary" />
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                      <Upload size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Click to upload promotional flyer</p>
                      <p className="text-[10px] text-muted">PNG, JPG, or WebP up to 10MB (Recommended: 1200x500)</p>
                    </div>
                  </>
                )}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            <div className="pt-1">
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => onBannerUrlChange(e.target.value)}
                placeholder="Or paste an image URL (https://...)"
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-1.5 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Banner Headline (Optional)</label>
              <input
                type="text"
                value={bannerHeadline}
                onChange={(e) => onBannerHeadlineChange(e.target.value)}
                placeholder="e.g. Mega Clearance Sale • Up to 50% Off"
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Button CTA Text</label>
              <input
                type="text"
                value={bannerCtaText}
                onChange={(e) => onBannerCtaTextChange(e.target.value)}
                placeholder="Shop Collection"
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Banner Subtitle / Promotional Note (Optional)
            </label>
            <input
              type="text"
              value={bannerTagline}
              onChange={(e) => onBannerTaglineChange(e.target.value)}
              placeholder="e.g. Valid until stocks last. Free delivery on orders over GHS 500."
              className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
            />
          </div>
        </div>
      )}
    </div>
  );
}
