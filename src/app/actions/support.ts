'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';

export interface SupportTicketInput {
  category: 'issue' | 'feature' | 'billing' | 'onboarding' | 'other';
  message: string;
  isUrgent?: boolean;
}

export interface SupportTicketResult {
  success?: boolean;
  error?: string;
  ticketId?: string;
  referenceCode?: string;
}

export interface StoreDiagnostics {
  tenantId: string;
  storeName: string;
  userEmail: string;
  currency: string;
  productCount: number;
  activeBatchCount: number;
  supportPhone: string;
}

/**
 * Submits a verified merchant support ticket
 */
export async function submitSupportTicket(payload: SupportTicketInput): Promise<SupportTicketResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  if (!payload.message || !payload.message.trim()) {
    return { error: 'Please provide details for your support request' };
  }

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const referenceCode = `TKT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newTicket = {
      id: `ticket_${Date.now()}`,
      reference_code: referenceCode,
      user_id: user.id,
      user_email: user.email || 'unknown',
      category: payload.category || 'issue',
      message: payload.message.trim(),
      is_urgent: Boolean(payload.isUrgent),
      status: 'received',
      created_at: new Date().toISOString(),
    };

    // Persist ticket into tenant_settings history
    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const existingTickets = (currentData.support_tickets as unknown[]) || [];
    const updatedTickets = [newTicket, ...existingTickets.slice(0, 20)];

    await supabase.from('tenant_settings').upsert(
      {
        tenant_id: tenantId,
        settings_data: { ...currentData, support_tickets: updatedTickets },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    );

    return {
      success: true,
      ticketId: newTicket.id,
      referenceCode,
    };
  } catch (err) {
    console.error('Error submitting support ticket:', err);
    return { error: 'Failed to submit support request. Please contact WhatsApp support.' };
  }
}

/**
 * Retrieves diagnostic metadata for one-click merchant troubleshooting
 */
export async function getStoreSupportDiagnostics(): Promise<StoreDiagnostics | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    const [settingsRes, productsCountRes, batchesCountRes] = await Promise.all([
      supabase
        .from('tenant_settings')
        .select('store_name, store_currency, support_phone')
        .eq('tenant_id', tenantId)
        .maybeSingle(),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase
        .from('preorder_batches')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_active', true),
    ]);

    return {
      tenantId,
      storeName: settingsRes.data?.store_name || 'Merchander Store',
      userEmail: user.email || '',
      currency: settingsRes.data?.store_currency || 'GHS',
      productCount: productsCountRes.count || 0,
      activeBatchCount: batchesCountRes.count || 0,
      supportPhone: settingsRes.data?.support_phone || process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+233240000000',
    };
  } catch (err) {
    console.error('Error loading store diagnostics:', err);
    return null;
  }
}
