'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { SupportAccessGrant } from '@/types/support';
import { logPlatformAuditAction } from './platform-audit';
import { verifyPlatformStaff } from './platform';
import crypto from 'crypto';



/**
 * Fetch active and recent support access grants for the authenticated tenant
 */
export async function getTenantSupportAccessGrantsAction(): Promise<{
  activeGrant: SupportAccessGrant | null;
  history: SupportAccessGrant[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { activeGrant: null, history: [], error: 'Unauthorized' };
    }

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!tenantUser?.tenant_id) {
      return { activeGrant: null, history: [] };
    }

    const adminSupabase = createAdminClient();
    const { data: grants, error } = await adminSupabase
      .from('platform_support_access_grants')
      .select('*')
      .eq('tenant_id', tenantUser.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not query platform_support_access_grants:', error.message);
      return { activeGrant: null, history: [] };
    }

    const now = new Date();
    let activeGrant: SupportAccessGrant | null = null;
    const history: SupportAccessGrant[] = [];

    for (const g of grants || []) {
      const expiresAt = new Date(g.expires_at);
      const isExpired = expiresAt < now;
      const effectiveStatus = g.status === 'active' && isExpired ? 'expired' : g.status;

      const formatted: SupportAccessGrant = {
        id: g.id,
        tenant_id: g.tenant_id,
        granted_by: g.granted_by,
        granted_by_email: user.email,
        ticket_id: g.ticket_id,
        token: g.token,
        reason: g.reason,
        duration_hours: g.duration_hours,
        status: effectiveStatus as SupportAccessGrant['status'],
        expires_at: g.expires_at,
        created_at: g.created_at,
        revoked_at: g.revoked_at,
      };

      if (effectiveStatus === 'active' && !activeGrant) {
        activeGrant = formatted;
      } else {
        history.push(formatted);
      }
    }

    return { activeGrant, history };
  } catch (err) {
    console.error('Error in getTenantSupportAccessGrantsAction:', err);
    return {
      activeGrant: null,
      history: [],
      error: err instanceof Error ? err.message : 'Failed to fetch support grants',
    };
  }
}

/**
 * Merchant generates a time-limited diagnostic support grant token
 */
export async function createSupportAccessGrantAction(params: {
  durationHours: number;
  reason: string;
  ticketId?: string;
}): Promise<{ success?: boolean; grant?: SupportAccessGrant; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Authentication required' };
    }

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!tenantUser?.tenant_id) {
      return { error: 'No associated store workspace found' };
    }

    // Only owner or admin can grant diagnostic support access
    if (tenantUser.role !== 'owner' && tenantUser.role !== 'admin') {
      return { error: 'Only Store Owners or Admins can grant Platform Support access' };
    }

    const duration = Math.min(Math.max(params.durationHours || 2, 1), 72); // 1 to 72 hours max
    const expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString();
    const token = `grant_sec_${crypto.randomBytes(24).toString('hex')}`;

    const adminSupabase = createAdminClient();

    // Revoke any existing active grants first
    await adminSupabase
      .from('platform_support_access_grants')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantUser.tenant_id)
      .eq('status', 'active');

    const { data: newGrant, error } = await adminSupabase
      .from('platform_support_access_grants')
      .insert({
        tenant_id: tenantUser.tenant_id,
        granted_by: user.id,
        ticket_id: params.ticketId || null,
        token,
        reason: params.reason.trim(),
        duration_hours: duration,
        status: 'active',
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error inserting support access grant:', error);
      return { error: error.message };
    }

    // Write to platform audit logs
    await logPlatformAuditAction({
      action: 'MERCHANT_GRANT_SUPPORT_ACCESS',
      target_type: 'tenant',
      target_id: tenantUser.tenant_id,
      reason: `Merchant granted ${duration}h support access: ${params.reason}`,
      metadata: {
        grantedByEmail: user.email,
        durationHours: duration,
        expiresAt,
        ticketId: params.ticketId,
      },
    });

    revalidatePath('/dashboard/help');
    revalidatePath('/platform/merchants');

    return {
      success: true,
      grant: {
        id: newGrant.id,
        tenant_id: newGrant.tenant_id,
        granted_by: newGrant.granted_by,
        granted_by_email: user.email,
        ticket_id: newGrant.ticket_id,
        token: newGrant.token,
        reason: newGrant.reason,
        duration_hours: newGrant.duration_hours,
        status: 'active',
        expires_at: newGrant.expires_at,
        created_at: newGrant.created_at,
      },
    };
  } catch (err) {
    console.error('Error creating support access grant:', err);
    return { error: err instanceof Error ? err.message : 'Failed to grant support access' };
  }
}

/**
 * Merchant revokes an active support access grant immediately
 */
export async function revokeSupportAccessGrantAction(
  grantId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Authentication required' };
    }

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!tenantUser?.tenant_id) {
      return { error: 'Store workspace not found' };
    }

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('platform_support_access_grants')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
      })
      .eq('id', grantId)
      .eq('tenant_id', tenantUser.tenant_id);

    if (error) {
      return { error: error.message };
    }

    // Log revocation
    await logPlatformAuditAction({
      action: 'MERCHANT_REVOKE_SUPPORT_ACCESS',
      target_type: 'tenant',
      target_id: tenantUser.tenant_id,
      reason: `Support access grant ${grantId} revoked immediately by merchant`,
      metadata: { revokedByEmail: user.email },
    });

    revalidatePath('/dashboard/help');
    revalidatePath('/platform/merchants');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to revoke support grant' };
  }
}

/**
 * Check if an active support grant exists for a tenant (platform staff only)
 */
export async function verifyActiveSupportGrant(tenantId: string): Promise<{
  hasActiveGrant: boolean;
  grant?: SupportAccessGrant;
}> {
  try {
    await verifyPlatformStaff(['platform_owner', 'platform_admin', 'operations', 'support', 'tech_admin']);
    const adminSupabase = createAdminClient();
    const now = new Date().toISOString();

    const { data: grant } = await adminSupabase
      .from('platform_support_access_grants')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (!grant) {
      return { hasActiveGrant: false };
    }

    return {
      hasActiveGrant: true,
      grant: {
        id: grant.id,
        tenant_id: grant.tenant_id,
        granted_by: grant.granted_by,
        ticket_id: grant.ticket_id,
        reason: grant.reason,
        duration_hours: grant.duration_hours,
        status: 'active',
        expires_at: grant.expires_at,
        created_at: grant.created_at,
      },
    };
  } catch {
    return { hasActiveGrant: false };
  }
}
