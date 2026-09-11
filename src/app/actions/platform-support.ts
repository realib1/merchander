'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { PlatformSupportTicket } from '@/types/platform';
import { logPlatformAuditAction } from './platform-audit';
import { verifyPlatformStaff } from './platform';
import { PLATFORM_RBAC_RULES } from '@/lib/auth/platform-staff';

/**
 * Admin: Fetch support tickets across all tenants with filter & SLA tags
 */
export async function getPlatformSupportTicketsAction(filters?: {
  status?: string;
  priority?: string;
  category?: string;
}): Promise<{ tickets: PlatformSupportTicket[]; error?: string }> {
  try {
    await verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/support']);
    const adminSupabase = createAdminClient();

    let query = adminSupabase.from('support_tickets').select(`
      *,
      tenants(name, id)
    `);

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    const { data: tickets, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const mappedTickets: PlatformSupportTicket[] = (tickets || []).map((raw) => {
      const t = raw as Record<string, unknown>;
      const status = (t.status as PlatformSupportTicket['status']) || 'open';
      const priority = (t.priority as PlatformSupportTicket['priority']) || 'normal';
      const category = (t.category as PlatformSupportTicket['category']) || 'general';
      const createdAt = (t.created_at as string) || new Date().toISOString();

      // Check SLA
      const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
      const sla_breached =
        (priority === 'urgent' && ageHours > 2 && status !== 'resolved' && status !== 'closed') ||
        (priority === 'high' && ageHours > 6 && status !== 'resolved' && status !== 'closed');

      // The join with tenants returns either an array or object depending on relation
      const tenantsRaw = t.tenants as { name?: string } | Array<{ name?: string }> | undefined;
      const tenantName = Array.isArray(tenantsRaw) ? tenantsRaw[0]?.name : tenantsRaw?.name;

      return {
        id: (t.id as string) || '',
        tenant_id: (t.tenant_id as string) || '',
        tenant_name: tenantName || 'Store',
        merchant_email: (t.merchant_email as string) || 'merchant@store.com',
        subject: (t.subject as string) || 'Assistance Request',
        message: (t.message as string) || '',
        priority,
        status,
        category,
        assigned_to: (t.assigned_to as string) || null,
        internal_notes: (t.internal_notes as PlatformSupportTicket['internal_notes']) || [],
        sla_breached,
        created_at: createdAt,
        updated_at: (t.updated_at as string) || createdAt,
      };
    });

    return { tickets: mappedTickets };
  } catch (err) {
    console.error('Error fetching support tickets:', err);
    return { tickets: [], error: err instanceof Error ? err.message : 'Failed to fetch tickets' };
  }
}

/**
 * Admin: Update ticket status or assign staff
 */
export async function updateSupportTicketStatusAction(
  tenantId: string,
  ticketId: string,
  updates: {
    status?: PlatformSupportTicket['status'];
    priority?: PlatformSupportTicket['priority'];
    assigned_to?: string;
    newInternalNote?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/support']);
    const adminSupabase = createAdminClient();

    const { data: currentTicket, error: fetchError } = await adminSupabase
      .from('support_tickets')
      .select('internal_notes')
      .eq('id', ticketId)
      .maybeSingle();

    if (fetchError || !currentTicket) {
      return { success: false, error: 'Ticket not found' };
    }

    const notes = (currentTicket.internal_notes as Array<{ author: string; note: string; created_at: string }>) || [];

    if (updates.newInternalNote) {
      notes.push({
        author: user?.email || 'Support Staff',
        note: updates.newInternalNote,
        created_at: new Date().toISOString(),
      });
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      internal_notes: notes,
    };

    if (updates.status) updatePayload.status = updates.status;
    if (updates.priority) updatePayload.priority = updates.priority;
    if (updates.assigned_to) updatePayload.assigned_to = updates.assigned_to;
    
    if (updates.status === 'resolved' || updates.status === 'closed') {
      updatePayload.resolved_at = new Date().toISOString();
    }

    const { error: updateError } = await adminSupabase
      .from('support_tickets')
      .update(updatePayload)
      .eq('id', ticketId);

    if (updateError) {
      throw updateError;
    }

    // Audit log
    await logPlatformAuditAction({
      action: 'UPDATE_SUPPORT_TICKET',
      target_type: 'support_ticket',
      target_id: ticketId,
      target_name: `Ticket in ${tenantId}`,
      reason: `Updated status to ${updates.status || 'unchanged'}`,
      metadata: { updates },
    });

    revalidatePath('/platform/support');
    return { success: true };
  } catch (err) {
    console.error('Error updating support ticket:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update ticket' };
  }
}
