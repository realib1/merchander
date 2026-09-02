import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlatformRole } from '@/types/platform';

export interface PlatformStaffRecord {
  role: PlatformRole;
  is_active: boolean;
}

/**
 * Look up the caller's platform_staff_users row. Returns null when there is none.
 * Pass whichever Supabase client the caller already holds (anon server client,
 * middleware client, or service-role admin client).
 */
export async function getPlatformStaffRecord(
  client: SupabaseClient,
  userId: string
): Promise<PlatformStaffRecord | null> {
  const { data } = await client
    .from('platform_staff_users')
    .select('role, is_active')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) return null;
  return { role: data.role as PlatformRole, is_active: data.is_active === true };
}

/** True only for a user with an active platform_staff_users row. */
export async function isActivePlatformStaff(client: SupabaseClient, userId: string): Promise<boolean> {
  const staff = await getPlatformStaffRecord(client, userId);
  return staff?.is_active === true;
}
