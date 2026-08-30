'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import { ChannelSettings, ConversationSettings, AutomationSettings } from '@/types/settings';

const DEFAULT_CHANNELS: ChannelSettings = {
  whatsappConnected: false,
  whatsappPhone: '',
  instagramConnected: false,
  instagramHandle: '',
  messengerConnected: false,
  webhookUrl: 'https://api.merchander.com/api/webhooks/whatsapp',
};

const DEFAULT_CONVERSATIONS: ConversationSettings = {
  autoAssignStaff: true,
  stickyRouting: true,
  enableSlaTracking: true,
  targetSlaMinutes: 30,
};

const DEFAULT_AUTOMATION: AutomationSettings = {
  welcomeMessageEnabled: true,
  welcomeGreeting: 'Hi there! Welcome to our store. How can we help you today?',
  awayMessageEnabled: true,
  awayMessage: "Thanks for reaching out! We're currently closed. We'll reply as soon as we reopen.",
  rules: [
    {
      id: 'rule-location',
      name: 'Store Location',
      keywords: ['location', 'where are you', 'address', 'shop'],
      replyText: 'Our store is located in Accra, Ghana. We also offer fast nation-wide dispatch!',
      isActive: true,
    },
    {
      id: 'rule-delivery',
      name: 'Delivery Fees',
      keywords: ['delivery', 'shipping', 'how much for delivery', 'courier'],
      replyText: 'Standard delivery in Accra is GHS 30 (1-2 days). Inter-city delivery across Ghana is GHS 50.',
      isActive: true,
    },
  ],
};

export async function getChannelSettings(): Promise<ChannelSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_CHANNELS;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data } = await supabase.from('tenant_settings').select('settings_data').eq('tenant_id', tenantId).single();
    const custom = (data?.settings_data as Record<string, unknown> | null)?.channel_settings;
    if (custom && typeof custom === 'object') {
      return custom as unknown as ChannelSettings;
    }
  } catch (err) {
    console.error('Error fetching channel settings:', err);
  }
  return DEFAULT_CHANNELS;
}

export async function updateChannelSettings(payload: ChannelSettings) {
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
    const updatedData = { ...currentData, channel_settings: payload };

    const { error } = await supabase
      .from('tenant_settings')
      .update({ settings_data: updatedData })
      .eq('tenant_id', tenantId);

    if (error) throw error;
    revalidatePath('/dashboard/settings/channels');
    return { success: true };
  } catch (err) {
    console.error('Error updating channel settings:', err);
    return { error: 'Failed to update channel settings' };
  }
}

export async function getConversationSettings(): Promise<ConversationSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_CONVERSATIONS;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data } = await supabase.from('tenant_settings').select('settings_data').eq('tenant_id', tenantId).single();
    const custom = (data?.settings_data as Record<string, unknown> | null)?.conversation_settings;
    if (custom && typeof custom === 'object') {
      return custom as unknown as ConversationSettings;
    }
  } catch (err) {
    console.error('Error fetching conversation settings:', err);
  }
  return DEFAULT_CONVERSATIONS;
}

export async function updateConversationSettings(payload: ConversationSettings) {
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
    const updatedData = { ...currentData, conversation_settings: payload };

    const { error } = await supabase
      .from('tenant_settings')
      .update({ settings_data: updatedData })
      .eq('tenant_id', tenantId);

    if (error) throw error;
    revalidatePath('/dashboard/settings/conversations');
    return { success: true };
  } catch (err) {
    console.error('Error updating conversation settings:', err);
    return { error: 'Failed to update conversation settings' };
  }
}

export async function getAutomationSettings(): Promise<AutomationSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_AUTOMATION;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data } = await supabase.from('tenant_settings').select('settings_data').eq('tenant_id', tenantId).single();
    const custom = (data?.settings_data as Record<string, unknown> | null)?.automation_settings;
    if (custom && typeof custom === 'object') {
      return custom as unknown as AutomationSettings;
    }
  } catch (err) {
    console.error('Error fetching automation settings:', err);
  }
  return DEFAULT_AUTOMATION;
}

export async function updateAutomationSettings(payload: AutomationSettings) {
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
    const updatedData = { ...currentData, automation_settings: payload };

    const { error } = await supabase
      .from('tenant_settings')
      .update({ settings_data: updatedData })
      .eq('tenant_id', tenantId);

    if (error) throw error;
    revalidatePath('/dashboard/settings/automation');
    return { success: true };
  } catch (err) {
    console.error('Error updating automation settings:', err);
    return { error: 'Failed to update automation settings' };
  }
}
