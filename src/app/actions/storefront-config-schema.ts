import { z } from 'zod';
import { generateStoreSlug } from '@/utils/storefront';
import { StorefrontHeroSlide } from '@/types/storefront';

export const storefrontUpdateSchema = z.object({
  storeName: z.string().min(2, 'Store name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and dashes'),
  tagline: z.string().max(150).optional().or(z.literal('')),
  bio: z.string().max(500).optional().or(z.literal('')),
  logoUrl: z.string().optional().or(z.literal('')),
  bannerUrl: z.string().optional().or(z.literal('')),
  heroMode: z.enum(['banner', 'featured_product', 'default']).optional(),
  bannerHeadline: z.string().max(100).optional().or(z.literal('')),
  bannerTagline: z.string().max(150).optional().or(z.literal('')),
  bannerCtaText: z.string().max(40).optional().or(z.literal('')),
  bannerBadgeText: z.string().max(60).optional().or(z.literal('')),
  bannerLinkType: z.enum(['catalog', 'product', 'category']).optional(),
  bannerLinkId: z.string().optional().or(z.literal('')),
  bannerPricePill: z.string().max(50).optional().or(z.literal('')),
  bannerCompareAtPricePill: z.string().max(50).optional().or(z.literal('')),
  bannerStartsAt: z.string().optional().or(z.literal('')),
  bannerEndsAt: z.string().optional().or(z.literal('')),
  bannerContrastTheme: z.enum(['auto', 'light', 'dark']).optional(),
  bannerImageFit: z.enum(['fit', 'cover']).optional(),
  spotlightOneHeadline: z.string().max(100).optional().or(z.literal('')),
  spotlightOneTagline: z.string().max(150).optional().or(z.literal('')),
  spotlightOneImageUrl: z.string().optional().or(z.literal('')),
  spotlightOneCtaText: z.string().max(40).optional().or(z.literal('')),
  spotlightOneLinkUrl: z.string().max(200).optional().or(z.literal('')),
  spotlightOneImageFit: z.enum(['fit', 'cover']).optional(),
  spotlightTwoHeadline: z.string().max(100).optional().or(z.literal('')),
  spotlightTwoTagline: z.string().max(150).optional().or(z.literal('')),
  spotlightTwoImageUrl: z.string().optional().or(z.literal('')),
  spotlightTwoCtaText: z.string().max(40).optional().or(z.literal('')),
  spotlightTwoLinkUrl: z.string().max(200).optional().or(z.literal('')),
  spotlightTwoImageFit: z.enum(['fit', 'cover']).optional(),
  whatsappPhone: z.string().max(25).optional().or(z.literal('')),
  instagramHandle: z.string().max(60).optional().or(z.literal('')),
  tiktokHandle: z.string().max(60).optional().or(z.literal('')),
  deliveryPolicy: z.string().max(500).optional().or(z.literal('')),
  primaryColor: z.string().max(30).optional().or(z.literal('')),
  secondaryColor: z.string().max(30).optional().or(z.literal('')),
  isActive: z.boolean(),
  currency: z.string().max(10).default('GHS'),
});

export type StorefrontUpdateInput = z.infer<typeof storefrontUpdateSchema>;

export function parseHeroSlidesFromFormData(formData: FormData): StorefrontHeroSlide[] | undefined {
  const heroSlidesRaw = formData.get('heroSlides') as string | null;
  if (!heroSlidesRaw) return undefined;
  try {
    const parsed = JSON.parse(heroSlidesRaw);
    if (!Array.isArray(parsed)) return undefined;
    return parsed.slice(0, 3).map((s: Record<string, unknown>, idx: number) => ({
      id: String(s.id || `slide_${idx + 1}`),
      is_active: s.is_active !== false,
      image_url: (s.image_url as string) || null,
      headline: (s.headline as string) || null,
      tagline: (s.tagline as string) || null,
      badge_text: (s.badge_text as string) || null,
      price_pill: (s.price_pill as string) || null,
      compare_at_price_pill: (s.compare_at_price_pill as string) || null,
      cta_text: (s.cta_text as string) || 'Shop Now',
      link_type: (s.link_type as 'catalog' | 'product' | 'category') || 'catalog',
      link_id: (s.link_id as string) || null,
      contrast_theme: (s.contrast_theme as 'auto' | 'light' | 'dark') || 'auto',
      image_fit: (s.image_fit as 'fit' | 'cover') || (s.link_type === 'product' ? 'fit' : 'cover'),
    }));
  } catch (err) {
    console.warn('Failed to parse heroSlides payload:', err);
    return undefined;
  }
}

