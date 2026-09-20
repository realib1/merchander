'use client';

import React from 'react';
import { Globe, Store } from 'lucide-react';
import { LogoUploader } from '@/app/dashboard/settings/business-profile/components/LogoUploader';
import { StoreLiveStatusToggle } from './StoreLiveStatusToggle';
import { StoreSubdomainInput } from './StoreSubdomainInput';

interface StoreIdentitySectionProps {
  storeName: string;
  slug: string;
  tagline: string;
  bio: string;
  logoUrl: string;
  isActive: boolean;
  primaryColor: string;
  onNameChange: (val: string) => void;
  onSlugChange: (val: string) => void;
  onTaglineChange: (val: string) => void;
  onBioChange: (val: string) => void;
  onLogoUrlChange: (val: string) => void;
  onIsActiveChange: (val: boolean) => void;
}

export function StoreIdentitySection({
  storeName,
  slug,
  tagline,
  bio,
  logoUrl,
  isActive,
  primaryColor,
  onNameChange,
  onSlugChange,
  onTaglineChange,
  onBioChange,
  onLogoUrlChange,
  onIsActiveChange,
}: StoreIdentitySectionProps) {
  return (
    <div className="bg-surface border border-separator rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header with Title and Live Status Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-separator/70">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Globe size={16} style={{ color: primaryColor }} />
            <span>Store Identity &amp; Subdomain</span>
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Configure your brand identity, customer-facing store name, and public web address.
          </p>
        </div>

        <StoreLiveStatusToggle
          isActive={isActive}
          primaryColor={primaryColor}
          onIsActiveChange={onIsActiveChange}
        />
      </div>

      {/* Brand Visuals (Logo Uploader) */}
      <div className="rounded-xl border border-separator/70 bg-surface-elevated/40 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Store size={14} className="text-muted" />
            <span>Business &amp; Store Logo</span>
          </label>
          <span className="text-[11px] text-muted">Auto-synced with invoices &amp; checkout</span>
        </div>
        <LogoUploader logoUrl={logoUrl} businessName={storeName} onChange={onLogoUrlChange} />
        <p className="text-[11px] text-muted leading-relaxed">
          Recommended: Square PNG, JPG, or WebP (min. 512×512px). Displayed on your navbar, footer, order invoices, and WhatsApp receipts.
        </p>
      </div>

      {/* Store Name & Subdomain URL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>Store Name</span>
              <span className="text-destructive">*</span>
            </label>
            <span className="text-[10px] text-muted font-mono">{storeName.length}/60</span>
          </div>
          <input
            type="text"
            required
            maxLength={60}
            value={storeName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Unique Fashion"
            className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs font-medium text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary focus-visible:border-brand-primary transition shadow-2xs"
          />
          <p className="text-[11px] text-muted">Primary name shown on storefront navigation, search engines, and messages.</p>
        </div>

        <StoreSubdomainInput
          slug={slug}
          storeName={storeName}
          primaryColor={primaryColor}
          onSlugChange={onSlugChange}
        />
      </div>

      {/* Short Tagline & Store Bio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">Short Tagline</label>
            <span className="text-[10px] text-muted font-mono">{tagline.length}/80</span>
          </div>
          <input
            type="text"
            maxLength={80}
            value={tagline}
            onChange={(e) => onTaglineChange(e.target.value)}
            placeholder="e.g. Premium everyday essentials designed for comfort"
            className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs font-medium text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary focus-visible:border-brand-primary transition shadow-2xs"
          />
          <p className="text-[11px] text-muted">Appears under your hero banner, SEO description, and WhatsApp share cards.</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">Store Bio / Description</label>
            <span className="text-[10px] text-muted font-mono">{bio.length}/300</span>
          </div>
          <textarea
            rows={3}
            maxLength={300}
            value={bio}
            onChange={(e) => onBioChange(e.target.value)}
            placeholder="Tell your brand story, craftsmanship, or key value proposition for shoppers..."
            className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs font-medium text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary focus-visible:border-brand-primary transition shadow-2xs resize-none leading-relaxed"
          />
          <p className="text-[11px] text-muted">Detailed brand summary presented in the storefront footer and About modal.</p>
        </div>
      </div>
    </div>
  );
}
