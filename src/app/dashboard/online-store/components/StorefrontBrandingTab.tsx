'use client';

import React from 'react';
import { Globe, Palette, Loader2, Save } from 'lucide-react';
import { LogoUploader } from '@/app/dashboard/settings/business-profile/components/LogoUploader';
import { StorefrontHeroCard } from './StorefrontHeroCard';

export const BRAND_THEME_PRESETS = [
  { name: 'Royal Sapphire', primary: '#2563eb', secondary: '#1d4ed8' },
  { name: 'Emerald Fresh', primary: '#10b981', secondary: '#047857' },
  { name: 'Electric Indigo', primary: '#6366f1', secondary: '#4338ca' },
  { name: 'Velvet Plum', primary: '#9333ea', secondary: '#7e22ce' },
  { name: 'Sunset Coral', primary: '#f43f5e', secondary: '#be123c' },
  { name: 'Amber Gold', primary: '#d97706', secondary: '#b45309' },
  { name: 'Teal Lagoon', primary: '#0d9488', secondary: '#0f766e' },
  { name: 'Luxury Onyx', primary: '#0f172a', secondary: '#334155' },
];

interface StorefrontBrandingTabProps {
  storeName: string;
  slug: string;
  tagline: string;
  bio: string;
  logoUrl: string;
  bannerUrl: string;
  heroMode: 'banner' | 'featured_product' | 'default';
  bannerHeadline: string;
  bannerTagline: string;
  bannerCtaText: string;
  primaryColor: string;
  isActive: boolean;
  isPending: boolean;
  onNameChange: (val: string) => void;
  onSlugChange: (val: string) => void;
  onTaglineChange: (val: string) => void;
  onBioChange: (val: string) => void;
  onLogoUrlChange: (val: string) => void;
  onBannerUrlChange: (val: string) => void;
  onHeroModeChange: (mode: 'banner' | 'featured_product' | 'default') => void;
  onBannerHeadlineChange: (val: string) => void;
  onBannerTaglineChange: (val: string) => void;
  onBannerCtaTextChange: (val: string) => void;
  onPrimaryColorChange: (val: string) => void;
  onSecondaryColorChange: (val: string) => void;
  onIsActiveChange: (val: boolean) => void;
}

export function StorefrontBrandingTab({
  storeName,
  slug,
  tagline,
  bio,
  logoUrl,
  bannerUrl,
  heroMode,
  bannerHeadline,
  bannerTagline,
  bannerCtaText,
  primaryColor,
  isActive,
  isPending,
  onNameChange,
  onSlugChange,
  onTaglineChange,
  onBioChange,
  onLogoUrlChange,
  onBannerUrlChange,
  onHeroModeChange,
  onBannerHeadlineChange,
  onBannerTaglineChange,
  onBannerCtaTextChange,
  onPrimaryColorChange,
  onSecondaryColorChange,
  onIsActiveChange,
}: StorefrontBrandingTabProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Identity Card */}
      <div className="bg-surface border border-separator rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-separator/60">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Globe size={16} style={{ color: primaryColor }} /> Store Identity &amp; Subdomain
            </h3>
            <p className="text-xs text-muted mt-0.5">Set your store name, handle, and brand identity.</p>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => onIsActiveChange(e.target.checked)}
              className="rounded text-brand-primary focus:ring-brand-primary/50"
            />
            <span>Active &amp; Live</span>
          </label>
        </div>

        {/* Unified Business Logo */}
        <div className="pt-1 pb-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">Business &amp; Store Logo</label>
            <span className="text-[11px] text-muted">Shared with Business Profile</span>
          </div>
          <LogoUploader logoUrl={logoUrl} businessName={storeName} onChange={onLogoUrlChange} />
          <p className="text-[11px] text-muted">
            Updating your logo here instantly syncs across your storefront, invoices, and business profile.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Store Name *</label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Unique Fashion"
              className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Store Subdomain URL *</label>
            <div className="flex items-center bg-surface-elevated border border-separator rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-brand-primary">
              <span className="text-[11px] text-muted px-2.5 bg-surface border-r border-separator select-none font-mono">
                https://
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => onSlugChange(e.target.value)}
                placeholder="uniquefashion"
                className="w-full bg-transparent px-2.5 py-2 text-xs font-mono outline-none"
              />
              <span className="text-[11px] text-muted px-2.5 bg-surface border-l border-separator select-none font-mono">
                .merchander.com
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">Tagline</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => onTaglineChange(e.target.value)}
            placeholder="e.g. Premium Fashion & Accessories in Accra"
            className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">Store Bio &amp; Description</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => onBioChange(e.target.value)}
            placeholder="Briefly describe what your shop sells, location landmarks, and opening hours..."
            className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition resize-none"
          />
        </div>
      </div>

      {/* 2. Hero & Promotional Flyer Card */}
      <StorefrontHeroCard
        heroMode={heroMode}
        bannerUrl={bannerUrl}
        bannerHeadline={bannerHeadline}
        bannerTagline={bannerTagline}
        bannerCtaText={bannerCtaText}
        primaryColor={primaryColor}
        onHeroModeChange={onHeroModeChange}
        onBannerUrlChange={onBannerUrlChange}
        onBannerHeadlineChange={onBannerHeadlineChange}
        onBannerTaglineChange={onBannerTaglineChange}
        onBannerCtaTextChange={onBannerCtaTextChange}
      />

      {/* 3. Visual Theme Card */}
      <div className="bg-surface border border-separator rounded-2xl p-6 shadow-xs space-y-4">
        <div className="pb-3 border-b border-separator/60">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Palette size={16} style={{ color: primaryColor }} /> Brand Color &amp; Visual Theme
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Select your signature brand color to style your public storefront buttons, badges, and catalog accents.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">Theme Presets</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {BRAND_THEME_PRESETS.map((preset) => {
              const isSelected = primaryColor.toLowerCase() === preset.primary.toLowerCase();
              return (
                <button
                  key={preset.primary}
                  type="button"
                  onClick={() => {
                    onPrimaryColorChange(preset.primary);
                    onSecondaryColorChange(preset.secondary);
                  }}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-surface-elevated shadow-xs ring-2'
                      : 'border-separator bg-surface hover:bg-surface-elevated/60'
                  }`}
                  style={isSelected ? { borderColor: preset.primary, outlineColor: preset.primary } : undefined}
                >
                  <span
                    className="w-4 h-4 rounded-full shadow-xs shrink-0"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-foreground truncate">{preset.name}</p>
                    <p className="text-[9px] font-mono text-muted truncate">{preset.primary}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-separator/40 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => onPrimaryColorChange(e.target.value)}
                className="w-9 h-9 rounded-xl border border-separator cursor-pointer p-0.5 bg-surface-elevated"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted block">Custom Primary Hex</label>
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => onPrimaryColorChange(e.target.value)}
                placeholder="#3B82F6"
                className="bg-surface-elevated border border-separator rounded-lg px-2.5 py-1 text-xs font-mono uppercase w-28 outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
              />
            </div>
          </div>

          <div className="text-xs text-muted sm:ml-auto">Live preview automatically updates in the phone mockup.</div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl text-white text-xs font-bold hover:opacity-90 active:scale-95 disabled:opacity-50 transition cursor-pointer flex items-center gap-2 shadow-sm"
          style={{ backgroundColor: primaryColor }}
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{isPending ? 'Saving...' : 'Save Branding Settings'}</span>
        </button>
      </div>
    </div>
  );
}
