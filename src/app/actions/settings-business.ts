'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import { BusinessHoursSettings, NotificationSettings } from '@/types/settings';

const DEFAULT_HOURS: BusinessHoursSettings = {
  timezone: 'GMT (Greenwich Mean Time)',
  days: [
    { id: 'mon', name: 'Monday', isOpen: true, openTime: '08:00 AM', closeTime: '06:00 PM' },
    { id: 'tue', name: 'Tuesday', isOpen: true, openTime: '08:00 AM', closeTime: '06:00 PM' },
    { id: 'wed', name: 'Wednesday', isOpen: true, openTime: '08:00 AM', closeTime: '06:00 PM' },
    { id: 'thu', name: 'Thursday', isOpen: true, openTime: '08:00 AM', closeTime: '06:00 PM' },
    { id: 'fri', name: 'Friday', isOpen: true, openTime: '08:00 AM', closeTime: '06:00 PM' },
    { id: 'sat', name: 'Saturday', isOpen: true, openTime: '09:00 AM', closeTime: '04:00 PM' },
    { id: 'sun', name: 'Sunday', isOpen: false, openTime: '10:00 AM', closeTime: '02:00 PM' },
  ],
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emailNewOrder: true,
  emailPaymentReceived: true,
  emailLowInventory: true,
  inAppOrderAlerts: true,
  channelOrderAlerts: true,
};

export async function getBusinessHours(): Promise<BusinessHoursSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_HOURS;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    const custom = (data?.settings_data as Record<string, unknown> | null)?.business_hours;
    if (custom && typeof custom === 'object') {
      return custom as unknown as BusinessHoursSettings;
    }
  } catch (err) {
    console.error('Error fetching business hours:', err);
  }
  return DEFAULT_HOURS;
}

export async function updateBusinessHours(payload: BusinessHoursSettings) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') {
      return { error: 'Insufficient permissions' };
    }

    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const updatedData = { ...currentData, business_hours: payload };

    const { error } = await supabase.from('tenant_settings').upsert(
      {
        tenant_id: tenantId,
        settings_data: updatedData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    );

    if (error) throw error;

    revalidatePath('/dashboard/settings/hours');
    revalidatePath('/dashboard/settings/business-hours');
    return { success: true };
  } catch (err) {
    console.error('Error saving business hours:', err);
    return { error: 'Failed to update business hours' };
  }
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_NOTIFICATIONS;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    const custom = (data?.settings_data as Record<string, unknown> | null)?.notifications;
    if (custom && typeof custom === 'object') {
      return custom as unknown as NotificationSettings;
    }
  } catch (err) {
    console.error('Error fetching notification settings:', err);
  }
  return DEFAULT_NOTIFICATIONS;
}

export async function updateNotificationSettings(payload: NotificationSettings) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') {
      return { error: 'Insufficient permissions' };
    }

    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const updatedData = { ...currentData, notifications: payload };

    const { error } = await supabase.from('tenant_settings').upsert(
      {
        tenant_id: tenantId,
        settings_data: updatedData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    );

    if (error) throw error;

    revalidatePath('/dashboard/settings/notifications');
    return { success: true };
  } catch (err) {
    console.error('Error saving notification settings:', err);
    return { error: 'Failed to update notification settings' };
  }
}

