'use client';

import React from 'react';
import { Loader2, Save } from 'lucide-react';
import { StorefrontHeroSlide, StorefrontCustomCollection } from '@/types/storefront';
import { StorefrontHeroCard } from './StorefrontHeroCard';
import { StorefrontSpotlightsCard } from './StorefrontSpotlightsCard';
import { StorefrontCollectionsCard } from './StorefrontCollectionsCard';
import { StoreIdentitySection } from './branding/StoreIdentitySection';
import { StoreThemePresetsSection } from './branding/StoreThemePresetsSection';
import { BRAND_THEME_PRESETS } from './branding/branding-presets';

export { BRAND_THEME_PRESETS };

interface StorefrontBrandingTabProps {
  storeName: string;
  slug: string;
  tagline: string;
  bio: string;
  logoUrl: string;
  heroSlides: StorefrontHeroSlide[];
  onHeroSlidesChange: (slides: StorefrontHeroSlide[]) => void;
  spotlightOneHeadline: string;
  spotlightOneTagline: string;
  spotlightOneImageUrl: string;
  spotlightOneCtaText: string;
  spotlightOneLinkUrl: string;
  spotlightOneImageFit?: 'fit' | 'cover';
  spotlightTwoHeadline: string;
  spotlightTwoTagline: string;
  spotlightTwoImageUrl: string;
  spotlightTwoCtaText: string;
  spotlightTwoLinkUrl: string;
  spotlightTwoImageFit?: 'fit' | 'cover';
  primaryColor: string;
  secondaryColor: string;
  currency?: string;
  products?: Array<{
    id: string;
    name: string;
    description?: string | null;
    price: number;
    stock: number;
    imageUrl: string | null;
  }>;
  isActive: boolean;
  isPending: boolean;
  onNameChange: (val: string) => void;
  onSlugChange: (val: string) => void;
  onTaglineChange: (val: string) => void;
  onBioChange: (val: string) => void;
  onLogoUrlChange: (val: string) => void;
  onSpotlightOneHeadlineChange: (val: string) => void;
  onSpotlightOneTaglineChange: (val: string) => void;
  onSpotlightOneImageUrlChange: (val: string) => void;
  onSpotlightOneCtaTextChange: (val: string) => void;
  onSpotlightOneLinkUrlChange: (val: string) => void;
  onSpotlightOneImageFitChange: (fit: 'fit' | 'cover') => void;
  onSpotlightTwoHeadlineChange: (val: string) => void;
  onSpotlightTwoTaglineChange: (val: string) => void;
  onSpotlightTwoImageUrlChange: (val: string) => void;
  onSpotlightTwoCtaTextChange: (val: string) => void;
  onSpotlightTwoLinkUrlChange: (val: string) => void;
  onSpotlightTwoImageFitChange: (fit: 'fit' | 'cover') => void;
  onPrimaryColorChange: (val: string) => void;
  onSecondaryColorChange: (val: string) => void;
  onIsActiveChange: (val: boolean) => void;
  showCollections: boolean;
  onShowCollectionsChange: (val: boolean) => void;
  customCollections?: StorefrontCustomCollection[];
  onCollectionsChange?: (collections: StorefrontCustomCollection[]) => void;
  categories?: Array<{ id: string; name: string }>;
}

export function StorefrontBrandingTab(props: StorefrontBrandingTabProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <StoreIdentitySection
        storeName={props.storeName}
        slug={props.slug}
        tagline={props.tagline}
        bio={props.bio}
        logoUrl={props.logoUrl}
        isActive={props.isActive}
        primaryColor={props.primaryColor}
        onNameChange={props.onNameChange}
        onSlugChange={props.onSlugChange}
        onTaglineChange={props.onTaglineChange}
        onBioChange={props.onBioChange}
        onLogoUrlChange={props.onLogoUrlChange}
        onIsActiveChange={props.onIsActiveChange}
      />

      <StoreThemePresetsSection
        primaryColor={props.primaryColor}
        secondaryColor={props.secondaryColor}
        onPrimaryColorChange={props.onPrimaryColorChange}
        onSecondaryColorChange={props.onSecondaryColorChange}
      />

      <StorefrontHeroCard
        heroSlides={props.heroSlides}
        primaryColor={props.primaryColor}
        currency={props.currency}
        products={props.products}
        onHeroSlidesChange={props.onHeroSlidesChange}
      />

      <StorefrontSpotlightsCard
        primaryColor={props.primaryColor}
        spotlightOneHeadline={props.spotlightOneHeadline}
        spotlightOneTagline={props.spotlightOneTagline}
        spotlightOneImageUrl={props.spotlightOneImageUrl}
        spotlightOneCtaText={props.spotlightOneCtaText}
        spotlightOneLinkUrl={props.spotlightOneLinkUrl}
        spotlightOneImageFit={props.spotlightOneImageFit}
        spotlightTwoHeadline={props.spotlightTwoHeadline}
        spotlightTwoTagline={props.spotlightTwoTagline}
        spotlightTwoImageUrl={props.spotlightTwoImageUrl}
        spotlightTwoCtaText={props.spotlightTwoCtaText}
        spotlightTwoLinkUrl={props.spotlightTwoLinkUrl}
        spotlightTwoImageFit={props.spotlightTwoImageFit}
        onSpotlightOneHeadlineChange={props.onSpotlightOneHeadlineChange}
        onSpotlightOneTaglineChange={props.onSpotlightOneTaglineChange}
        onSpotlightOneImageUrlChange={props.onSpotlightOneImageUrlChange}
        onSpotlightOneCtaTextChange={props.onSpotlightOneCtaTextChange}
        onSpotlightOneLinkUrlChange={props.onSpotlightOneLinkUrlChange}
        onSpotlightOneImageFitChange={props.onSpotlightOneImageFitChange}
        onSpotlightTwoHeadlineChange={props.onSpotlightTwoHeadlineChange}
        onSpotlightTwoTaglineChange={props.onSpotlightTwoTaglineChange}
        onSpotlightTwoImageUrlChange={props.onSpotlightTwoImageUrlChange}
        onSpotlightTwoCtaTextChange={props.onSpotlightTwoCtaTextChange}
        onSpotlightTwoLinkUrlChange={props.onSpotlightTwoLinkUrlChange}
        onSpotlightTwoImageFitChange={props.onSpotlightTwoImageFitChange}
      />

      <StorefrontCollectionsCard
        primaryColor={props.primaryColor}
        showCollections={props.showCollections}
        onShowCollectionsChange={props.onShowCollectionsChange}
        collections={props.customCollections}
        onCollectionsChange={props.onCollectionsChange}
        categories={props.categories}
        productCount={props.products?.length || 0}
      />

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={props.isPending}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: props.primaryColor }}
        >
          {props.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          <span>{props.isPending ? 'Saving Settings...' : 'Save All Changes'}</span>
        </button>
      </div>
    </div>
  );
}
