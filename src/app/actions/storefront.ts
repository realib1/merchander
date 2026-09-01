'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { StorefrontConfig } from '@/types/storefront';
import { generateStoreSlug } from '@/utils/storefront';
import { getPublicStorefrontBySlug, submitPublicStoreOrder } from './storefront-public';
import { submitStorefrontOrder } from './storefront-order';
import { getStorefrontOrderTracking } from './storefront-tracking';
import { syncGuestWishlist } from './storefront-wishlist';

export {
  getPublicStorefrontBySlug,
  submitPublicStoreOrder,
  submitStorefrontOrder,
  getStorefrontOrderTracking,
  syncGuestWishlist,
};

const storefrontUpdateSchema = z.object({
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
  whatsappPhone: z.string().max(25).optional().or(z.literal('')),
  instagramHandle: z.string().max(60).optional().or(z.literal('')),
  tiktokHandle: z.string().max(60).optional().or(z.literal('')),
  deliveryPolicy: z.string().max(500).optional().or(z.literal('')),
  primaryColor: z.string().max(30).optional().or(z.literal('')),
  secondaryColor: z.string().max(30).optional().or(z.literal('')),
  isActive: z.boolean(),
  currency: z.string().max(10).default('GHS'),
});

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
    };
  } catch (err) {
    console.error('Error fetching storefront config:', err);
    return null;
  }
}

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

    const rawData = {
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
      whatsappPhone: (formData.get('whatsappPhone') as string) || undefined,
      instagramHandle: (formData.get('instagramHandle') as string) || undefined,
      tiktokHandle: (formData.get('tiktokHandle') as string) || undefined,
      deliveryPolicy: (formData.get('deliveryPolicy') as string) || undefined,
      primaryColor: (formData.get('primaryColor') as string) || undefined,
      secondaryColor: (formData.get('secondaryColor') as string) || undefined,
      isActive: formData.get('isActive') === 'true',
      currency: (formData.get('currency') as string) || 'GHS',
    };

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
      .single();

    const currentSettingsData = (existingSettings?.settings_data as Record<string, unknown>) || {};
    const updatedSettingsData = {
      ...currentSettingsData,
      tagline: val.tagline || null,
      bio: val.bio || null,
      logo_url: val.logoUrl || null,
      banner_url: val.bannerUrl || currentSettingsData.banner_url || null,
      hero_mode: val.heroMode || currentSettingsData.hero_mode || 'default',
      banner_headline: val.bannerHeadline || null,
      banner_tagline: val.bannerTagline || null,
      banner_cta_text: val.bannerCtaText || null,
      delivery_policy: val.deliveryPolicy || null,
      brand_primary_color: val.primaryColor || '#3b82f6',
      brand_secondary_color: val.secondaryColor || '#1e40af',
      social: {
        whatsapp: val.whatsappPhone || null,
        instagram: val.instagramHandle || null,
        tiktok: val.tiktokHandle || null,
      },
    };

    // 2. Update tenants & tenant_settings
    await supabase.from('tenants').update({ name: val.storeName }).eq('id', tenantId);
    await supabase
      .from('tenant_settings')
      .update({
        trading_name: val.storeName,
        store_currency: val.currency,
        logo_url: val.logoUrl || null,
        brand_primary_color: val.primaryColor || '#3b82f6',
        brand_secondary_color: val.secondaryColor || '#1e40af',
        settings_data: updatedSettingsData,
      })
      .eq('tenant_id', tenantId);

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
        whatsapp_phone: val.whatsappPhone || null,
        instagram_handle: val.instagramHandle || null,
        tiktok_handle: val.tiktokHandle || null,
        delivery_policy: val.deliveryPolicy || null,
        primary_color: val.primaryColor || '#3b82f6',
        secondary_color: val.secondaryColor || '#1e40af',
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

export async function uploadStorefrontBanner(formData: FormData): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') {
      return { error: 'Insufficient permissions to upload banner' };
    }

    const bannerFile = formData.get('bannerFile');
    if (!bannerFile || typeof bannerFile !== 'object' || !('arrayBuffer' in bannerFile)) {
      return { error: 'No banner image file provided' };
    }

    const file = bannerFile as File;
    if (file.size > 10 * 1024 * 1024) {
      return { error: 'Banner file must be smaller than 10MB' };
    }

    const rawExt = file.name.split('.').pop()?.toLowerCase() || 'png';
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
    const fileName = `banners/${tenantId}_banner_${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let storageClient = supabase;
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        storageClient = createAdminClient() as unknown as typeof supabase;
      }
    } catch {
      storageClient = supabase;
    }

    const { error: uploadError } = await storageClient.storage.from('store-assets').upload(fileName, buffer, {
      contentType: file.type || `image/${ext}`,
      upsert: true,
    });

    if (uploadError) {
      const { error: fallbackError } = await storageClient.storage.from('products').upload(fileName, buffer, {
        contentType: file.type || `image/${ext}`,
        upsert: true,
      });
      if (fallbackError) {
        return { error: uploadError.message || 'Failed to upload banner' };
      }
      const { data: publicUrlData } = storageClient.storage.from('products').getPublicUrl(fileName);
      return { url: publicUrlData.publicUrl };
    }

    const { data: publicUrlData } = storageClient.storage.from('store-assets').getPublicUrl(fileName);
    return { url: publicUrlData.publicUrl };
  } catch (err) {
    console.error('Error uploading banner:', err);
    return { error: 'Failed to upload promotional banner' };
  }
}
