'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import { PrivacySettings, AuditLogEntry } from '@/types/settings';

const DEFAULT_PRIVACY: PrivacySettings = {
  showCookieBanner: false,
  marketingConsentCheckbox: true,
  deleteAbandonedAfterDays: 90,
};

export async function getPrivacySettings(): Promise<PrivacySettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_PRIVACY;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data } = await supabase.from('tenant_settings').select('settings_data').eq('tenant_id', tenantId).single();
    const custom = (data?.settings_data as Record<string, unknown> | null)?.privacy_settings;
    if (custom && typeof custom === 'object') {
      return custom as unknown as PrivacySettings;
    }
  } catch (err) {
    console.error('Error fetching privacy settings:', err);
  }
  return DEFAULT_PRIVACY;
}

export async function updatePrivacySettings(payload: PrivacySettings) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') return { error: 'Insufficient permissions' };

    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .single();
    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const updatedData = { ...currentData, privacy_settings: payload };

    const { error } = await supabase
      .from('tenant_settings')
      .update({ settings_data: updatedData })
      .eq('tenant_id', tenantId);

    if (error) throw error;
    revalidatePath('/dashboard/settings/privacy');
    return { success: true };
  } catch (err) {
    console.error('Error updating privacy settings:', err);
    return { error: 'Failed to update privacy settings' };
  }
}

export async function getRecentAuditLogs(): Promise<AuditLogEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    // 1. Try querying audit_logs table
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('id, actor_name, actor_email, action, resource, ip_address, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error && logs && logs.length > 0) {
      return logs.map((l) => ({
        id: l.id,
        actorName: l.actor_name || 'Admin',
        actorEmail: l.actor_email || user.email || '',
        action: l.action || 'Updated settings',
        resource: l.resource || 'System',
        ipAddress: l.ip_address || undefined,
        createdAt: l.created_at,
      }));
    }

    // 2. Synthesize real activity from recent orders if audit_logs table has no custom rows yet
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, created_at, status, total_amount')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentOrders && recentOrders.length > 0) {
      return recentOrders.map((o) => ({
        id: `log-ord-${o.id}`,
        actorName: 'Commerce Engine',
        actorEmail: 'system@merchander.com',
        action: `Processed Order #${o.id.slice(0, 8)} (${o.status})`,
        resource: 'Orders',
        createdAt: o.created_at,
      }));
    }

    return [];
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return [];
  }
}

export async function fetchExportDataset(entity: 'products' | 'orders' | 'customers') {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated', data: [] };

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);

    if (entity === 'products') {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          id, name, description, category_id,
          categories(name),
          product_variants(id, sku, title, price, cost_price, inventory(stock_level))
        `
        )
        .eq('tenant_id', tenantId);

      if (error) throw error;
      return { success: true, data: data || [] };
    }

    if (entity === 'orders') {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id, created_at, status, total_amount, payment_method, sales_channel, delivery_address,
          customers(name, phone, email)
        `
        )
        .eq('tenant_id', tenantId);

      if (error) throw error;
      return { success: true, data: data || [] };
    }

    if (entity === 'customers') {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, email, notes, created_at')
        .eq('tenant_id', tenantId);

      if (error) throw error;
      return { success: true, data: data || [] };
    }

    return { error: 'Unknown export entity', data: [] };
  } catch (err) {
    console.error('Error exporting dataset:', err);
    return { error: 'Failed to retrieve export dataset', data: [] };
  }
}
