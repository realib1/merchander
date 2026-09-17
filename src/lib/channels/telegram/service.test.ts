import { describe, expect, it, vi } from 'vitest';
import { resolveTelegramConnection, sendTelegramTextMessage } from './service';

function createSupabaseMock(rows: unknown[]) {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(),
    then: (resolve: (value: unknown) => unknown) => resolve({ data: rows, error: null }),
  };
  return {
    from: vi.fn((table: string) => (table === 'messages' ? { insert } : query)),
    insert,
    query,
  };
}

describe('Telegram channel service', () => {
  it('resolves a single connected tenant using the platform webhook secret', async () => {
    vi.stubEnv('TELEGRAM_SECRET_TOKEN', 'platform-secret');
    const supabase = createSupabaseMock([
      {
        tenant_id: 'tenant-1',
        credentials: JSON.stringify({ bot_token: 'bot-token', bot_username: '@shop' }),
      },
    ]);

    await expect(resolveTelegramConnection(supabase as never, 'platform-secret')).resolves.toEqual({
      tenantId: 'tenant-1',
      botToken: 'bot-token',
      botUsername: '@shop',
    });
  });

  it('does not choose a tenant when the webhook secret is ambiguous', async () => {
    vi.stubEnv('TELEGRAM_SECRET_TOKEN', 'platform-secret');
    const supabase = createSupabaseMock([
      { tenant_id: 'tenant-1', credentials: { bot_token: 'bot-1' } },
      { tenant_id: 'tenant-2', credentials: { bot_token: 'bot-2' } },
    ]);

    await expect(resolveTelegramConnection(supabase as never, 'platform-secret')).resolves.toBeNull();
  });

  it('sends and persists a Telegram text message', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, result: { message_id: 77 } }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const supabase = createSupabaseMock([]);

    await sendTelegramTextMessage({
      supabase: supabase as never,
      connection: { tenantId: 'tenant-1', botToken: 'bot-token' },
      chatId: '123',
      text: 'Hello from the store',
      channelIdentityId: 'identity-1',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.telegram.org/botbot-token/sendMessage',
      expect.objectContaining({ body: JSON.stringify({ chat_id: '123', text: 'Hello from the store' }) })
    );
    expect(supabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 'tenant-1',
        channel_identity_id: 'identity-1',
        direction: 'outbound',
        external_id: '77',
      })
    );
  });
});
