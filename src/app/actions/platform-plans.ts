'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { PlatformEntitlements } from '@/types/platform';
import { verifyPlatformStaff } from './platform';
import { logPlatformAuditAction } from './platform-audit';



export interface SavePlanPayload {
  name: string;
  slug: string;
  description?: string;
  price_ghs: number;
  price_usd: number;
  billing_cycle: 'monthly' | 'annual';
  entitlements: PlatformEntitlements;
  is_active?: boolean;
  sort_order?: number;
}

/**
 * Update an existing platform plan configuration and pricing
 */
export async function updatePlatformPlanAction(
  planId: string,
  payload: SavePlanPayload,
  reason?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user, role } = await verifyPlatformStaff(['platform_owner', 'platform_admin']);
    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from('platform_plans')
      .update({
        name: payload.name,
        description: payload.description || null,
        price_ghs: payload.price_ghs,
        price_usd: payload.price_usd,
        billing_cycle: payload.billing_cycle,
        entitlements: payload.entitlements,
        is_active: payload.is_active ?? true,
        sort_order: payload.sort_order ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId);

    if (error) {
      console.error('Error updating platform plan:', error);
      return { error: error.message };
    }

    await logPlatformAuditAction({
      action: 'UPDATE_PLATFORM_PLAN',
      target_type: 'plan',
      target_id: planId,
      target_name: payload.name,
      reason: reason || `Platform plan ${payload.slug} updated by ${role}`,
      metadata: { payload, actorEmail: user.email },
    });

    revalidatePath('/platform/plans-billing');
    revalidatePath('/platform');
    return { success: true };
  } catch (err) {
    console.error('Failed to update platform plan:', err);
    return { error: err instanceof Error ? err.message : 'Failed to update plan' };
  }
}

/**
 * Create a new commercial plan tier
 */
export async function createPlatformPlanAction(
  payload: SavePlanPayload,
  reason?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user, role } = await verifyPlatformStaff(['platform_owner', 'platform_admin']);
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from('platform_plans')
      .insert({
        name: payload.name,
        slug: payload.slug.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
        description: payload.description || null,
        price_ghs: payload.price_ghs,
        price_usd: payload.price_usd,
        billing_cycle: payload.billing_cycle,
        entitlements: payload.entitlements,
        is_active: payload.is_active ?? true,
        sort_order: payload.sort_order ?? 99,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating platform plan:', error);
      return { error: error.message };
    }

    await logPlatformAuditAction({
      action: 'CREATE_PLATFORM_PLAN',
      target_type: 'plan',
      target_id: data?.id || payload.slug,
      target_name: payload.name,
      reason: reason || `New plan ${payload.name} created by ${role}`,
      metadata: { payload, actorEmail: user.email },
    });

    revalidatePath('/platform/plans-billing');
    revalidatePath('/platform');
    return { success: true };
  } catch (err) {
    console.error('Failed to create platform plan:', err);
    return { error: err instanceof Error ? err.message : 'Failed to create plan' };
  }
}

/**
 * Toggle plan active/inactive status
 */
export async function togglePlatformPlanStatusAction(
  planId: string,
  isActive: boolean
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user, role } = await verifyPlatformStaff(['platform_owner', 'platform_admin']);
    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from('platform_plans')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId);

    if (error) {
      return { error: error.message };
    }

    await logPlatformAuditAction({
      action: isActive ? 'ACTIVATE_PLATFORM_PLAN' : 'DEACTIVATE_PLATFORM_PLAN',
      target_type: 'plan',
      target_id: planId,
      reason: `Plan status changed to ${isActive ? 'active' : 'inactive'} by ${role}`,
      metadata: { planId, isActive, actorEmail: user.email },
    });

    revalidatePath('/platform/plans-billing');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to toggle plan status' };
  }
}
