'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import { StorefrontHeroSlide } from '@/types/storefront';

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

    // Primary bucket: product-images (guaranteed public bucket), fallback: store-assets
    let uploadBucket = 'product-images';
    const { error: uploadError } = await storageClient.storage.from(uploadBucket).upload(fileName, buffer, {
      contentType: file.type || `image/${ext}`,
      upsert: true,
    });

    if (uploadError) {
      console.warn('product-images upload failed, trying store-assets:', uploadError.message);
      uploadBucket = 'store-assets';
      const { error: fallbackError } = await storageClient.storage.from(uploadBucket).upload(fileName, buffer, {
        contentType: file.type || `image/${ext}`,
        upsert: true,
      });
      if (fallbackError) {
        console.error('Storefront banner upload failed on both buckets:', fallbackError);
        return { error: `Upload failed: ${fallbackError.message}` };
      }
    }

    const { data: publicUrlData } = storageClient.storage.from(uploadBucket).getPublicUrl(fileName);
    const uploadedUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
    await syncUploadedBannerToDb(supabase, tenantId, uploadedUrl, formData);
    return { url: uploadedUrl };
  } catch (err) {
    console.error('Error uploading banner:', err);
    return { error: 'Failed to upload promotional banner' };
  }
}

async function syncUploadedBannerToDb(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  uploadedUrl: string,
  formData: FormData
) {
  if (formData.get('autoSync') !== 'true') return;

  try {
    const slideIndexStr = formData.get('slideIndex');
    const slideIndex = slideIndexStr !== null ? parseInt(String(slideIndexStr), 10) : 0;

    const [sfRes, tsRes] = await Promise.all([
      supabase
        .from('storefront_settings')
        .select('hero_slides, banner_url, banner_image_fit')
        .eq('tenant_id', tenantId)
        .maybeSingle(),
      supabase.from('tenant_settings').select('settings_data').eq('tenant_id', tenantId).maybeSingle(),
    ]);

    const sfData = (sfRes.data as Record<string, unknown> | null) || {};
    const currentSettings = (tsRes.data?.settings_data as Record<string, unknown> | null) || {};
    const existingSlides =
      (sfData.hero_slides as StorefrontHeroSlide[] | undefined) ||
      (currentSettings.hero_slides as StorefrontHeroSlide[] | undefined) ||
      [];
    const nextSlides = [...existingSlides];

    while (nextSlides.length <= slideIndex) {
      nextSlides.push({
        id: `slide_${nextSlides.length + 1}`,
        is_active: true,
        image_fit: 'cover',
      });
    }
    nextSlides[slideIndex] = {
      ...nextSlides[slideIndex],
      image_url: uploadedUrl,
      image_fit: nextSlides[slideIndex]?.image_fit || 'cover',
    };

    await Promise.all([
      supabase
        .from('storefront_settings')
        .update({
          hero_slides: nextSlides,
          ...(slideIndex === 0 ? { banner_url: uploadedUrl } : {}),
        })
        .eq('tenant_id', tenantId),
      supabase
        .from('tenant_settings')
        .update({
          settings_data: {
            ...currentSettings,
            hero_slides: nextSlides,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenantId),
    ]);

    if (slideIndex === 0) {
      await supabase.from('storefront_settings').update({ banner_url: uploadedUrl }).eq('tenant_id', tenantId);
    }

    revalidatePath('/dashboard/online-store');
  } catch (syncErr) {
    console.warn('Auto-sync uploaded image to DB warning:', syncErr);
  }
}
