'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { StorefrontConfig } from '@/types/storefront';
import { generateStoreSlug } from '@/utils/storefront';
import { getPublicStorefrontBySlug, submitPublicStoreOrder } from './storefront-public';

export { getPublicStorefrontBySlug, submitPublicStoreOrder };

const storefrontUpdateSchema = z.object({
  storeName: z.string().min(2, 'Store name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and dashes'),
  tagline: z.string().max(150).optional().or(z.literal('')),
  bio: z.string().max(500).optional().or(z.literal('')),
  logoUrl: z.string().url('Invalid logo URL').optional().or(z.literal('')),
  bannerUrl: z.string().url('Invalid banner URL').optional().or(z.literal('')),
  whatsappPhone: z.string().max(25).optional().or(z.literal('')),
  instagramHandle: z.string().max(60).optional().or(z.literal('')),
  tiktokHandle: z.string().max(60).optional().or(z.literal('')),
  deliveryPolicy: z.string().max(500).optional().or(z.literal('')),
  isActive: z.boolean(),
  currency: z.string().max(10).default('GHS'),
});

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Failed to update storefront';
}

export async function getStorefrontConfig(): Promise<StorefrontConfig | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    try {
      const { data: storeConfig, error } = await supabase
        .from('storefront_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (!error && storeConfig) {
        return storeConfig as StorefrontConfig;
      }
    } catch {
      // Table may not exist yet, fallback to tenant profile
    }

    const [tenantRes, settingsRes] = await Promise.all([
      supabase.from('tenants').select('name').eq('id', tenantId).single(),
      supabase.from('tenant_settings').select('*').eq('tenant_id', tenantId).single(),
    ]);

    const defaultName = settingsRes.data?.trading_name || tenantRes.data?.name || 'My Store';
    const defaultSlug = generateStoreSlug(defaultName) || `store-${tenantId.slice(0, 8)}`;

    return {
      tenant_id: tenantId,
      store_name: defaultName,
      slug: defaultSlug,
      tagline: null,
      bio: null,
      logo_url: null,
      banner_url: null,
      whatsapp_phone: null,
      instagram_handle: null,
      tiktok_handle: null,
      delivery_policy: null,
      is_active: true,
      currency: settingsRes.data?.store_currency || 'GHS',
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
      whatsappPhone: (formData.get('whatsappPhone') as string) || undefined,
      instagramHandle: (formData.get('instagramHandle') as string) || undefined,
      tiktokHandle: (formData.get('tiktokHandle') as string) || undefined,
      deliveryPolicy: (formData.get('deliveryPolicy') as string) || undefined,
      isActive: formData.get('isActive') === 'true',
      currency: (formData.get('currency') as string) || 'GHS',
    };

    const validation = storefrontUpdateSchema.safeParse(rawData);
    if (!validation.success) {
      return { error: validation.error.errors[0].message };
    }

    const val = validation.data;

    await Promise.all([
      supabase.from('tenants').update({ name: val.storeName }).eq('id', tenantId),
      supabase
        .from('tenant_settings')
        .update({
          trading_name: val.storeName,
          store_currency: val.currency,
        })
        .eq('tenant_id', tenantId),
    ]);

    const { error: sfError } = await supabase.from('storefront_settings').upsert(
      {
        tenant_id: tenantId,
        store_name: val.storeName,
        slug: val.slug,
        tagline: val.tagline || null,
        bio: val.bio || null,
        logo_url: val.logoUrl || null,
        banner_url: val.bannerUrl || null,
        whatsapp_phone: val.whatsappPhone || null,
        instagram_handle: val.instagramHandle || null,
        tiktok_handle: val.tiktokHandle || null,
        delivery_policy: val.deliveryPolicy || null,
        is_active: val.isActive,
        currency: val.currency,
      },
      { onConflict: 'tenant_id' }
    );

    if (sfError) {
      console.warn('storefront_settings upsert warning:', sfError);
      if (sfError.message?.includes('duplicate')) {
        return { error: 'This store slug is already taken. Please choose another link slug.' };
      }
      if (
        sfError.code === '42P01' ||
        sfError.code === 'PGRST204' ||
        sfError.code === 'PGRST205' ||
        sfError.message?.includes('does not exist') ||
        sfError.message?.includes('schema cache')
      ) {
        revalidatePath('/dashboard/online-store');
        revalidatePath(`/store/${val.slug}`);
        return { success: true, slug: val.slug };
      }
      throw sfError;
    }

    revalidatePath('/dashboard/online-store');
    revalidatePath(`/store/${val.slug}`);
    return { success: true, slug: val.slug };
  } catch (err: unknown) {
    const message = extractErrorMessage(err);
    console.error('updateStorefrontConfig error:', err);
    return {
      error: message.includes('duplicate') ? 'This store slug is already taken. Please choose another.' : message,
    };
  }
}
