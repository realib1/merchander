import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { TenantInfo, TenantSettings } from '@/types/settings';

/**
 * Ensures user is authenticated, returning the User object or throwing / returning null.
 */
export async function getAuthenticatedUser(supabase: SupabaseClient): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Fetches tenant membership and role for a given user.
 */
export async function getTenantInfo(supabase: SupabaseClient, userId: string): Promise<TenantInfo> {
  const { data: tenantUser, error } = await supabase
    .from('tenant_users')
    .select('tenant_id, role')
    .eq('user_id', userId)
    .single();

  if (error || !tenantUser) {
    throw new Error('Tenant membership not found');
  }

  return {
    tenantId: tenantUser.tenant_id,
    role: tenantUser.role || 'member',
  };
}

/**
 * Fetches tenant settings for a tenant.
 */
export async function getTenantSettings(
  supabase: SupabaseClient,
  tenantId: string,
  columns: string = '*'
): Promise<TenantSettings | null> {
  const { data, error } = await supabase.from('tenant_settings').select(columns).eq('tenant_id', tenantId).single();

  if (error || !data) {
    return null;
  }

  return data as unknown as TenantSettings;
}
