'use client';

import { useState, useTransition } from 'react';
import { StorefrontConfig, CustomDomainConfig, StorefrontHeroSlide, StorefrontCustomCollection } from '@/types/storefront';
import { DEFAULT_COLLECTIONS } from '../components/StorefrontCollectionsCard';
import { updateStorefrontConfig } from '@/app/actions/storefront';
import { generateStoreSlug } from '@/utils/storefront';
import { getStorefrontSubdomainUrl } from '@/utils/domain';
import { toast } from 'sonner';

export type StorefrontTab = 'branding' | 'merchandising' | 'domain' | 'policies';

export function useStorefrontSettingsForm(
  initialConfig: StorefrontConfig | null,
  domainConfig: CustomDomainConfig | null = null,
  featuredProductIds: string[] = []
) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<StorefrontTab>('branding');

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
  const [showCollections, setShowCollections] = useState(Boolean(initialConfig?.show_collections));
  const [customCollections, setCustomCollections] = useState<StorefrontCustomCollection[]>(() => {
    if (initialConfig?.custom_collections && initialConfig.custom_collections.length > 0) {
      return initialConfig.custom_collections;
    }
    return DEFAULT_COLLECTIONS;
  });
  const [bannerUrl, setBannerUrl] = useState(initialConfig?.banner_url || '');
  const heroMode = initialConfig?.hero_mode || 'default';
  const [bannerHeadline, setBannerHeadline] = useState(initialConfig?.banner_headline || '');
  const [bannerTagline, setBannerTagline] = useState(initialConfig?.banner_tagline || '');
  const [bannerCtaText, setBannerCtaText] = useState(initialConfig?.banner_cta_text || '');
  const [bannerBadgeText, setBannerBadgeText] = useState(initialConfig?.banner_badge_text || 'NEW ARRIVALS');
  const [bannerLinkType, setBannerLinkType] = useState<'catalog' | 'product' | 'category'>(
    initialConfig?.banner_link_type || 'catalog'
  );
  const [bannerLinkId, setBannerLinkId] = useState(initialConfig?.banner_link_id || '');
  const [bannerPricePill, setBannerPricePill] = useState(initialConfig?.banner_price_pill || '');
  const bannerStartsAt = initialConfig?.banner_starts_at
    ? new Date(initialConfig.banner_starts_at).toISOString().slice(0, 16)
    : '';
  const bannerEndsAt = initialConfig?.banner_ends_at
    ? new Date(initialConfig.banner_ends_at).toISOString().slice(0, 16)
    : '';
  const [bannerContrastTheme, setBannerContrastTheme] = useState<'auto' | 'light' | 'dark'>(
    initialConfig?.banner_contrast_theme || 'auto'
  );
  const [bannerImageFit, setBannerImageFit] = useState<'fit' | 'cover'>(
    initialConfig?.banner_image_fit || (initialConfig?.hero_slides?.[0]?.image_fit as 'fit' | 'cover') || 'cover'
  );
  const [spotlightOneHeadline, setSpotlightOneHeadline] = useState(initialConfig?.spotlight_one?.headline || '');
  const [spotlightOneTagline, setSpotlightOneTagline] = useState(initialConfig?.spotlight_one?.tagline || '');
  const [spotlightOneImageUrl, setSpotlightOneImageUrl] = useState(initialConfig?.spotlight_one?.image_url || '');
  const [spotlightOneCtaText, setSpotlightOneCtaText] = useState(initialConfig?.spotlight_one?.cta_text || '');
  const [spotlightOneLinkUrl, setSpotlightOneLinkUrl] = useState(initialConfig?.spotlight_one?.link_url || '');
  const [spotlightOneImageFit, setSpotlightOneImageFit] = useState<'fit' | 'cover'>(
    initialConfig?.spotlight_one?.image_fit || 'fit'
  );
  const [spotlightTwoHeadline, setSpotlightTwoHeadline] = useState(initialConfig?.spotlight_two?.headline || '');
  const [spotlightTwoTagline, setSpotlightTwoTagline] = useState(initialConfig?.spotlight_two?.tagline || '');
  const [spotlightTwoImageUrl, setSpotlightTwoImageUrl] = useState(initialConfig?.spotlight_two?.image_url || '');
  const [spotlightTwoCtaText, setSpotlightTwoCtaText] = useState(initialConfig?.spotlight_two?.cta_text || '');
  const [spotlightTwoLinkUrl, setSpotlightTwoLinkUrl] = useState(initialConfig?.spotlight_two?.link_url || '');
  const [spotlightTwoImageFit, setSpotlightTwoImageFit] = useState<'fit' | 'cover'>(
    initialConfig?.spotlight_two?.image_fit || 'fit'
  );
  const [currentFeaturedIds, setCurrentFeaturedIds] = useState<string[]>(featuredProductIds);

  const [heroSlides, setHeroSlides] = useState<StorefrontHeroSlide[]>(() => {
    if (initialConfig?.hero_slides && initialConfig.hero_slides.length > 0) return initialConfig.hero_slides;
    return [
      {
        id: 'slide_1',
        is_active: true,
        image_url: initialConfig?.banner_url || null,
        headline: initialConfig?.banner_headline || 'Everyday Essentials.',
        tagline: initialConfig?.banner_tagline || 'Quality, style and comfort in one place.',
        badge_text: initialConfig?.banner_badge_text || 'NEW ARRIVALS',
        price_pill: initialConfig?.banner_price_pill || '',
        cta_text: initialConfig?.banner_cta_text || 'Shop Now',
        link_type: initialConfig?.banner_link_type || 'catalog',
        link_id: initialConfig?.banner_link_id || null,
        contrast_theme: initialConfig?.banner_contrast_theme || 'auto',
        image_fit: initialConfig?.banner_image_fit || 'cover',
      },
    ];
  });

  const handleHeroSlidesChange = (newSlides: StorefrontHeroSlide[]) => {
    setHeroSlides(newSlides);
    const primarySlide = newSlides.find((s) => s.is_active) || newSlides[0];
    if (primarySlide) {
      setBannerUrl(primarySlide.image_url || '');
      setBannerHeadline(primarySlide.headline || '');
      setBannerTagline(primarySlide.tagline || '');
      setBannerCtaText(primarySlide.cta_text || '');
      setBannerBadgeText(primarySlide.badge_text || '');
      setBannerPricePill(primarySlide.price_pill || '');
      setBannerLinkType(primarySlide.link_type || 'catalog');
      setBannerLinkId(primarySlide.link_id || '');
      setBannerContrastTheme(primarySlide.contrast_theme || 'auto');
      if (primarySlide.image_fit) setBannerImageFit(primarySlide.image_fit);
    }
  };

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
      formData.append('bannerBadgeText', bannerBadgeText);
      formData.append('bannerLinkType', bannerLinkType);
      formData.append('bannerLinkId', bannerLinkId);
      formData.append('bannerPricePill', bannerPricePill);
      formData.append('bannerStartsAt', bannerStartsAt);
      formData.append('bannerEndsAt', bannerEndsAt);
      formData.append('bannerContrastTheme', bannerContrastTheme);
      formData.append('bannerImageFit', bannerImageFit);
      formData.append('spotlightOneHeadline', spotlightOneHeadline);
      formData.append('spotlightOneTagline', spotlightOneTagline);
      formData.append('spotlightOneImageUrl', spotlightOneImageUrl);
      formData.append('spotlightOneCtaText', spotlightOneCtaText);
      formData.append('spotlightOneLinkUrl', spotlightOneLinkUrl);
      formData.append('spotlightOneImageFit', spotlightOneImageFit);
      formData.append('spotlightTwoHeadline', spotlightTwoHeadline);
      formData.append('spotlightTwoTagline', spotlightTwoTagline);
      formData.append('spotlightTwoImageUrl', spotlightTwoImageUrl);
      formData.append('spotlightTwoCtaText', spotlightTwoCtaText);
      formData.append('spotlightTwoLinkUrl', spotlightTwoLinkUrl);
      formData.append('spotlightTwoImageFit', spotlightTwoImageFit);
      formData.append('whatsappPhone', whatsappPhone);
      formData.append('instagramHandle', instagramHandle);
      formData.append('tiktokHandle', tiktokHandle);
      formData.append('deliveryPolicy', deliveryPolicy);
      formData.append('primaryColor', primaryColor);
      formData.append('secondaryColor', secondaryColor);
      formData.append('isActive', String(isActive));
      formData.append('showCollections', String(showCollections));
      formData.append('customCollections', JSON.stringify(customCollections));
      formData.append('currency', initialConfig?.currency || 'GHS');
      formData.append('heroSlides', JSON.stringify(heroSlides));

      const res = await updateStorefrontConfig(formData);
      if (res.error) toast.error(res.error);
      else toast.success('Storefront settings saved successfully');
    });
  };

  return {
    isPending,
    activeTab,
    setActiveTab,
    storeName,
    setStoreName,
    handleNameChange,
    slug,
    setSlug,
    tagline,
    setTagline,
    bio,
    setBio,
    logoUrl,
    setLogoUrl,
    bannerUrl,
    heroMode,
    bannerHeadline,
    whatsappPhone,
    setWhatsappPhone,
    instagramHandle,
    setInstagramHandle,
    tiktokHandle,
    setTiktokHandle,
    deliveryPolicy,
    setDeliveryPolicy,
    primaryColor,
    setPrimaryColor,
    secondaryColor,
    setSecondaryColor,
    isActive,
    setIsActive,
    publicUrl,
    heroSlides,
    handleHeroSlidesChange,
    spotlightOneHeadline,
    setSpotlightOneHeadline,
    spotlightOneTagline,
    setSpotlightOneTagline,
    spotlightOneImageUrl,
    setSpotlightOneImageUrl,
    spotlightOneCtaText,
    setSpotlightOneCtaText,
    spotlightOneLinkUrl,
    setSpotlightOneLinkUrl,
    spotlightOneImageFit,
    setSpotlightOneImageFit,
    spotlightTwoHeadline,
    setSpotlightTwoHeadline,
    spotlightTwoTagline,
    setSpotlightTwoTagline,
    spotlightTwoImageUrl,
    setSpotlightTwoImageUrl,
    spotlightTwoCtaText,
    setSpotlightTwoCtaText,
    spotlightTwoLinkUrl,
    setSpotlightTwoLinkUrl,
    spotlightTwoImageFit,
    setSpotlightTwoImageFit,
    currentFeaturedIds,
    setCurrentFeaturedIds,
    showCollections,
    setShowCollections,
    customCollections,
    setCustomCollections,
    handleSubmit,
  };
}
