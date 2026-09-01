'use server';

import dns from 'node:dns/promises';
import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import { CustomDomainConfig, DomainVerificationStatus } from '@/types/storefront';
import { normalizeDomain, isValidCustomDomain, CNAME_TARGET } from '@/utils/domain';

interface VerifyDomainResult {
  success: boolean;
  config?: CustomDomainConfig;
  error?: string;
}

/**
 * Fetch existing custom domain configuration for active tenant
 */
export async function getCustomDomainConfig(): Promise<CustomDomainConfig | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data: settings } = await supabase.from('tenant_settings').select('*').eq('tenant_id', tenantId).single();

    const custom =
      ((settings as Record<string, unknown> | null)?.settings_data as Record<string, unknown> | null) || {};
    const config = custom.custom_domain_config as CustomDomainConfig | undefined;

    if (config) return config;

    const rawDomain = (custom.custom_domain as string) || '';
    if (rawDomain) {
      return {
        domain: rawDomain,
        status: 'pending',
        cnameTarget: CNAME_TARGET,
        lastCheckedAt: null,
      };
    }

    return null;
  } catch (err) {
    console.error('Error fetching custom domain config:', err);
    return null;
  }
}

/**
 * Check DNS records and verify custom domain configuration
 */
export async function verifyCustomDomain(domainInput: string): Promise<VerifyDomainResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const domain = normalizeDomain(domainInput);

  if (!isValidCustomDomain(domain)) {
    return {
      success: false,
      error: 'Please enter a valid domain (e.g. shop.yourbrand.com or yourbrand.com)',
    };
  }

  let status: DomainVerificationStatus = 'pending';
  let errorReason: string | null = null;

  try {
    // Attempt DNS CNAME lookup
    const cnames = await dns.resolveCname(domain).catch(() => []);
    const normalizedTarget = CNAME_TARGET.toLowerCase();

    const isMatch = cnames.some((c) => c.toLowerCase() === normalizedTarget || c.toLowerCase().includes('merchander'));

    if (isMatch) {
      status = 'valid';
      errorReason = null;
    } else if (cnames.length > 0) {
      status = 'invalid';
      errorReason = `CNAME points to ${cnames[0]}, expected ${CNAME_TARGET}`;
    } else {
      // Check if IP resolves
      const ip = await dns.lookup(domain).catch(() => null);
      if (ip) {
        status = 'pending';
        errorReason = `Domain resolves to IP (${ip.address}), but required CNAME to ${CNAME_TARGET} was not detected.`;
      } else {
        status = 'pending';
        errorReason = `DNS records not detected yet. Propagation can take up to 24 hours.`;
      }
    }
  } catch {
    status = 'pending';
    errorReason = 'DNS lookup failed. Please ensure your DNS records are configured.';
  }

  const newConfig: CustomDomainConfig = {
    domain,
    status,
    cnameTarget: CNAME_TARGET,
    lastCheckedAt: new Date().toISOString(),
    errorReason,
  };

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    // Merge into tenant_settings settings_data
    const { data: existing } = await supabase.from('tenant_settings').select('*').eq('tenant_id', tenantId).single();

    const currentSettings = existing as Record<string, unknown> | null;
    const currentSettingsData = (currentSettings?.settings_data as Record<string, unknown>) || {};
    const updatedSettingsData = {
      ...currentSettingsData,
      custom_domain: domain,
      custom_domain_config: newConfig,
    };

    const { error: dbError } = await supabase
      .from('tenant_settings')
      .update({ settings_data: updatedSettingsData })
      .eq('tenant_id', tenantId);

    if (dbError) {
      try {
        await supabase
          .from('storefront_settings')
          .update({ custom_domain: domain } as Record<string, unknown>)
          .eq('tenant_id', tenantId);
      } catch {
        // column may not exist yet
      }
    }

    revalidatePath('/dashboard/online-store');
    revalidatePath('/dashboard/settings/business-profile');

    return { success: true, config: newConfig };
  } catch (err) {
    console.error('Error saving custom domain:', err);
    return { success: false, error: 'Failed to update domain configuration' };
  }
}

/**
 * Remove custom domain binding
 */
export async function removeCustomDomain(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    const { data: existing } = await supabase.from('tenant_settings').select('*').eq('tenant_id', tenantId).single();

    const currentSettings = existing as Record<string, unknown> | null;
    const currentSettingsData = (currentSettings?.settings_data as Record<string, unknown>) || {};
    const updatedSettingsData = {
      ...currentSettingsData,
      custom_domain: null,
      custom_domain_config: null,
    };

    await supabase.from('tenant_settings').update({ settings_data: updatedSettingsData }).eq('tenant_id', tenantId);

    try {
      await supabase
        .from('storefront_settings')
        .update({ custom_domain: null } as Record<string, unknown>)
        .eq('tenant_id', tenantId);
    } catch {
      // ignore if column not in schema
    }

    revalidatePath('/dashboard/online-store');
    revalidatePath('/dashboard/settings/business-profile');

    return { success: true };
  } catch (err) {
    console.error('Error removing custom domain:', err);
    return { success: false, error: 'Failed to remove custom domain' };
  }
}
