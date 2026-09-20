'use client';

import React from 'react';
import { StorefrontConfig, CustomDomainConfig } from '@/types/storefront';
import { StorefrontHeaderHub } from './StorefrontHeaderHub';
import { StorefrontTabsNav } from './StorefrontTabsNav';
import { StorefrontBrandingTab } from './StorefrontBrandingTab';
import { StorefrontPoliciesTab } from './StorefrontPoliciesTab';
import { StorefrontLivePreview } from './StorefrontLivePreview';
import { DomainSettingsCard } from './DomainSettingsCard';
import { FeaturedProductsManager } from './FeaturedProductsManager';
import { useStorefrontSettingsForm, StorefrontTab } from '../hooks/useStorefrontSettingsForm';

export type { StorefrontTab };

interface StorefrontSettingsFormProps {
  initialConfig: StorefrontConfig | null;
  domainConfig?: CustomDomainConfig | null;
  products?: Array<{ id: string; name: string; description?: string | null; price: number; stock: number; imageUrl: string | null; isFeatured: boolean }>;
  featuredProductIds?: string[];
}

export function StorefrontSettingsForm({
  initialConfig,
  domainConfig = null,
  products = [],
  featuredProductIds = [],
}: StorefrontSettingsFormProps) {
  const form = useStorefrontSettingsForm(initialConfig, domainConfig, featuredProductIds);

  return (
    <div className="space-y-6">
      <StorefrontHeaderHub slug={form.slug} publicUrl={form.publicUrl} isActive={form.isActive} primaryColor={form.primaryColor} />

      <StorefrontTabsNav activeTab={form.activeTab} onSelectTab={form.setActiveTab} primaryColor={form.primaryColor} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <form onSubmit={form.handleSubmit} className="xl:col-span-8 space-y-6">
          {form.activeTab === 'branding' && (
            <StorefrontBrandingTab
              storeName={form.storeName}
              slug={form.slug}
              tagline={form.tagline}
              bio={form.bio}
              logoUrl={form.logoUrl}
              heroSlides={form.heroSlides}
              onHeroSlidesChange={form.handleHeroSlidesChange}
              spotlightOneHeadline={form.spotlightOneHeadline}
              spotlightOneTagline={form.spotlightOneTagline}
              spotlightOneImageUrl={form.spotlightOneImageUrl}
              spotlightOneCtaText={form.spotlightOneCtaText}
              spotlightOneLinkUrl={form.spotlightOneLinkUrl}
              spotlightOneImageFit={form.spotlightOneImageFit}
              spotlightTwoHeadline={form.spotlightTwoHeadline}
              spotlightTwoTagline={form.spotlightTwoTagline}
              spotlightTwoImageUrl={form.spotlightTwoImageUrl}
              spotlightTwoCtaText={form.spotlightTwoCtaText}
              spotlightTwoLinkUrl={form.spotlightTwoLinkUrl}
              spotlightTwoImageFit={form.spotlightTwoImageFit}
              primaryColor={form.primaryColor}
              secondaryColor={form.secondaryColor}
              currency={initialConfig?.currency || 'GHS'}
              products={products}
              isActive={form.isActive}
              isPending={form.isPending}
              onNameChange={form.handleNameChange}
              onSlugChange={form.setSlug}
              onTaglineChange={form.setTagline}
              onBioChange={form.setBio}
              onLogoUrlChange={form.setLogoUrl}
              onSpotlightOneHeadlineChange={form.setSpotlightOneHeadline}
              onSpotlightOneTaglineChange={form.setSpotlightOneTagline}
              onSpotlightOneImageUrlChange={form.setSpotlightOneImageUrl}
              onSpotlightOneCtaTextChange={form.setSpotlightOneCtaText}
              onSpotlightOneLinkUrlChange={form.setSpotlightOneLinkUrl}
              onSpotlightOneImageFitChange={form.setSpotlightOneImageFit}
              onSpotlightTwoHeadlineChange={form.setSpotlightTwoHeadline}
              onSpotlightTwoTaglineChange={form.setSpotlightTwoTagline}
              onSpotlightTwoImageUrlChange={form.setSpotlightTwoImageUrl}
              onSpotlightTwoCtaTextChange={form.setSpotlightTwoCtaText}
              onSpotlightTwoLinkUrlChange={form.setSpotlightTwoLinkUrl}
              onSpotlightTwoImageFitChange={form.setSpotlightTwoImageFit}
              onPrimaryColorChange={form.setPrimaryColor}
              onSecondaryColorChange={form.setSecondaryColor}
              onIsActiveChange={form.setIsActive}
            />
          )}

          {form.activeTab === 'merchandising' && (
            <FeaturedProductsManager
              products={products}
              initialFeaturedIds={form.currentFeaturedIds}
              currency={initialConfig?.currency || 'GHS'}
              onFeaturedChange={form.setCurrentFeaturedIds}
            />
          )}

          {form.activeTab === 'domain' && (
            <DomainSettingsCard slug={form.slug || 'my-store'} initialDomainConfig={domainConfig} />
          )}

          {form.activeTab === 'policies' && (
            <StorefrontPoliciesTab
              whatsappPhone={form.whatsappPhone}
              instagramHandle={form.instagramHandle}
              tiktokHandle={form.tiktokHandle}
              deliveryPolicy={form.deliveryPolicy}
              primaryColor={form.primaryColor}
              isPending={form.isPending}
              onWhatsappPhoneChange={form.setWhatsappPhone}
              onInstagramHandleChange={form.setInstagramHandle}
              onTiktokHandleChange={form.setTiktokHandle}
              onDeliveryPolicyChange={form.setDeliveryPolicy}
            />
          )}
        </form>

        <div className="hidden xl:block xl:col-span-4 sticky top-6">
          <StorefrontLivePreview
            storeName={form.storeName}
            tagline={form.tagline}
            bio={form.bio}
            logoUrl={form.logoUrl}
            bannerUrl={form.bannerUrl}
            heroMode={form.heroMode}
            bannerHeadline={form.bannerHeadline}
            whatsappPhone={form.whatsappPhone}
            instagramHandle={form.instagramHandle}
            primaryColor={form.primaryColor}
            isActive={form.isActive}
          />
        </div>
      </div>
    </div>
  );
}