export function extractStorefrontFormData(
  formData: FormData,
  parsedHeroSlides?: StorefrontHeroSlide[]
): StorefrontUpdateInput {
  return {
    storeName: formData.get('storeName') as string,
    slug: generateStoreSlug((formData.get('slug') as string) || ''),
    tagline: (formData.get('tagline') as string) || undefined,
    bio: (formData.get('bio') as string) || undefined,
    logoUrl: (formData.get('logoUrl') as string) || undefined,
    bannerUrl: (formData.get('bannerUrl') as string) || undefined,
    heroMode: (formData.get('heroMode') as 'banner' | 'featured_product' | 'default') || undefined,
    bannerHeadline: (formData.get('bannerHeadline') as string) || undefined,
    bannerTagline: (formData.get('bannerTagline') as string) || undefined,
    bannerCtaText: (formData.get('bannerCtaText') as string) || undefined,
    bannerBadgeText: (formData.get('bannerBadgeText') as string) || undefined,
    bannerLinkType: (formData.get('bannerLinkType') as 'catalog' | 'product' | 'category') || undefined,
    bannerLinkId: (formData.get('bannerLinkId') as string) || undefined,
    bannerPricePill: (formData.get('bannerPricePill') as string) || undefined,
    bannerCompareAtPricePill: (formData.get('bannerCompareAtPricePill') as string) || undefined,
    bannerStartsAt: (formData.get('bannerStartsAt') as string) || undefined,
    bannerEndsAt: (formData.get('bannerEndsAt') as string) || undefined,
    bannerContrastTheme: (formData.get('bannerContrastTheme') as 'auto' | 'light' | 'dark') || 'auto',
    bannerImageFit: (formData.get('bannerImageFit') as 'fit' | 'cover') || parsedHeroSlides?.[0]?.image_fit || undefined,
    spotlightOneHeadline: (formData.get('spotlightOneHeadline') as string) || undefined,
    spotlightOneTagline: (formData.get('spotlightOneTagline') as string) || undefined,
    spotlightOneImageUrl: (formData.get('spotlightOneImageUrl') as string) || undefined,
    spotlightOneCtaText: (formData.get('spotlightOneCtaText') as string) || undefined,
    spotlightOneLinkUrl: (formData.get('spotlightOneLinkUrl') as string) || undefined,
    spotlightOneImageFit: (formData.get('spotlightOneImageFit') as 'fit' | 'cover') || 'fit',
    spotlightTwoHeadline: (formData.get('spotlightTwoHeadline') as string) || undefined,
    spotlightTwoTagline: (formData.get('spotlightTwoTagline') as string) || undefined,
    spotlightTwoImageUrl: (formData.get('spotlightTwoImageUrl') as string) || undefined,
    spotlightTwoCtaText: (formData.get('spotlightTwoCtaText') as string) || undefined,
    spotlightTwoLinkUrl: (formData.get('spotlightTwoLinkUrl') as string) || undefined,
    spotlightTwoImageFit: (formData.get('spotlightTwoImageFit') as 'fit' | 'cover') || 'fit',
    whatsappPhone: (formData.get('whatsappPhone') as string) || undefined,
    instagramHandle: (formData.get('instagramHandle') as string) || undefined,
    tiktokHandle: (formData.get('tiktokHandle') as string) || undefined,
    deliveryPolicy: (formData.get('deliveryPolicy') as string) || undefined,
    primaryColor: (formData.get('primaryColor') as string) || undefined,
    secondaryColor: (formData.get('secondaryColor') as string) || undefined,
    isActive: formData.get('isActive') === 'true',
    currency: (formData.get('currency') as string) || 'GHS',
  };
}
