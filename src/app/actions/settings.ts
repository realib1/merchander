'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const hexColorSchema = z
  .string()
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Must be a valid hex color (e.g. #091540)')
  .optional()
  .or(z.literal(''));

const updateBusinessSchema = z.object({
  tenantName: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  tradingName: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  taxId: z.string().max(50, 'Tax ID / Registration Number must not exceed 50 characters').optional(),
  brandColor: hexColorSchema,
  brandSecondaryColor: hexColorSchema,
  businessStreet: z.string().max(200).optional(),
  businessCity: z.string().max(100).optional(),
  businessState: z.string().max(100).optional(),
  businessZip: z.string().max(30).optional(),
  businessCountry: z.string().max(100).optional(),
});

export async function updateBusinessProfile(formData: FormData) {
  const rawData = {
    tenantName: formData.get('tenantName') as string | undefined,
    tradingName: (formData.get('tradingName') as string) || undefined,
    industry: (formData.get('industry') as string) || undefined,
    taxId: (formData.get('taxId') as string) || undefined,
    brandColor: (formData.get('brandColor') as string) || undefined,
    brandSecondaryColor: (formData.get('brandSecondaryColor') as string) || undefined,
    businessStreet: (formData.get('businessStreet') as string) || undefined,
    businessCity: (formData.get('businessCity') as string) || undefined,
    businessState: (formData.get('businessState') as string) || undefined,
    businessZip: (formData.get('businessZip') as string) || undefined,
    businessCountry: (formData.get('businessCountry') as string) || undefined,
  };

  const validation = updateBusinessSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }
  const {
    tenantName,
    tradingName,
    industry,
    taxId,
    brandColor,
    brandSecondaryColor,
    businessStreet,
    businessCity,
    businessState,
    businessZip,
    businessCountry,
  } = validation.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);

    if (role !== 'owner' && role !== 'admin') {
      return { error: 'You do not have permission to update business settings' };
    }

    // Update Tenant Name
    const { error: updateTenantError } = await supabase.from('tenants').update({ name: tenantName }).eq('id', tenantId);

    if (updateTenantError) throw updateTenantError;

    // Update Brand Color and Address
    const { error: updateSettingsError } = await supabase
      .from('tenant_settings')
      .update({
        trading_name: tradingName || null,
        industry: industry || null,
        tax_id: taxId || null,
        brand_primary_color: brandColor || null,
        brand_secondary_color: brandSecondaryColor || null,
        business_street: businessStreet || null,
        business_city: businessCity || null,
        business_state: businessState || null,
        business_zip: businessZip || null,
        business_country: businessCountry || null,
      })
      .eq('tenant_id', tenantId);

    if (updateSettingsError) throw updateSettingsError;

    revalidatePath('/dashboard', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Error updating business profile:', error);
    return { error: 'Failed to update business profile' };
  }
}

const updateStoreSchema = z.object({
  storeEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  storeCurrency: z.string().optional(),
});

export async function updateStoreSettings(formData: FormData) {
  const rawData = {
    storeEmail: formData.get('storeEmail'),
    storeCurrency: formData.get('storeCurrency'),
  };

  const validation = updateStoreSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }
  const { storeEmail, storeCurrency } = validation.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);

    if (role !== 'owner' && role !== 'admin') {
      return { error: 'You do not have permission to update store settings' };
    }

    const { error: updateError } = await supabase
      .from('tenant_settings')
      .update({
        store_email: storeEmail || null,
        store_currency: storeCurrency || 'GHS',
      })
      .eq('tenant_id', tenantId);

    if (updateError) throw updateError;

    revalidatePath('/dashboard/settings/store');
    return { success: true };
  } catch (error) {
    console.error('Error updating store settings:', error);
    return { error: 'Failed to update store settings' };
  }
}

export async function updateSecuritySettings(formData: FormData) {
  // Add authentication update logic later, including password changing.
  // For now, updating 2FA and SMS preferences in tenant_settings.
  const twoFactor = formData.get('twoFactor') === 'on';
  const smsRecovery = formData.get('smsRecovery') === 'on';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);

    if (role !== 'owner' && role !== 'admin') {
      return { error: 'You do not have permission to update security settings' };
    }

    const { error: updateError } = await supabase
      .from('tenant_settings')
      .update({
        two_factor_enabled: twoFactor,
        sms_recovery_enabled: smsRecovery,
      })
      .eq('tenant_id', tenantId);

    if (updateError) throw updateError;

    revalidatePath('/dashboard/settings/security');
    return { success: true };
  } catch (error) {
    console.error('Error updating security settings:', error);
    return { error: 'Failed to update security settings' };
  }
}
