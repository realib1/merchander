import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlatformRole } from '@/types/platform';

export interface PlatformStaffRecord {
  role: PlatformRole;
  is_active: boolean;
  mfa_enabled: boolean;
}

/**
 * Roles allowed to *read* the commercial plan catalogue. The plan list and
 * prices are shown on `/platform` and `/platform/merchants`, both open to every
 * staff role, so the read is gated to all seven. Plan *writes* stay owner/admin
 * only (see `actions/platform-plans.ts`).
 */
export const PLATFORM_PLAN_READ_ROLES: PlatformRole[] = [
  'platform_owner',
  'platform_admin',
  'operations',
  'support',
  'finance',
  'tech_admin',
  'compliance',
];

export const PLATFORM_RBAC_RULES: Record<string, PlatformRole[]> = {
  '/platform': ['platform_owner', 'platform_admin', 'operations', 'support', 'finance', 'tech_admin', 'compliance'],
  '/platform/merchants': ['platform_owner', 'platform_admin', 'operations', 'support', 'finance', 'tech_admin', 'compliance'],
  '/platform/plans-billing': ['platform_owner', 'platform_admin'],
  '/platform/revenue': ['platform_owner', 'platform_admin', 'finance'],
  '/platform/domains': ['platform_owner', 'platform_admin', 'tech_admin'],
  '/platform/system-health': ['platform_owner', 'platform_admin', 'tech_admin', 'operations'],
  '/platform/support': ['platform_owner', 'platform_admin', 'support', 'operations', 'tech_admin'],
  '/platform/communications': ['platform_owner', 'platform_admin', 'operations'],
  '/platform/security': ['platform_owner', 'platform_admin', 'compliance'],
  '/platform/audit-logs': ['platform_owner', 'platform_admin', 'compliance'],
  '/platform/settings': ['platform_owner', 'platform_admin'],
};

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
    .select('role, is_active, mfa_enabled')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) return null;
  return { 
    role: data.role as PlatformRole, 
    is_active: data.is_active === true,
    mfa_enabled: data.mfa_enabled === true
  };
}

/** True only for a user with an active platform_staff_users row. */
export async function isActivePlatformStaff(client: SupabaseClient, userId: string): Promise<boolean> {
  const staff = await getPlatformStaffRecord(client, userId);
  return staff?.is_active === true;
}
