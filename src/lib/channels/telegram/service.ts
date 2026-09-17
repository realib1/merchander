import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Json } from '@/types/supabase';

interface TelegramCredentials {
  botToken?: string;
  bot_token?: string;
  botUsername?: string;
  bot_username?: string;
  webhookSecret?: string;
  webhook_secret?: string;
}

export interface TelegramConnection {
  tenantId: string;
  botToken: string;
  botUsername?: string;
}

interface ResolvedTelegramConnection extends TelegramConnection {
  webhookSecret: string | null;
}

function toPublicConnection(connection: ResolvedTelegramConnection): TelegramConnection {
  return {
    tenantId: connection.tenantId,
    botToken: connection.botToken,
    botUsername: connection.botUsername,
  };
}

function parseCredentials(credentials: Json | null): TelegramCredentials | null {
  if (!credentials) return null;
  if (typeof credentials === 'string') {
    try {
      const parsed: unknown = JSON.parse(credentials);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as TelegramCredentials)
        : null;
    } catch {
      return null;
    }
  }
  return typeof credentials === 'object' && !Array.isArray(credentials)
    ? (credentials as TelegramCredentials)
    : null;
}

function credentialValue(credentials: TelegramCredentials, ...keys: Array<keyof TelegramCredentials>) {
  for (const key of keys) {
    const value = credentials[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export async function resolveTelegramConnection(
  supabase: SupabaseClient<Database>,
  secretHeader: string
): Promise<TelegramConnection | null> {
  const { data, error } = await supabase
    .from('channel_connections')
    .select('tenant_id, credentials')
    .eq('channel', 'telegram')
    .eq('status', 'connected');

  if (error) {
    throw new Error(`Failed to resolve Telegram connection: ${error.message}`);
  }

  const connections = (data || [])
    .map((row): ResolvedTelegramConnection | null => {
      const credentials = parseCredentials(row.credentials);
      if (!credentials) return null;
      const botToken = credentialValue(credentials, 'botToken', 'bot_token');
      const webhookSecret = credentialValue(credentials, 'webhookSecret', 'webhook_secret');
      const botUsername = credentialValue(credentials, 'botUsername', 'bot_username') || undefined;
      if (!botToken) return null;
      return { tenantId: row.tenant_id, botToken, botUsername, webhookSecret };
    })
    .filter((connection): connection is ResolvedTelegramConnection => connection !== null);

  const explicitlyMatched = connections.filter((connection) => connection.webhookSecret === secretHeader);
  if (explicitlyMatched.length === 1) return toPublicConnection(explicitlyMatched[0]);
  if (explicitlyMatched.length > 1) return null;

  if (connections.length === 1 && process.env.TELEGRAM_SECRET_TOKEN === secretHeader) {
    return toPublicConnection(connections[0]);
  }

  return null;
}

export async function sendTelegramTextMessage({
  supabase,
  connection,
  chatId,
  text,
  channelIdentityId,
  metadata,
}: {
  supabase: SupabaseClient<Database>;
  connection: TelegramConnection;
  chatId: string;
  text: string;
  channelIdentityId: string;
  metadata?: Record<string, unknown>;
}) {
  const response = await fetch(`https://api.telegram.org/bot${connection.botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
    signal: AbortSignal.timeout(8000),
  });

  const data: unknown = await response.json();
  if (!response.ok || !data || typeof data !== 'object' || !('ok' in data) || data.ok !== true) {
    throw new Error(`Telegram sendMessage failed with status ${response.status}`);
  }

  const result = 'result' in data && data.result && typeof data.result === 'object' ? data.result : null;
  const externalId = result && 'message_id' in result ? String(result.message_id) : null;
  const content: Record<string, unknown> = { text };
  if (metadata) content.metadata = metadata;

  const { error } = await supabase.from('messages').insert({
    tenant_id: connection.tenantId,
    channel_identity_id: channelIdentityId,
    direction: 'outbound',
    type: 'text',
    status: 'sent',
    external_id: externalId,
    content: content as unknown as Json,
  });

  if (error) console.error('Failed to persist outbound Telegram message:', error);
  return data;
}
