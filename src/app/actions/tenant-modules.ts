'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  BusinessArchetype,
  BusinessModuleKey,
} from '@/types/business-modules';
import { PlatformTier } from '@/types/platform';
import {
  isModuleEntitled,
  MODULE_DEFINITIONS,
  ARCHETYPE_DEFINITIONS,
} from '@/utils/business-modules';

export interface TenantModuleSettingsResult {
  success: boolean;
  error?: string;
  archetype?: BusinessArchetype;
  enabledModules?: BusinessModuleKey[];
  tier?: PlatformTier;
}

/**
 * Fetches the current tenant's active business archetype, enabled modules,
 * and subscription tier ceiling.
 */
export async function getTenantModuleSettingsAction(): Promise<TenantModuleSettingsResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .single();

    if (!tenantUser) {
      return { success: false, error: 'No merchant workspace associated with this user.' };
    }

    const [settingsRes, subRes] = await Promise.all([
      supabase
        .from('tenant_settings')
        .select('business_archetype, enabled_modules')
        .eq('tenant_id', tenantUser.tenant_id)
        .single(),
      supabase
        .from('tenant_subscriptions')
        .select('tier')
        .eq('tenant_id', tenantUser.tenant_id)
        .maybeSingle(),
    ]);

    const archetype = (settingsRes.data?.business_archetype as BusinessArchetype) || 'import_resale';
    const rawModules = settingsRes.data?.enabled_modules as BusinessModuleKey[] | undefined;
    const enabledModules =
      rawModules && rawModules.length > 0
        ? rawModules
        : ARCHETYPE_DEFINITIONS[archetype]?.defaultModules || [];
    const tier: PlatformTier = (subRes.data?.tier as PlatformTier) || 'starter';

    return {
      success: true,
      archetype,
      enabledModules,
      tier,
    };
  } catch (err) {
    console.error('Error fetching tenant module settings:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch module settings.',
    };
  }
}

export interface UpdateTenantModulesPayload {
  archetype?: BusinessArchetype;
  enabledModules: BusinessModuleKey[];
}

/**
 * Updates the tenant's business archetype and active module toggles,
 * enforcing subscription entitlement ceilings.
 */
export async function updateTenantModulesAction(
  payload: UpdateTenantModulesPayload
): Promise<{ success: boolean; error?: string; enabledModules?: BusinessModuleKey[] }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Role guard: Only owner or admin can configure modules
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .single();

    if (!tenantUser || (tenantUser.role !== 'owner' && tenantUser.role !== 'admin')) {
      return { success: false, error: 'Only workspace owners and administrators can configure modules.' };
    }

    // Fetch subscription tier ceiling
    const { data: sub } = await supabase
      .from('tenant_subscriptions')
      .select('tier')
      .eq('tenant_id', tenantUser.tenant_id)
      .maybeSingle();

    const currentTier: PlatformTier = (sub?.tier as PlatformTier) || 'starter';

    // Verify entitlements: Every enabled module must be entitled by the current tier
    for (const mod of payload.enabledModules) {
      if (!isModuleEntitled(currentTier, mod)) {
        const modDef = MODULE_DEFINITIONS[mod];
        return {
          success: false,
          error: `The module "${modDef?.name || mod}" requires a ${modDef?.requiredTier?.toUpperCase()} subscription plan. Please upgrade to enable it.`,
        };
      }
    }

    // Update settings
    const updateData: { business_archetype?: string; enabled_modules: string[] } = {
      enabled_modules: payload.enabledModules,
    };
    if (payload.archetype) {
      updateData.business_archetype = payload.archetype;
    }

    const { error: updateErr } = await supabase
      .from('tenant_settings')
      .update(updateData)
      .eq('tenant_id', tenantUser.tenant_id);

    if (updateErr) {
      return { success: false, error: `Failed to update modules: ${updateErr.message}` };
    }

    revalidatePath('/dashboard', 'layout');
    revalidatePath('/dashboard/settings/modules');
    revalidatePath('/dashboard/settings/permissions');

    return {
      success: true,
      enabledModules: payload.enabledModules,
    };
  } catch (err) {
    console.error('Error updating tenant modules:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An error occurred while updating modules.',
    };
  }
}
