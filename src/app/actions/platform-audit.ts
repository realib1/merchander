// Deliberately NOT a 'use server' module. logPlatformAuditAction is an internal
// helper called by other server actions; exposing it as a callable endpoint would
// let any authenticated user write arbitrary rows into the immutable audit trail.
// getPlatformAuditLogsAction is invoked directly from the server component page.
// `server-only` makes an accidental client import a build error, not a silent
// bundle leak.
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuditLogEntry, PlatformRole } from '@/types/platform';
import { verifyPlatformStaff } from './platform';

import { headers } from 'next/headers';

/**
 * Admin: Log an immutable administrative action
 */
export async function logPlatformAuditAction(params: {
  action: string;
  target_type: AuditLogEntry['target_type'];
  target_id: string;
  target_name?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
}): Promise<{ success: boolean; logId?: string; error?: string }> {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = forwardedFor?.split(',')[0]?.trim() || headersList.get('x-real-ip') || 'unknown';

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthenticated user cannot write audit log' };
    }

    const adminSupabase = createAdminClient();

    // Determine staff role
    const { data: staffRecord } = await adminSupabase
      .from('platform_staff_users')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const actorRole = (staffRecord?.role as PlatformRole) || 'platform_admin';

    const logEntry = {
      actor_id: user.id,
      actor_email: user.email || 'unknown@merchander.app',
      actor_role: actorRole,
      action: params.action,
      target_type: params.target_type,
      target_id: params.target_id,
      target_name: params.target_name || null,
      reason: params.reason || 'Routine platform administration',
      metadata: params.metadata || {},
      ip_address: params.ip_address || realIp,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await adminSupabase
      .from('platform_audit_logs')
      .insert(logEntry)
      .select('id')
      .single();

    if (error) {
      console.error('CRITICAL: Failed to write platform audit log:', error.message, logEntry);
      throw new Error(`Audit log write failed: ${error.message}. Refusing to proceed without audit trail.`);
    }

    return { success: true, logId: data?.id };
  } catch (err) {
    console.error('Error logging platform audit action:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Admin: Fetch paginated, filterable platform audit logs
 */
export async function getPlatformAuditLogsAction(options?: {
  limit?: number;
  offset?: number;
  targetType?: string;
  actorEmail?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ logs: AuditLogEntry[]; error?: string; count?: number }> {
  try {
    await verifyPlatformStaff(['platform_owner', 'platform_admin', 'compliance']);
    const adminSupabase = createAdminClient();
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    let query = adminSupabase
      .from('platform_audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (options?.targetType && options.targetType !== 'all') {
      query = query.eq('target_type', options.targetType);
    }
    if (options?.actorEmail) {
      query = query.ilike('actor_email', `%${options.actorEmail}%`);
    }
    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options?.endDate) {
      // Append time to ensure inclusive matching for the end date if only a date is provided
      const endInclusive = options.endDate.includes('T') ? options.endDate : `${options.endDate}T23:59:59.999Z`;
      query = query.lte('created_at', endInclusive);
    }

    const { data, error, count } = await query;

    if (error) {
      console.warn('Audit logs table query error:', error.message);
      return { logs: [], error: `Database error: ${error.message}` };
    }

    const formattedLogs: AuditLogEntry[] = (data || []).map((row) => ({
      id: row.id,
      actor_id: row.actor_id,
      actor_email: row.actor_email,
      actor_role: row.actor_role,
      action: row.action,
      target_type: row.target_type,
      target_id: row.target_id,
      target_name: row.target_name || undefined,
      reason: row.reason || undefined,
      metadata: row.metadata || {},
      ip_address: row.ip_address || undefined,
      created_at: row.created_at,
    }));

    return { logs: formattedLogs, count: count || undefined };
  } catch (err) {
    console.error('Error fetching platform audit logs:', err);
    return { logs: [], error: err instanceof Error ? err.message : 'Failed to fetch audit logs' };
  }
}
