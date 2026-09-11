'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import {
  SupportTicket,
  SupportTicketMessage,
  CreateTicketPayload,
  SystemIncident,
  SystemContext,
  TicketStatus,
  TicketPriority,
} from '@/types/support';
import { HELP_ARTICLES } from '@/utils/help-center-data';
import { verifyPlatformStaff } from './platform';
import type { PlatformRole } from '@/types/platform';

const PLATFORM_SUPPORT_ROLES: PlatformRole[] = [
  'platform_owner',
  'platform_admin',
  'operations',
  'support',
  'compliance',
];

async function getAdminOrUserClient() {
  try {
    return createAdminClient();
  } catch {
    return await createClient();
  }
}

const DEFAULT_INCIDENTS: SystemIncident[] = [
  {
    id: 'inc-core',
    service: 'core_api',
    status: 'operational',
    title: 'Core Checkout & APIs',
    message: 'All core checkout and order processing services operational.',
    affected_areas: [],
    is_active: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inc-storefront',
    service: 'storefront',
    status: 'operational',
    title: 'Public Storefronts & CDN',
    message: 'Global edge storefront delivery operating normally.',
    affected_areas: [],
    is_active: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inc-whatsapp',
    service: 'whatsapp',
    status: 'operational',
    title: 'WhatsApp Automation',
    message: 'Cloud API Webhooks and message dispatching active.',
    affected_areas: [],
    is_active: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inc-payments',
    service: 'payments',
    status: 'operational',
    title: 'Mobile Money & Payment Gateways',
    message: 'MTN MoMo, Telecel Cash, and Paystack channels live.',
    affected_areas: [],
    is_active: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Loads all support hub data for the current merchant
 */
export async function getMerchantSupportData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fallback = {
    tickets: [] as SupportTicket[],
    incidents: DEFAULT_INCIDENTS,
    articles: HELP_ARTICLES,
    diagnostics: null,
  };

  if (!user) return fallback;

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);

    const [settingsRes, productsCountRes, batchesCountRes, ticketsRes] = await Promise.all([
      supabase
        .from('tenant_settings')
        .select('store_name, slug, store_currency, support_phone, support_email, settings_data')
        .eq('tenant_id', tenantId)
        .maybeSingle(),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase
        .from('preorder_batches')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_active', true),
      supabase
        .from('support_tickets')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false }),
    ]);

    const settingsData = (settingsRes.data?.settings_data as Record<string, unknown>) || {};
    const ticketsResData = (ticketsRes.data || []) as Array<Record<string, unknown>>;
    const tickets: SupportTicket[] = ticketsResData.map(t => ({
      ...(t as unknown as SupportTicket),
      user_email: (t.merchant_email as string) || '',
    }));
    const incidents = (settingsData.system_incidents as SystemIncident[]) || DEFAULT_INCIDENTS;

    const diagnostics = {
      tenantId,
      storeName: settingsRes.data?.store_name || 'Store',
      storeSlug: settingsRes.data?.slug || '',
      userEmail: user.email || '',
      userRole: role,
      currency: settingsRes.data?.store_currency || 'GHS',
      productCount: productsCountRes.count || 0,
      activeBatchCount: batchesCountRes.count || 0,
      supportPhone: settingsRes.data?.support_phone || process.env.NEXT_PUBLIC_SUPPORT_PHONE || null,
      supportEmail:
        settingsRes.data?.support_email || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@merchander.com',
      businessHoursSummary: (settingsData.business_hours_summary as string) || undefined,
    };

    return {
      tickets,
      incidents,
      articles: HELP_ARTICLES,
      diagnostics,
    };
  } catch (err) {
    console.error('Error loading merchant support data:', err);
    return fallback;
  }
}

/**
 * Submits a new context-aware support ticket
 */
export async function createSupportTicket(payload: CreateTicketPayload): Promise<{
  success?: boolean;
  ticket?: SupportTicket;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  if (!payload.subject.trim() || !payload.message.trim()) {
    return { error: 'Please provide both a subject and message description' };
  }

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    const { data: settings } = await supabase
      .from('tenant_settings')
      .select('store_name, slug, store_currency')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const { count } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    const refNumber = 1000 + (count || 0) + 1;
    const referenceCode = `#${refNumber}`;

    const enrichedContext: SystemContext = {
      ...payload.system_context,
      store_name: settings?.store_name || 'Store',
      store_slug: settings?.slug || '',
      tenant_id: tenantId,
      currency: settings?.store_currency || 'GHS',
      timestamp: new Date().toISOString(),
    };

    const initialMessage: SupportTicketMessage = {
      id: `msg_${Date.now()}`,
      ticket_id: `tkt_${Date.now()}`,
      sender_type: 'merchant',
      sender_id: user.id,
      sender_name: user.email?.split('@')[0] || 'Merchant',
      message: payload.message.trim(),
      attachments: payload.attachments || [],
      created_at: new Date().toISOString(),
    };

    const newTicket = {
      reference_code: referenceCode,
      tenant_id: tenantId,
      user_id: user.id,
      merchant_email: user.email || '',
      subject: payload.subject.trim(),
      message: payload.message.trim(),
      category: payload.category || 'other',
      priority: payload.priority || 'normal',
      status: 'open',
      is_escalated: payload.priority === 'urgent',
      system_context: enrichedContext,
      messages: [initialMessage],
    };

    const { data: insertedTicket, error: insertError } = await supabase
      .from('support_tickets')
      .insert(newTicket)
      .select('*')
      .single();

    if (insertError) {
      throw insertError;
    }

    revalidatePath('/dashboard/help');
    revalidatePath('/platform/support');
    return { success: true, ticket: insertedTicket as unknown as SupportTicket };
  } catch (err) {
    console.error('Error creating support ticket:', err);
    return { error: 'Failed to create support ticket' };
  }
}