export async function uploadBusinessLogo(formData: FormData): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') {
      return { error: 'Insufficient permissions to upload logo' };
    }

    const logoFile = formData.get('logoFile');
    if (!logoFile || typeof logoFile !== 'object' || !('arrayBuffer' in logoFile)) {
      return { error: 'No logo image file provided' };
    }

    const file = logoFile as File;
    if (file.size > 5 * 1024 * 1024) {
      return { error: 'Logo file must be smaller than 5MB' };
    }

    const rawExt = file.name.split('.').pop()?.toLowerCase() || 'png';
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
    const fileName = `logos/${tenantId}_logo.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let storageClient = supabase;
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        storageClient = createAdminClient() as unknown as typeof supabase;
      }
    } catch (adminErr) {
      console.warn('Could not initialize admin client for logo storage upload:', adminErr);
    }

    const { data: uploadData, error: uploadError } = await storageClient.storage
      .from('product-images')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading logo to storage:', uploadError);
      return { error: `Upload failed: ${uploadError.message}` };
    }

    if (uploadData) {
      const { data: publicUrlData } = storageClient.storage.from('product-images').getPublicUrl(fileName);
      // Append cache buster query parameter to ensure UI immediately reflects new image
      const logoUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

      // Synchronize single business logo across tenant_settings and storefront_settings
      await Promise.all([
        supabase.from('tenant_settings').update({ logo_url: logoUrl }).eq('tenant_id', tenantId),
        supabase.from('storefront_settings').update({ logo_url: logoUrl }).eq('tenant_id', tenantId),
      ]);

      revalidatePath('/dashboard/settings/business-profile');
      revalidatePath('/dashboard/online-store');

      return { url: logoUrl };
    }

    return { error: 'Failed to retrieve uploaded logo URL' };
  } catch (err) {
    console.error('Error in uploadBusinessLogo:', err);
    return { error: 'Failed to process logo image' };
  }
}

export async function getUnifiedBusinessProfile(): Promise<import('@/types/settings').BusinessProfileData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const defaultProfile: import('@/types/settings').BusinessProfileData = {
    identity: {
      businessName: '',
      tradingName: '',
      handle: '',
      category: 'Retail & E-commerce',
      description: '',
      logoUrl: '',
    },
    contact: {
      phone: '',
      email: '',
      street: '',
      city: '',
      state: '',
      country: 'Ghana',
      website: '',
    },
    publicInfo: {
      storefrontUrl: '',
      customDomain: '',
      socials: {
        instagram: '',
        tiktok: '',
        twitter: '',
        facebook: '',
        whatsapp: '',
      },
      serviceAreas: 'Greater Accra, Kumasi, Nationwide',
      businessHoursSummary: 'Mon – Sat: 8:00 AM – 6:00 PM',
    },
    intelligence: {
      aboutBusiness: '',
      whatWeSell: '',
      deliveryInfo: '',
      returnPolicy: '',
      customerPolicies: '',
    },
    verification: {
      status: 'unverified',
      taxId: '',
      legalEntityName: '',
      verifiedAt: null,
    },
  };

  if (!user) return defaultProfile;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    const [tenantRes, settingsRes, sfRes] = await Promise.all([
      supabase.from('tenants').select('name').eq('id', tenantId).single(),
      supabase.from('tenant_settings').select('*').eq('tenant_id', tenantId).single(),
      supabase.from('storefront_settings').select('*').eq('tenant_id', tenantId).single(),
    ]);

    const tenantName = tenantRes.data?.name || '';
    const ts = settingsRes.data || {};
    const sf = sfRes.data || {};
    const custom = (ts.settings_data as Record<string, unknown> | null) || {};

    const handle = sf.slug || tenantName.toLowerCase().replace(/[^a-z0-9]/g, '') || `store-${tenantId.slice(0, 8)}`;
    const storefrontUrl = `https://${handle}.merchander.app`;

    const socialLinks = (custom.social_links as Record<string, string> | null) || {};
    const intelligence = (custom.intelligence as Record<string, string> | null) || {};
    const verification = (custom.verification as Record<string, unknown> | null) || {};

    return {
      identity: {
        businessName: tenantName,
        tradingName: ts.trading_name || '',
        handle: handle,
        category: ts.industry || 'Retail & E-commerce',
        description: sf.tagline || sf.bio || (custom.description as string) || '',
        logoUrl: sf.logo_url || (custom.logo_url as string) || '',
      },
      contact: {
        phone: (custom.business_phone as string) || sf.whatsapp_phone || '',
        email: ts.store_email || '',
        street: ts.business_street || '',
        city: ts.business_city || '',
        state: ts.business_state || '',
        country: ts.business_country || 'Ghana',
        website: (custom.website as string) || '',
      },
      publicInfo: {
        storefrontUrl,
        customDomain: (custom.custom_domain as string) || '',
        socials: {
          instagram: sf.instagram_handle || socialLinks.instagram || '',
          tiktok: sf.tiktok_handle || socialLinks.tiktok || '',
          twitter: socialLinks.twitter || '',
          facebook: socialLinks.facebook || '',
          whatsapp: sf.whatsapp_phone || socialLinks.whatsapp || '',
        },
        serviceAreas: (custom.service_areas as string) || 'Greater Accra, Kumasi, Nationwide',
        businessHoursSummary: (custom.business_hours_summary as string) || 'Mon – Sat: 8:00 AM – 6:00 PM',
      },
      intelligence: {
        aboutBusiness: intelligence.aboutBusiness || '',
        whatWeSell: intelligence.whatWeSell || '',
        deliveryInfo: intelligence.deliveryInfo || sf.delivery_policy || '',
        returnPolicy: intelligence.returnPolicy || '',
        customerPolicies: intelligence.customerPolicies || '',
      },
      verification: {
        status:
          (verification.status as 'unverified' | 'pending' | 'verified') || (ts.tax_id ? 'pending' : 'unverified'),
        taxId: ts.tax_id || (verification.taxId as string) || '',
        legalEntityName: (verification.legalEntityName as string) || tenantName,
        verifiedAt: (verification.verifiedAt as string) || null,
      },
    };
  } catch (err) {
    console.error('Error fetching unified business profile:', err);
    return defaultProfile;
  }
}

