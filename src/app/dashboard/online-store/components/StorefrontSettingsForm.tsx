'use client';

import React, { useState, useTransition } from 'react';
import { StorefrontConfig } from '@/types/storefront';
import { updateStorefrontConfig } from '@/app/actions/storefront';
import { StorefrontLivePreview } from './StorefrontLivePreview';
import { generateStoreSlug } from '@/utils/storefront';
import {
  Save,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  Sparkles,
  Link as LinkIcon,
  MessageCircle,
  Truck,
  Loader2,
} from 'lucide-react';

function InstagramIcon({ size = 12, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface StorefrontSettingsFormProps {
  initialConfig: StorefrontConfig | null;
}

export function StorefrontSettingsForm({ initialConfig }: StorefrontSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [storeName, setStoreName] = useState(initialConfig?.store_name || '');
  const [slug, setSlug] = useState(initialConfig?.slug || '');
  const [tagline, setTagline] = useState(initialConfig?.tagline || '');
  const [bio, setBio] = useState(initialConfig?.bio || '');
  const [logoUrl, setLogoUrl] = useState(initialConfig?.logo_url || '');
  const [bannerUrl, setBannerUrl] = useState(initialConfig?.banner_url || '');
  const [whatsappPhone, setWhatsappPhone] = useState(initialConfig?.whatsapp_phone || '');
  const [instagramHandle, setInstagramHandle] = useState(initialConfig?.instagram_handle || '');
  const [tiktokHandle, setTiktokHandle] = useState(initialConfig?.tiktok_handle || '');
  const [deliveryPolicy, setDeliveryPolicy] = useState(initialConfig?.delivery_policy || '');
  const [isActive, setIsActive] = useState(initialConfig?.is_active ?? true);

  const handleNameChange = (val: string) => {
    setStoreName(val);
    if (!initialConfig?.slug || initialConfig.slug === generateStoreSlug(initialConfig.store_name)) {
      setSlug(generateStoreSlug(val));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const formData = new FormData();
    formData.set('storeName', storeName);
    formData.set('slug', slug);
    formData.set('tagline', tagline);
    formData.set('bio', bio);
    formData.set('logoUrl', logoUrl);
    formData.set('bannerUrl', bannerUrl);
    formData.set('whatsappPhone', whatsappPhone);
    formData.set('instagramHandle', instagramHandle);
    formData.set('tiktokHandle', tiktokHandle);
    formData.set('deliveryPolicy', deliveryPolicy);
    formData.set('isActive', String(isActive));
    formData.set('currency', initialConfig?.currency || 'GHS');

    startTransition(async () => {
      const res = await updateStorefrontConfig(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('Storefront configuration saved successfully!');
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Main Settings Editor (8 Cols) */}
      <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
        {/* Alerts */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-success/10 border border-success/30 text-success text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle size={15} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Section 1: Store Branding & Identity */}
        <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-separator/60">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag size={15} className="text-brand-primary" /> Store Identity & URL
            </h3>
            {/* Active Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-brand-primary focus:ring-brand-primary/50"
              />
              <span>Active & Public</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Store Name *</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Glam Hair & Beauty"
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted mb-1 flex items-center gap-1">
                <LinkIcon size={12} /> Store Slug / Link *
              </label>
              <div className="flex items-center bg-surface-elevated border border-separator rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-brand-primary">
                <span className="text-[11px] text-muted px-2.5 bg-surface border-r border-separator select-none font-mono">
                  /store/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(generateStoreSlug(e.target.value))}
                  placeholder="glam-hair-beauty"
                  className="w-full bg-transparent px-3 py-2 text-xs text-foreground font-mono outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Premium 100% Virgin Hair & Lace Wigs in Accra"
              className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Store Bio & Description</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Briefly describe what your shop sells, opening hours, and location..."
              className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Logo Image URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">Hero Banner Image URL</label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Social Commerce & WhatsApp Ordering */}
        <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-separator/60">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={15} className="text-brand-secondary" /> Social Commerce & WhatsApp
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted mb-1 flex items-center gap-1">
                <MessageCircle size={12} className="text-success" /> WhatsApp Phone *
              </label>
              <input
                type="tel"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="+233241234567"
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs text-foreground font-mono placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted mb-1 flex items-center gap-1">
                <InstagramIcon size={12} className="text-brand-primary" /> Instagram Handle
              </label>
              <input
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value.replace('@', ''))}
                placeholder="e.g. glamaccra"
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">TikTok Handle</label>
              <input
                type="text"
                value={tiktokHandle}
                onChange={(e) => setTiktokHandle(e.target.value.replace('@', ''))}
                placeholder="e.g. glam_gh"
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1 flex items-center gap-1">
              <Truck size={12} className="text-info" /> Delivery & Pickup Policy
            </label>
            <textarea
              rows={2}
              value={deliveryPolicy}
              onChange={(e) => setDeliveryPolicy(e.target.value)}
              placeholder="e.g. Same-day delivery across Greater Accra (₵ 30). Nationwide dispatch via VIP bus."
              className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition resize-none"
            />
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 disabled:opacity-50 cursor-pointer transition flex items-center gap-2 shadow-xs"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{isPending ? 'Saving Changes...' : 'Save Storefront Settings'}</span>
          </button>
        </div>
      </form>

      {/* 2. Live Mobile Preview Sidebar (4 Cols) */}
      <div className="lg:col-span-4">
        <StorefrontLivePreview
          storeName={storeName}
          tagline={tagline}
          bio={bio}
          bannerUrl={bannerUrl}
          logoUrl={logoUrl}
          whatsappPhone={whatsappPhone}
          instagramHandle={instagramHandle}
          isActive={isActive}
        />
      </div>
    </div>
  );
}
