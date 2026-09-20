'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import {
  storefrontUpdateSchema,
  parseHeroSlidesFromFormData,
  parseCollectionsFromFormData,
  extractStorefrontFormData,
} from './storefront-config-schema';
import { buildUpdatedSettingsData } from './storefront-settings-builder';

export async function updateStorefrontConfig(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') {
      return { error: 'Insufficient permissions to modify storefront settings' };
    }

    const parsedHeroSlides = parseHeroSlidesFromFormData(formData);
    const parsedCollections = parseCollectionsFromFormData(formData);
    const rawData = extractStorefrontFormData(formData, parsedHeroSlides);

    const validation = storefrontUpdateSchema.safeParse(rawData);
    if (!validation.success) {
      return { error: validation.error.errors[0].message };
    }

    const val = validation.data;

    // 1. Fetch existing settings_data to merge cleanly
    const { data: existingSettings } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const currentSettingsData = (existingSettings?.settings_data as Record<string, unknown>) || {};
    const updatedSettingsData = buildUpdatedSettingsData(val, currentSettingsData, parsedHeroSlides, parsedCollections);

    // 2. Update tenants & tenant_settings
    await supabase.from('tenants').update({ name: val.storeName }).eq('id', tenantId);
    await supabase.from('tenant_settings').upsert(
      {
        tenant_id: tenantId,
        trading_name: val.storeName,
        store_currency: val.currency,
        logo_url: val.logoUrl || null,
        brand_primary_color: val.primaryColor || '#3b82f6',
        brand_secondary_color: val.secondaryColor || '#1e40af',
        settings_data: updatedSettingsData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    );

    // 3. Upsert storefront_settings preserving featured_product_ids and banner_url
    const { data: existingSf } = await supabase
      .from('storefront_settings')
      .select('featured_product_ids, banner_url')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const featuredProductIds = existingSf?.featured_product_ids ?? currentSettingsData.featured_product_ids ?? [];
    const finalBannerUrl = val.bannerUrl !== undefined ? val.bannerUrl : existingSf?.banner_url || null;

    const { error: sfError } = await supabase.from('storefront_settings').upsert(
      {
        tenant_id: tenantId,
        store_name: val.storeName,
        slug: val.slug,
        tagline: val.tagline || null,
        bio: val.bio || null,
        logo_url: val.logoUrl || null,
        banner_url: finalBannerUrl,
        hero_mode: val.heroMode || 'default',
        banner_headline: val.bannerHeadline || null,
        banner_tagline: val.bannerTagline || null,
        banner_cta_text: val.bannerCtaText || null,
        banner_badge_text: val.bannerBadgeText || 'NEW ARRIVALS',
        banner_link_type: val.bannerLinkType || 'catalog',
        banner_link_id: val.bannerLinkId || null,
        banner_price_pill: val.bannerPricePill || null,
        banner_starts_at: val.bannerStartsAt ? new Date(val.bannerStartsAt).toISOString() : null,
        banner_ends_at: val.bannerEndsAt ? new Date(val.bannerEndsAt).toISOString() : null,
        banner_contrast_theme: val.bannerContrastTheme || 'auto',
        banner_image_fit: parsedHeroSlides?.[0]?.image_fit || val.bannerImageFit || 'cover',
        hero_slides: parsedHeroSlides || null,
        spotlight_one: updatedSettingsData.spotlight_one,
        spotlight_two: updatedSettingsData.spotlight_two,
        whatsapp_phone: val.whatsappPhone || null,
        instagram_handle: val.instagramHandle || null,
        tiktok_handle: val.tiktokHandle || null,
        delivery_policy: val.deliveryPolicy || null,
        primary_color: val.primaryColor || '#3b82f6',
        secondary_color: val.secondaryColor || '#1e40af',
        show_collections: val.showCollections ?? false,
        custom_collections: parsedCollections || null,
        is_active: val.isActive,
        currency: val.currency,
        featured_product_ids: featuredProductIds,
      },
      { onConflict: 'tenant_id' }
    );

    if (sfError) {
      console.warn('storefront_settings upsert warning:', sfError);
      if (sfError.message?.includes('duplicate') || sfError.message?.includes('unique')) {
        return { error: 'This store slug is already taken. Please choose another link slug.' };
      }
    }

    revalidatePath('/dashboard/online-store');
    revalidatePath('/dashboard/settings/business-profile');
    revalidatePath(`/store/${val.slug}`);
    return { success: true, slug: val.slug };
  } catch (err) {
    console.error('Error updating storefront:', err);
    return { error: 'Failed to update storefront configuration' };
  }
}
