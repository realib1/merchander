'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ChannelConnection {
  id: string;
  tenant_id: string;
  channel: 'whatsapp_cloud' | 'telegram' | 'instagram' | 'facebook';
  status: 'connected' | 'disconnected' | 'error' | 'pending_verification';
  credentials?: Record<string, unknown> | null;
  settings?: {
    auto_reply?: boolean;
    human_escalation?: boolean;
    welcome_message?: string;
  } | null;
  last_health_check?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export async function getChannelConnections(): Promise<ChannelConnection[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) return [];

  const { data, error } = await supabase.from('channel_connections').select('*').eq('tenant_id', tenantUser.tenant_id);

  if (error) {
    if (error.code === '42P01') return [];
    console.warn('Notice: Could not fetch channel connections:', error.message || error.code || error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    tenant_id: row.tenant_id,
    channel: row.channel as ChannelConnection['channel'],
    status: row.status as ChannelConnection['status'],
    credentials: (row.credentials as Record<string, unknown> | null) || null,
    settings: (row.settings as ChannelConnection['settings']) || null,
    last_health_check: row.last_health_check,
    error_message: row.error_message,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function updateChannelConnection(input: {
  channel: 'whatsapp_cloud' | 'telegram' | 'instagram' | 'facebook';
  status: 'connected' | 'disconnected' | 'error' | 'pending_verification';
  credentials?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) throw new Error('Tenant not found');

  const { data, error } = await supabase
    .from('channel_connections')
    .upsert(
      {
        tenant_id: tenantUser.tenant_id,
        channel: input.channel,
        status: input.status,
        credentials: input.credentials ? JSON.stringify(input.credentials) : null,
        settings: input.settings ? JSON.stringify(input.settings) : null,
        last_health_check: new Date().toISOString(),
        error_message: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,channel' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error updating channel connection:', error);
    throw new Error(`Failed to update channel connection: ${error.message}`);
  }

  revalidatePath('/dashboard/settings/channels');
  return data;
}

export async function disconnectChannel(channel: 'whatsapp_cloud' | 'telegram' | 'instagram' | 'facebook') {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) throw new Error('Tenant not found');

  const { error } = await supabase
    .from('channel_connections')
    .update({
      status: 'disconnected',
      credentials: null,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantUser.tenant_id)
    .eq('channel', channel);

  if (error) {
    console.error('Error disconnecting channel:', error);
    throw new Error(`Failed to disconnect channel: ${error.message}`);
  }

  revalidatePath('/dashboard/settings/channels');
  return { success: true };
}