export async function updateUnifiedBusinessProfile(payload: import('@/types/settings').BusinessProfileData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') {
      return { error: 'Insufficient permissions to modify business profile' };
    }

    const { identity, contact, publicInfo, intelligence, verification } = payload;

    if (!identity.businessName || identity.businessName.trim().length < 2) {
      return { error: 'Business name must be at least 2 characters' };
    }

    const sanitizedHandle = identity.handle
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '');

    // 1. Update Tenants Table
    const { error: tenantError } = await supabase
      .from('tenants')
      .update({ name: identity.businessName.trim() })
      .eq('id', tenantId);

    if (tenantError) throw tenantError;

    // 2. Fetch Existing settings to merge cleanly
    const { data: existingSettings } = await supabase
      .from('tenant_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    const currentSettings = existingSettings as Record<string, unknown> | null;
    const currentSettingsData = (currentSettings?.settings_data as Record<string, unknown>) || {};
    const updatedSettingsData = {
      ...currentSettingsData,
      business_phone: contact.phone || null,
      website: contact.website || null,
      description: identity.description || null,
      logo_url: identity.logoUrl || null,
      custom_domain: publicInfo.customDomain || null,
      service_areas: publicInfo.serviceAreas || null,
      social_links: publicInfo.socials,
      intelligence: intelligence,
      verification: {
        status: verification.status,
        taxId: verification.taxId || null,
        legalEntityName: verification.legalEntityName || null,
        verifiedAt: verification.verifiedAt || null,
      },
    };

    // 3. Update Tenant Settings Table
    const baseSettingsUpdate: Record<string, unknown> = {
      trading_name: identity.tradingName || null,
      industry: identity.category || 'Retail & E-commerce',
      tax_id: verification.taxId || null,
      store_email: contact.email || null,
      business_street: contact.street || null,
      business_city: contact.city || null,
      business_state: contact.state || null,
      business_country: contact.country || 'Ghana',
    };

    // Attempt update with settings_data, fall back cleanly if column is not yet in schema cache
    const { error: tsError } = await supabase
      .from('tenant_settings')
      .update({
        ...baseSettingsUpdate,
        settings_data: updatedSettingsData,
      })
      .eq('tenant_id', tenantId);

    if (tsError) {
      if (tsError.code === 'PGRST204' || tsError.message?.includes('settings_data')) {
        const { error: fallbackError } = await supabase
          .from('tenant_settings')
          .update(baseSettingsUpdate)
          .eq('tenant_id', tenantId);
        if (fallbackError) throw fallbackError;
      } else {
        throw tsError;
      }
    }

    // 4. Update or Upsert Storefront Settings
    const { error: sfError } = await supabase.from('storefront_settings').upsert(
      {
        tenant_id: tenantId,
        store_name: identity.tradingName || identity.businessName,
        slug: sanitizedHandle || `store-${tenantId.slice(0, 8)}`,
        tagline: identity.description || null,
        bio: intelligence.aboutBusiness || null,
        logo_url: identity.logoUrl || null,
        whatsapp_phone: contact.phone || null,
        instagram_handle: publicInfo.socials.instagram || null,
        tiktok_handle: publicInfo.socials.tiktok || null,
        delivery_policy: intelligence.deliveryInfo || null,
        is_active: true,
      },
      { onConflict: 'tenant_id' }
    );

    if (sfError) {
      console.warn('storefront_settings upsert warning:', sfError);
    }

    revalidatePath('/dashboard', 'layout');
    revalidatePath('/dashboard/settings/business-profile');
    return { success: true };
  } catch (err) {
    console.error('Error updating unified business profile:', err);
    return { error: 'Failed to update business profile' };
  }
}
