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

    const [
      { data: settings },
      { data: tenants },
    ] = await Promise.all([
      adminSupabase.from('tenant_settings').select('tenant_id, store_name, store_email, settings_data'),
      adminSupabase.from('tenants').select('id, name'),
    ]);

    const tenantMap = new Map<string, { name: string; email: string }>();
    (tenants || []).forEach((t) => tenantMap.set(t.id, { name: t.name, email: '' }));
    (settings || []).forEach((s) => {
      const existing = tenantMap.get(s.tenant_id);
      tenantMap.set(s.tenant_id, {
        name: existing?.name || s.store_name || 'Merchant',
        email: s.store_email || '',
      });
    });

    const allTickets: PlatformSupportTicket[] = [];

    (settings || []).forEach((s) => {
      const customData = (s.settings_data as Record<string, unknown>) || {};
      const rawTickets = (customData.support_tickets as Array<Record<string, unknown>>) || [];
      const tenantInfo = tenantMap.get(s.tenant_id);

      rawTickets.forEach((t) => {
        const ticketId = (t.id as string) || `tkt_${Math.random().toString(36).substring(7)}`;
        const status = (t.status as PlatformSupportTicket['status']) || 'open';
        const priority = (t.priority as PlatformSupportTicket['priority']) || 'normal';
        const category = (t.category as PlatformSupportTicket['category']) || 'general';
        const createdAt = (t.created_at as string) || new Date().toISOString();

        // Check SLA (e.g. urgent tickets older than 2 hours or high tickets older than 6 hours)
        const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
        const sla_breached =
          (priority === 'urgent' && ageHours > 2 && status !== 'resolved' && status !== 'closed') ||
          (priority === 'high' && ageHours > 6 && status !== 'resolved' && status !== 'closed');

        allTickets.push({
          id: ticketId,
          tenant_id: s.tenant_id,
          tenant_name: tenantInfo?.name || 'Store',
          merchant_email: (t.merchant_email as string) || tenantInfo?.email || 'merchant@store.com',
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
        });
      });
    });

    // Apply filters
    let filtered = allTickets;
    if (filters?.status && filters.status !== 'all') {
      filtered = filtered.filter((t) => t.status === filters.status);
    }
    if (filters?.priority && filters.priority !== 'all') {
      filtered = filtered.filter((t) => t.priority === filters.priority);
    }
    if (filters?.category && filters.category !== 'all') {
      filtered = filtered.filter((t) => t.category === filters.category);
    }

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { tickets: filtered };
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

    const { data: setting } = await adminSupabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const customData = (setting?.settings_data as Record<string, unknown>) || {};
    const tickets = (customData.support_tickets as Array<Record<string, unknown>>) || [];
    const idx = tickets.findIndex((t) => t.id === ticketId);

    if (idx === -1) {
      return { success: false, error: 'Ticket not found' };
    }

    const currentTicket = tickets[idx];
    const notes = (currentTicket.internal_notes as Array<{ author: string; note: string; created_at: string }>) || [];

    if (updates.newInternalNote) {
      notes.push({
        author: user?.email || 'Support Staff',
        note: updates.newInternalNote,
        created_at: new Date().toISOString(),
      });
    }

    const updatedTicket = {
      ...currentTicket,
      ...(updates.status ? { status: updates.status } : {}),
      ...(updates.priority ? { priority: updates.priority } : {}),
      ...(updates.assigned_to ? { assigned_to: updates.assigned_to } : {}),
      internal_notes: notes,
      updated_at: new Date().toISOString(),
    };

    tickets[idx] = updatedTicket;

    await adminSupabase.from('tenant_settings').upsert(
      {
        tenant_id: tenantId,
        settings_data: { ...customData, support_tickets: tickets },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    );

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
