'use client';

import React, { useState, useTransition } from 'react';
import { StorefrontConfig, CustomDomainConfig } from '@/types/storefront';
import { updateStorefrontConfig } from '@/app/actions/storefront';
import { StorefrontHeaderHub } from './StorefrontHeaderHub';
import { StorefrontBrandingTab } from './StorefrontBrandingTab';
import { StorefrontPoliciesTab } from './StorefrontPoliciesTab';
import { StorefrontLivePreview } from './StorefrontLivePreview';
import { DomainSettingsCard } from './DomainSettingsCard';
import { FeaturedProductsManager } from './FeaturedProductsManager';
import { generateStoreSlug } from '@/utils/storefront';
import { getStorefrontSubdomainUrl } from '@/utils/domain';
import { Globe, MessageCircle, Palette, Star } from 'lucide-react';
import { toast } from 'sonner';

type StorefrontTab = 'branding' | 'merchandising' | 'domain' | 'policies';

interface StorefrontSettingsFormProps {
  initialConfig: StorefrontConfig | null;
  domainConfig?: CustomDomainConfig | null;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    imageUrl: string | null;
    isFeatured: boolean;
  }>;
  featuredProductIds?: string[];
}

export function StorefrontSettingsForm({
  initialConfig,
  domainConfig = null,
  products = [],
  featuredProductIds = [],
}: StorefrontSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<StorefrontTab>('branding');

  // Form states
  const [storeName, setStoreName] = useState(initialConfig?.store_name || '');
  const [slug, setSlug] = useState(initialConfig?.slug || '');
  const [tagline, setTagline] = useState(initialConfig?.tagline || '');
  const [bio, setBio] = useState(initialConfig?.bio || '');
  const [logoUrl, setLogoUrl] = useState(initialConfig?.logo_url || '');
  const [whatsappPhone, setWhatsappPhone] = useState(initialConfig?.whatsapp_phone || '');
  const [instagramHandle, setInstagramHandle] = useState(initialConfig?.instagram_handle || '');
  const [tiktokHandle, setTiktokHandle] = useState(initialConfig?.tiktok_handle || '');
  const [deliveryPolicy, setDeliveryPolicy] = useState(initialConfig?.delivery_policy || '');
  const [primaryColor, setPrimaryColor] = useState(initialConfig?.primary_color || '#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState(initialConfig?.secondary_color || '#1e40af');
  const [isActive, setIsActive] = useState(initialConfig?.is_active ?? true);
  const [bannerUrl, setBannerUrl] = useState(initialConfig?.banner_url || '');
  const [heroMode, setHeroMode] = useState<'banner' | 'featured_product' | 'default'>(
    initialConfig?.hero_mode || 'default'
  );
  const [bannerHeadline, setBannerHeadline] = useState(initialConfig?.banner_headline || '');
  const [bannerTagline, setBannerTagline] = useState(initialConfig?.banner_tagline || '');
  const [bannerCtaText, setBannerCtaText] = useState(initialConfig?.banner_cta_text || '');
  const [currentFeaturedIds, setCurrentFeaturedIds] = useState<string[]>(featuredProductIds);

  const customDomain = domainConfig?.domain || initialConfig?.custom_domain;
  const publicUrl = customDomain ? `https://${customDomain}` : getStorefrontSubdomainUrl(slug || 'my-store');

  const handleNameChange = (val: string) => {
    setStoreName(val);
    if (!initialConfig?.slug || slug === generateStoreSlug(initialConfig.store_name)) {
      setSlug(generateStoreSlug(val));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const formData = new FormData();
      formData.append('storeName', storeName);
      formData.append('slug', slug);
      formData.append('tagline', tagline);
      formData.append('bio', bio);
      formData.append('logoUrl', logoUrl);
      formData.append('bannerUrl', bannerUrl);
      formData.append('heroMode', heroMode);
      formData.append('bannerHeadline', bannerHeadline);
      formData.append('bannerTagline', bannerTagline);
      formData.append('bannerCtaText', bannerCtaText);
      formData.append('whatsappPhone', whatsappPhone);
      formData.append('instagramHandle', instagramHandle);
      formData.append('tiktokHandle', tiktokHandle);
      formData.append('deliveryPolicy', deliveryPolicy);
      formData.append('primaryColor', primaryColor);
      formData.append('secondaryColor', secondaryColor);
      formData.append('isActive', String(isActive));
      formData.append('currency', initialConfig?.currency || 'GHS');

      const res = await updateStorefrontConfig(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Storefront settings saved successfully');
      }
    });
  };

  const tabs = [
    { id: 'branding' as const, label: 'Branding & Visuals', icon: Palette },
    { id: 'merchandising' as const, label: 'Featured Products', icon: Star },
    { id: 'domain' as const, label: 'Custom Domain', icon: Globe },
    { id: 'policies' as const, label: 'Contact & Policies', icon: MessageCircle },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Master Control Header Card */}
      <StorefrontHeaderHub slug={slug} publicUrl={publicUrl} isActive={isActive} primaryColor={primaryColor} />

      {/* 2. Modern Segmented Tab Strip */}
      <div className="flex items-center gap-1.5 p-1 bg-surface border border-separator rounded-2xl overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActiveTab = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActiveTab
                  ? 'bg-surface-elevated text-foreground shadow-xs'
                  : 'text-muted hover:text-foreground hover:bg-surface-elevated/40'
              }`}
            >
              <Icon size={14} style={isActiveTab ? { color: primaryColor } : undefined} />
              <span>{tab.label}</span>
              {tab.id === 'merchandising' && products.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                  {currentFeaturedIds.length}
                </span>
              )}
              {tab.id === 'domain' && customDomain && (
                <span className="px-1.5 py-0.2 rounded-full bg-success/15 text-success text-[10px] font-bold">
                  Connected
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Main Workspace: Tab Content (8 Cols) + Sticky Phone Preview (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'branding' && (
            <form onSubmit={handleSubmit}>
              <StorefrontBrandingTab
                storeName={storeName}
                slug={slug}
                tagline={tagline}
                bio={bio}
                logoUrl={logoUrl}
                bannerUrl={bannerUrl}
                heroMode={heroMode}
                bannerHeadline={bannerHeadline}
                bannerTagline={bannerTagline}
                bannerCtaText={bannerCtaText}
                primaryColor={primaryColor}
                isActive={isActive}
                isPending={isPending}
                onNameChange={handleNameChange}
                onSlugChange={setSlug}
                onTaglineChange={setTagline}
                onBioChange={setBio}
                onLogoUrlChange={setLogoUrl}
                onBannerUrlChange={setBannerUrl}
                onHeroModeChange={setHeroMode}
                onBannerHeadlineChange={setBannerHeadline}
                onBannerTaglineChange={setBannerTagline}
                onBannerCtaTextChange={setBannerCtaText}
                onPrimaryColorChange={setPrimaryColor}
                onSecondaryColorChange={setSecondaryColor}
                onIsActiveChange={setIsActive}
              />
            </form>
          )}

          {activeTab === 'merchandising' && (
            <div className="space-y-6 animate-fadeIn">
              <FeaturedProductsManager
                products={products}
                initialFeaturedIds={currentFeaturedIds}
                currency={initialConfig?.currency || 'GHS'}
                onFeaturedChange={setCurrentFeaturedIds}
              />
            </div>
          )}

          {activeTab === 'domain' && (
            <div className="space-y-6 animate-fadeIn">
              <DomainSettingsCard slug={slug || 'my-store'} initialDomainConfig={domainConfig} />
            </div>
          )}

          {activeTab === 'policies' && (
            <form onSubmit={handleSubmit}>
              <StorefrontPoliciesTab
                whatsappPhone={whatsappPhone}
                instagramHandle={instagramHandle}
                tiktokHandle={tiktokHandle}
                deliveryPolicy={deliveryPolicy}
                primaryColor={primaryColor}
                isPending={isPending}
                onWhatsappPhoneChange={setWhatsappPhone}
                onInstagramHandleChange={setInstagramHandle}
                onTiktokHandleChange={setTiktokHandle}
                onDeliveryPolicyChange={setDeliveryPolicy}
              />
            </form>
          )}
        </div>

        {/* Sticky Live Mobile Mockup Preview */}
        <div className="lg:col-span-4">
          <StorefrontLivePreview
            storeName={storeName}
            tagline={tagline}
            bio={bio}
            logoUrl={logoUrl}
            bannerUrl={bannerUrl}
            heroMode={heroMode}
            bannerHeadline={bannerHeadline}
            whatsappPhone={whatsappPhone}
            instagramHandle={instagramHandle}
            primaryColor={primaryColor}
            isActive={isActive}
          />
        </div>
      </div>
    </div>
  );
}
