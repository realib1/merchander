'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { StorefrontConfig, StorefrontHeroSlide } from '@/types/storefront';
import { generateStoreSlug } from '@/utils/storefront';

export async function getStorefrontConfig(): Promise<StorefrontConfig | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    const [tenantRes, settingsRes, sfRes] = await Promise.all([
      supabase.from('tenants').select('name').eq('id', tenantId).single(),
      supabase.from('tenant_settings').select('*').eq('tenant_id', tenantId).single(),
      supabase.from('storefront_settings').select('*').eq('tenant_id', tenantId).maybeSingle(),
    ]);

    const tenantData = tenantRes.data;
    const settingsData = settingsRes.data as Record<string, unknown> | null;
    const customData = (settingsData?.settings_data as Record<string, unknown> | null) || {};
    const sfData = sfRes.data as Record<string, unknown> | null;

    const defaultName = (settingsData?.trading_name as string) || tenantData?.name || 'My Store';
    const defaultSlug = generateStoreSlug(defaultName) || `store-${tenantId.slice(0, 8)}`;

    const primaryColor =
      (sfData?.primary_color as string) ||
      (settingsData?.brand_primary_color as string) ||
      (customData?.brand_primary_color as string) ||
      '#3b82f6';

    const secondaryColor =
      (sfData?.secondary_color as string) ||
      (settingsData?.brand_secondary_color as string) ||
      (customData?.brand_secondary_color as string) ||
      '#1e40af';

    const logoUrl =
      (sfData?.logo_url as string) || (settingsData?.logo_url as string) || (customData?.logo_url as string) || null;

    const social = (customData?.social as Record<string, string> | undefined) || {};

    return {
      tenant_id: tenantId,
      store_name: (sfData?.store_name as string) || defaultName,
      slug: (sfData?.slug as string) || defaultSlug,
      tagline: (sfData?.tagline as string) || (customData?.tagline as string) || null,
      bio: (sfData?.bio as string) || (customData?.bio as string) || null,
      logo_url: logoUrl,
      banner_url: (sfData?.banner_url as string) || (customData?.banner_url as string) || null,
      hero_mode:
        (sfData?.hero_mode as 'banner' | 'featured_product' | 'default') ||
        (customData?.hero_mode as 'banner' | 'featured_product' | 'default') ||
        'default',
      banner_headline: (sfData?.banner_headline as string) || (customData?.banner_headline as string) || null,
      banner_tagline: (sfData?.banner_tagline as string) || (customData?.banner_tagline as string) || null,
      banner_cta_text: (sfData?.banner_cta_text as string) || (customData?.banner_cta_text as string) || null,
      banner_badge_text: (sfData?.banner_badge_text as string) || (customData?.banner_badge_text as string) || 'NEW ARRIVALS',
      banner_link_type: (sfData?.banner_link_type as 'catalog' | 'product' | 'category') || 'catalog',
      banner_link_id: (sfData?.banner_link_id as string) || null,
      banner_price_pill: (sfData?.banner_price_pill as string) || null,
      banner_compare_at_price_pill: (sfData?.banner_compare_at_price_pill as string) || (customData?.banner_compare_at_price_pill as string) || null,
      banner_starts_at: (sfData?.banner_starts_at as string) || null,
      banner_ends_at: (sfData?.banner_ends_at as string) || null,
      banner_contrast_theme: (sfData?.banner_contrast_theme as 'auto' | 'light' | 'dark') || 'auto',
      whatsapp_phone:
        (sfData?.whatsapp_phone as string) || social?.whatsapp || (settingsData?.business_phone as string) || null,
      instagram_handle: (sfData?.instagram_handle as string) || social?.instagram || null,
      tiktok_handle: (sfData?.tiktok_handle as string) || social?.tiktok || null,
      delivery_policy: (sfData?.delivery_policy as string) || (customData?.delivery_policy as string) || null,
      is_active: sfData?.is_active !== undefined ? Boolean(sfData.is_active) : true,
      currency: (sfData?.currency as string) || (settingsData?.store_currency as string) || 'GHS',
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      custom_domain: (sfData?.custom_domain as string) || (customData?.custom_domain as string) || null,
      show_collections:
        sfData?.show_collections !== undefined
          ? Boolean(sfData.show_collections)
          : customData?.show_collections !== undefined
          ? Boolean(customData.show_collections)
          : false,
      custom_collections:
        ((sfData?.custom_collections || customData?.custom_collections || settingsData?.custom_collections) as
          | StorefrontConfig['custom_collections']) || null,
      spotlight_one:
        ((sfData?.spotlight_one || settingsData?.spotlight_one || customData?.spotlight_one) as StorefrontConfig['spotlight_one']) || null,
      spotlight_two:
        ((sfData?.spotlight_two || settingsData?.spotlight_two || customData?.spotlight_two) as StorefrontConfig['spotlight_two']) || null,
      banner_image_fit:
        (sfData?.banner_image_fit as 'fit' | 'cover') ||
        (customData?.banner_image_fit as 'fit' | 'cover') ||
        'fit',
      hero_slides: (() => {
        const storedSlides = ((sfData?.hero_slides as unknown) || customData?.hero_slides || settingsData?.hero_slides) as
          | StorefrontHeroSlide[]
          | undefined;
        if (storedSlides && Array.isArray(storedSlides) && storedSlides.length > 0) {
          return storedSlides.map((s, idx) => ({
            ...s,
            id: s.id || `slide_${idx + 1}`,
            is_active: s.is_active !== false,
            image_fit: s.image_fit || (s.link_type === 'product' ? 'fit' : 'cover'),
          }));
        }
        return [
          {
            id: 'slide_1',
            is_active: true,
            image_url: (sfData?.banner_url as string) || (customData?.banner_url as string) || null,
            headline: (sfData?.banner_headline as string) || (customData?.banner_headline as string) || null,
            tagline: (sfData?.banner_tagline as string) || (customData?.banner_tagline as string) || null,
            badge_text:
              (sfData?.banner_badge_text as string) || (customData?.banner_badge_text as string) || 'NEW ARRIVALS',
            price_pill: (sfData?.banner_price_pill as string) || null,
            compare_at_price_pill: (sfData?.banner_compare_at_price_pill as string) || (customData?.banner_compare_at_price_pill as string) || null,
            cta_text: (sfData?.banner_cta_text as string) || (customData?.banner_cta_text as string) || 'Shop Now',
            link_type: (sfData?.banner_link_type as 'catalog' | 'product' | 'category') || 'catalog',
            link_id: (sfData?.banner_link_id as string) || null,
            contrast_theme: (sfData?.banner_contrast_theme as 'auto' | 'light' | 'dark') || 'auto',
            image_fit: (sfData?.banner_image_fit as 'fit' | 'cover') || 'cover',
          },
        ];
      })(),
    };
  } catch (err) {
    console.error('Error fetching storefront config:', err);
    return null;
  }
}
