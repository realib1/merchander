import { StorefrontHeroSlide, StorefrontCustomCollection } from '@/types/storefront';
import { StorefrontUpdateInput } from './storefront-config-schema';

export function buildUpdatedSettingsData(
  val: StorefrontUpdateInput,
  current: Record<string, unknown>,
  parsedHeroSlides?: StorefrontHeroSlide[],
  parsedCollections?: StorefrontCustomCollection[]
) {
  return {
    ...current,
    tagline: val.tagline || null,
    bio: val.bio || null,
    logo_url: val.logoUrl || null,
    banner_url: parsedHeroSlides?.[0]?.image_url ?? (val.bannerUrl || current.banner_url || null),
    hero_mode: val.heroMode || current.hero_mode || 'default',
    banner_headline: parsedHeroSlides?.[0]?.headline ?? (val.bannerHeadline || null),
    banner_tagline: parsedHeroSlides?.[0]?.tagline ?? (val.bannerTagline || null),
    banner_cta_text: parsedHeroSlides?.[0]?.cta_text ?? (val.bannerCtaText || null),
    banner_badge_text: parsedHeroSlides?.[0]?.badge_text ?? (val.bannerBadgeText || 'NEW ARRIVALS'),
    banner_link_type: parsedHeroSlides?.[0]?.link_type ?? (val.bannerLinkType || 'catalog'),
    banner_link_id: parsedHeroSlides?.[0]?.link_id ?? (val.bannerLinkId || null),
    banner_price_pill: parsedHeroSlides?.[0]?.price_pill ?? (val.bannerPricePill || null),
    banner_compare_at_price_pill: parsedHeroSlides?.[0]?.compare_at_price_pill ?? (val.bannerCompareAtPricePill || null),
    banner_starts_at: val.bannerStartsAt || null,
    banner_ends_at: val.bannerEndsAt || null,
    banner_contrast_theme: parsedHeroSlides?.[0]?.contrast_theme ?? (val.bannerContrastTheme || 'auto'),
    banner_image_fit: parsedHeroSlides?.[0]?.image_fit ?? (val.bannerImageFit || 'cover'),
    hero_slides: parsedHeroSlides || current.hero_slides || null,
    delivery_policy: val.deliveryPolicy || null,
    show_collections: val.showCollections ?? (current.show_collections as boolean | undefined) ?? false,
    custom_collections: parsedCollections || current.custom_collections || null,
    brand_primary_color: val.primaryColor || '#3b82f6',
    brand_secondary_color: val.secondaryColor || '#1e40af',
    social: {
      whatsapp: val.whatsappPhone || null,
      instagram: val.instagramHandle || null,
      tiktok: val.tiktokHandle || null,
    },
    spotlight_one: {
      headline: val.spotlightOneHeadline || null,
      tagline: val.spotlightOneTagline || null,
      image_url: val.spotlightOneImageUrl || null,
      cta_text: val.spotlightOneCtaText || null,
      link_url: val.spotlightOneLinkUrl || null,
      image_fit: val.spotlightOneImageFit || 'fit',
    },
    spotlight_two: {
      headline: val.spotlightTwoHeadline || null,
      tagline: val.spotlightTwoTagline || null,
      image_url: val.spotlightTwoImageUrl || null,
      cta_text: val.spotlightTwoCtaText || null,
      link_url: val.spotlightTwoLinkUrl || null,
      image_fit: val.spotlightTwoImageFit || 'fit',
    },
  };
}