/**
 * Adds a reply to an existing support ticket thread
 */
export async function addTicketMessage(
  ticketId: string,
  message: string,
  attachments?: string[]
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  if (!message.trim()) return { error: 'Message cannot be empty' };

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    const { data: targetTicket, error: fetchError } = await supabase
      .from('support_tickets')
      .select('messages, status')
      .eq('id', ticketId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (fetchError || !targetTicket) return { error: 'Ticket not found' };

    const newMsg: SupportTicketMessage = {
      id: `msg_${Date.now()}`,
      ticket_id: ticketId,
      sender_type: 'merchant',
      sender_id: user.id,
      sender_name: user.email?.split('@')[0] || 'Merchant',
      message: message.trim(),
      attachments: attachments || [],
      created_at: new Date().toISOString(),
    };

    const messages = targetTicket.messages || [];
    messages.push(newMsg);

    const newStatus = targetTicket.status === 'waiting_for_merchant' ? 'in_progress' : targetTicket.status;

    const { error: updateError } = await supabase
      .from('support_tickets')
      .update({
        status: newStatus,
        messages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .eq('tenant_id', tenantId);

    if (updateError) {
      throw updateError;
    }

    revalidatePath('/dashboard/help');
    revalidatePath('/platform/support');
    return { success: true };
  } catch (err) {
    console.error('Error adding ticket message:', err);
    return { error: 'Failed to send message' };
  }
}

/**
 * Admin: Fetch all tickets across all tenants
 */
export async function getPlatformSupportInbox(): Promise<{ tickets: SupportTicket[]; error?: string }> {
  try {
    await verifyPlatformStaff(PLATFORM_SUPPORT_ROLES);
    const adminSupabase = await getAdminOrUserClient();

    const { data: tickets, error: fetchError } = await adminSupabase
      .from('support_tickets')
      .select('*');

    if (fetchError) {
      throw fetchError;
    }

    const allTickets: SupportTicket[] = (tickets || []).map((t: Record<string, unknown>) => ({
      ...(t as unknown as SupportTicket),
      user_email: (t.merchant_email as string) || '',
    }));

    const priorityWeight: Record<TicketPriority, number> = {
      urgent: 4,
      high: 3,
      normal: 2,
      low: 1,
    };

    allTickets.sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return { tickets: allTickets };
  } catch (err) {
    console.error('Error loading admin support inbox:', err);
    return { tickets: [], error: 'Failed to load support inbox' };
  }
}

/**
 * Admin: Update ticket status, escalation, or priority
 */
export async function updatePlatformTicket(
  tenantId: string,
  ticketId: string,
  updates: {
    status?: TicketStatus;
    priority?: TicketPriority;
    is_escalated?: boolean;
    replyMessage?: string;
    isInternalNote?: boolean;
  }
): Promise<{ success?: boolean; error?: string }> {
  try {
    await verifyPlatformStaff(PLATFORM_SUPPORT_ROLES);
    const adminSupabase = await getAdminOrUserClient();

    const { data: target, error: fetchError } = await adminSupabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (fetchError || !target) return { error: 'Ticket not found' };

    const messages = target.messages || [];

    if (updates.replyMessage?.trim()) {
      messages.push({
        id: `msg_${Date.now()}`,
        ticket_id: ticketId,
        sender_type: 'support',
        sender_id: 'admin',
        sender_name: updates.isInternalNote ? 'Internal Note' : 'Merchander Support Specialist',
        message: updates.replyMessage.trim(),
        is_internal_note: updates.isInternalNote,
        created_at: new Date().toISOString(),
      });
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      messages,
    };

    if (updates.status) updatePayload.status = updates.status;
    if (updates.priority) updatePayload.priority = updates.priority;
    if (typeof updates.is_escalated === 'boolean') updatePayload.is_escalated = updates.is_escalated;
    if (updates.status === 'resolved' || updates.status === 'closed') {
      updatePayload.resolved_at = new Date().toISOString();
    }

    const { error: updateError } = await adminSupabase
      .from('support_tickets')
      .update(updatePayload)
      .eq('id', ticketId)
      .eq('tenant_id', tenantId);

    if (updateError) {
      throw updateError;
    }

    revalidatePath('/dashboard/help');
    revalidatePath('/platform/support');
    return { success: true };
  } catch (err) {
    console.error('Error updating admin ticket:', err);
    return { error: 'Failed to update ticket' };
  }
}
