'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { PlatformBroadcast, BroadcastType, BroadcastTarget, PlatformRole } from '@/types/platform';
import { logPlatformAuditAction } from './platform-audit';
import { verifyPlatformStaff } from './platform';

const BROADCAST_ROLES: PlatformRole[] = ['platform_owner', 'platform_admin', 'operations'];

/**
 * Admin: Fetch all platform announcements
 */
export async function getPlatformBroadcastsAction(): Promise<{
  broadcasts: PlatformBroadcast[];
  error?: string;
}> {
  try {
    await verifyPlatformStaff(BROADCAST_ROLES);
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from('platform_announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Announcements table query error:', error.message);
      return { broadcasts: [] };
    }

    const formatted: PlatformBroadcast[] = (data || []).map((b) => ({
      id: b.id,
      title: b.title,
      message: b.message,
      type: b.type as BroadcastType,
      target: b.target_tier as BroadcastTarget,
      target_country: b.target_country || 'all',
      action_label: b.action_label || undefined,
      action_url: b.action_url || undefined,
      is_pinned: b.is_pinned || false,
      is_active: b.is_active || false,
      starts_at: b.starts_at,
      expires_at: b.expires_at || null,
      created_by: b.created_by || undefined,
      created_at: b.created_at,
    }));

    return { broadcasts: formatted };
  } catch (err) {
    console.error('Error fetching broadcasts:', err);
    return { broadcasts: [], error: err instanceof Error ? err.message : 'Failed to fetch broadcasts' };
  }
}

/**
 * Admin: Publish a new platform broadcast announcement
 */
export async function createPlatformBroadcastAction(params: {
  title: string;
  message: string;
  type: BroadcastType;
  target: BroadcastTarget;
  target_country?: string;
  action_label?: string;
  action_url?: string;
  is_pinned?: boolean;
  expires_at?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await verifyPlatformStaff(BROADCAST_ROLES);
    const adminSupabase = createAdminClient();

    const newBroadcast = {
      title: params.title,
      message: params.message,
      type: params.type,
      target_tier: params.target,
      target_country: params.target_country || 'all',
      action_label: params.action_label || null,
      action_url: params.action_url || null,
      is_pinned: params.is_pinned || false,
      is_active: true,
      starts_at: new Date().toISOString(),
      expires_at: params.expires_at || null,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await adminSupabase
      .from('platform_announcements')
      .insert(newBroadcast)
      .select('id')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await logPlatformAuditAction({
      action: 'CREATE_PLATFORM_BROADCAST',
      target_type: 'broadcast',
      target_id: data?.id || 'broadcast',
      target_name: params.title,
      reason: `Published broadcast of type ${params.type} to ${params.target}`,
      metadata: { ...params },
    });

    revalidatePath('/platform/communications');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err) {
    console.error('Error creating platform broadcast:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create broadcast' };
  }
}

/**
 * Admin: Toggle or delete a platform announcement
 */
export async function toggleBroadcastStatusAction(
  broadcastId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyPlatformStaff(BROADCAST_ROLES);
    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from('platform_announcements')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', broadcastId);

    if (error) {
      throw new Error(error.message);
    }

    await logPlatformAuditAction({
      action: isActive ? 'ACTIVATE_BROADCAST' : 'DEACTIVATE_BROADCAST',
      target_type: 'broadcast',
      target_id: broadcastId,
      reason: `Changed broadcast status to ${isActive ? 'active' : 'inactive'}`,
    });

    revalidatePath('/platform/communications');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err) {
    console.error('Error toggling broadcast status:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to toggle broadcast' };
  }
}
