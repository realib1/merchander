'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import { ChannelSettings, ConversationSettings, AutomationSettings } from '@/types/settings';

const DEFAULT_CHANNELS: ChannelSettings = {
  whatsapp: {
    connected: false,
    phoneNumber: '',
    enableFloatingStorefrontWidget: true,
    widgetGreeting: 'Hello! I would like to make an inquiry.',
    connectionType: 'direct_link',
  },
  instagram: {
    connected: false,
    handle: '',
    syncDirectMessages: true,
    syncStoryMentions: true,
  },
  messenger: {
    connected: false,
    pageId: '',
    syncMessages: true,
  },
  telegram: {
    connected: false,
    botUsername: '',
    orderNotificationAlerts: true,
  },
  webhookUrl: 'https://api.merchander.com/api/webhooks/whatsapp',
  whatsappConnected: false,
  whatsappPhone: '',
  instagramConnected: false,
  instagramHandle: '',
  messengerConnected: false,
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
  rules: [],
  aiAgent: {
    enabled: false,
    mode: 'assisted',
    responseTone: 'friendly',
    groundingEnabled: true,
    safetyTier: 'standard',
  },
};

export async function getChannelSettings(): Promise<ChannelSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_CHANNELS;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    const custom = (data?.settings_data as Record<string, unknown> | null)?.channel_settings as
      Record<string, unknown> | undefined;
    if (custom && typeof custom === 'object') {
      const whatsappCustom = (custom.whatsapp as Record<string, unknown>) || {};
      const instagramCustom = (custom.instagram as Record<string, unknown>) || {};
      const messengerCustom = (custom.messenger as Record<string, unknown>) || {};
      const telegramCustom = (custom.telegram as Record<string, unknown>) || {};

      const isWaConnected = Boolean(whatsappCustom.connected ?? custom.whatsappConnected ?? false);
      const waPhone = (whatsappCustom.phoneNumber ?? custom.whatsappPhone ?? '') as string;
      const isIgConnected = Boolean(instagramCustom.connected ?? custom.instagramConnected ?? false);
      const igHandle = (instagramCustom.handle ?? custom.instagramHandle ?? '') as string;
      const isFbConnected = Boolean(messengerCustom.connected ?? custom.messengerConnected ?? false);

      return {
        whatsapp: {
          ...DEFAULT_CHANNELS.whatsapp,
          ...whatsappCustom,
          connected: isWaConnected,
          phoneNumber: waPhone,
        },
        instagram: {
          ...DEFAULT_CHANNELS.instagram,
          ...instagramCustom,
          connected: isIgConnected,
          handle: igHandle,
        },
        messenger: {
          ...DEFAULT_CHANNELS.messenger,
          ...messengerCustom,
          connected: isFbConnected,
          pageId: (messengerCustom.pageId ?? '') as string,
        },
        telegram: {
          ...DEFAULT_CHANNELS.telegram,
          ...telegramCustom,
        },
        webhookUrl: (custom.webhookUrl as string) || DEFAULT_CHANNELS.webhookUrl,
        whatsappConnected: isWaConnected,
        whatsappPhone: waPhone,
        instagramConnected: isIgConnected,
        instagramHandle: igHandle,
        messengerConnected: isFbConnected,
      };
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
    const { botToken, webhookSecret, ...telegramPreferences } = payload.telegram;
    if (payload.instagram.connected || payload.messenger.connected) {
      return { error: 'Instagram and Messenger customer connectors are not available yet' };
    }

    const whatsappIsCloud = payload.whatsapp.connectionType === 'cloud_api';
    const whatsappToken = payload.whatsapp.apiKeyOrToken?.trim() || '';
    const whatsappPhoneNumberId = payload.whatsapp.phoneNumberId?.trim() || '';
    if (payload.whatsapp.connected && whatsappIsCloud && (!whatsappToken || !whatsappPhoneNumberId)) {
      return { error: 'A WhatsApp Cloud API token and phone number ID are required before activation' };
    }
    let runtimeBotToken = botToken?.trim() || '';
    let runtimeWebhookSecret = webhookSecret?.trim() || '';
    if (payload.telegram.connected && !runtimeBotToken) {
      const { data: existingTelegram } = await supabase
        .from('channel_connections')
        .select('credentials, status')
        .eq('tenant_id', tenantId)
        .eq('channel', 'telegram')
        .maybeSingle();
      const credentials = existingTelegram?.credentials;
      const parsedCredentials =
        typeof credentials === 'string'
          ? (JSON.parse(credentials) as Record<string, unknown>)
          : (credentials as Record<string, unknown> | null);
      const existingToken = parsedCredentials?.bot_token || parsedCredentials?.botToken;
      runtimeBotToken = typeof existingToken === 'string' ? existingToken.trim() : '';
      const existingWebhookSecret = parsedCredentials?.webhook_secret || parsedCredentials?.webhookSecret;
      runtimeWebhookSecret = typeof existingWebhookSecret === 'string' ? existingWebhookSecret.trim() : '';
      if (!runtimeBotToken) {
        return { error: 'A Telegram bot token is required before activating the connector' };
      }
    }

    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const updatedData = {
      ...currentData,
      channel_settings: {
        ...payload,
        telegram: telegramPreferences,
      },
    };

    const { error } = await supabase.from('tenant_settings').upsert(
      {
        tenant_id: tenantId,
        settings_data: updatedData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    );

    if (error) throw error;

    const { error: connectionError } = await supabase.from('channel_connections').upsert(
      {
        tenant_id: tenantId,
        channel: 'telegram',
        status: payload.telegram.connected ? 'connected' : 'disconnected',
          credentials: runtimeBotToken
          ? JSON.stringify({
            bot_token: runtimeBotToken,
              bot_username: payload.telegram.botUsername?.trim() || undefined,
              webhook_secret: runtimeWebhookSecret || undefined,
            })
          : null,
        settings: JSON.stringify({ order_notification_alerts: payload.telegram.orderNotificationAlerts }),
        last_health_check: new Date().toISOString(),
        error_message: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,channel' }
    );
    if (connectionError) throw connectionError;

    if (whatsappIsCloud && whatsappToken && whatsappPhoneNumberId) {
      const { error: whatsappConnectionError } = await supabase.from('channel_connections').upsert(
        {
          tenant_id: tenantId,
          channel: 'whatsapp_cloud',
          status: payload.whatsapp.connected ? 'connected' : 'disconnected',
          credentials: JSON.stringify({
            phone_number_id: whatsappPhoneNumberId,
            access_token: whatsappToken,
          }),
          settings: JSON.stringify({ auto_reply: true }),
          last_health_check: new Date().toISOString(),
          error_message: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,channel' }
      );
      if (whatsappConnectionError) throw whatsappConnectionError;
    }

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
    const { data } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();
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
      .maybeSingle();
    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const updatedData = { ...currentData, conversation_settings: payload };

    const { error } = await supabase.from('tenant_settings').upsert(
      {
        tenant_id: tenantId,
        settings_data: updatedData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    );

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
    const { data } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    const custom = (data?.settings_data as Record<string, unknown> | null)?.automation_settings;
    if (custom && typeof custom === 'object') {
      const customAuto = custom as Partial<AutomationSettings>;
      return {
        ...DEFAULT_AUTOMATION,
        ...customAuto,
        aiAgent: {
          ...DEFAULT_AUTOMATION.aiAgent!,
          ...(customAuto.aiAgent || {}),
        },
      };
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
      .maybeSingle();
    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const updatedData = { ...currentData, automation_settings: payload };

    const { error } = await supabase.from('tenant_settings').upsert(
      {
        tenant_id: tenantId,
        settings_data: updatedData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    );

    if (error) throw error;
    revalidatePath('/dashboard/settings/automation');
    return { success: true };
  } catch (err) {
    console.error('Error updating automation settings:', err);
    return { error: 'Failed to update automation settings' };
  }
}
