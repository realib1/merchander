
import {
  getAutomationSettings,
  updateAutomationSettings,
  getChannelSettings,
  updateChannelSettings,
} from './settings-social';
import { ChannelSettings } from '@/types/settings';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/queries', () => ({
  getTenantInfo: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';

describe('settings-social automation & AI agent actions', () => {
  let mockSupabase: {
    auth: {
      getUser: ReturnType<typeof vi.fn>;
    };
    from: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    };

    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
  });

  it('returns default automation settings including aiAgent when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const settings = await getAutomationSettings();
    expect(settings.welcomeMessageEnabled).toBe(true);
    expect(settings.aiAgent).toBeDefined();
    expect(settings.aiAgent?.enabled).toBe(false);
    expect(settings.aiAgent?.mode).toBe('assisted');
    expect(settings.aiAgent?.groundingEnabled).toBe(true);
  });

  it('merges default aiAgent settings when tenant has existing legacy automation settings', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });

    (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      tenantId: 'tenant-123',
      role: 'owner',
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              settings_data: {
                automation_settings: {
                  welcomeMessageEnabled: false,
                  welcomeGreeting: 'Custom greeting',
                  awayMessageEnabled: true,
                  awayMessage: 'Custom away',
                  rules: [],
                },
              },
            },
          }),
        }),
      }),
    });

    const settings = await getAutomationSettings();
    expect(settings.welcomeGreeting).toBe('Custom greeting');
    expect(settings.welcomeMessageEnabled).toBe(false);
    expect(settings.aiAgent).toBeDefined();
    expect(settings.aiAgent?.enabled).toBe(false);
    expect(settings.aiAgent?.mode).toBe('assisted');
    expect(settings.aiAgent?.groundingEnabled).toBe(true);
  });

  it('updates automation and aiAgent settings successfully for tenant owner/admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });

    (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      tenantId: 'tenant-123',
      role: 'owner',
    });

    const upsertMock = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'tenant_settings') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { settings_data: {} },
              }),
            }),
          }),
          upsert: upsertMock,
        };
      }
      return {};
    });

    const payload = {
      welcomeMessageEnabled: true,
      welcomeGreeting: 'Welcome!',
      awayMessageEnabled: false,
      awayMessage: 'Away',
      rules: [],
      aiAgent: {
        enabled: true,
        mode: 'autonomous' as const,
        responseTone: 'concise' as const,
        groundingEnabled: true,
        safetyTier: 'strict' as const,
      },
    };

    const res = await updateAutomationSettings(payload);
    expect(res).toEqual({ success: true });
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 'tenant-123',
        settings_data: expect.objectContaining({
          automation_settings: payload,
        }),
      }),
      { onConflict: 'tenant_id' }
    );
  });

  it('rejects update when user does not have owner or admin permissions', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-2' } },
    });

    (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      tenantId: 'tenant-123',
      role: 'member',
    });

    const res = await updateAutomationSettings({
      welcomeMessageEnabled: true,
      welcomeGreeting: 'Hi',
      awayMessageEnabled: false,
      awayMessage: 'Bye',
      rules: [],
    });

    expect(res).toEqual({ error: 'Insufficient permissions' });
  });

  describe('connected channels actions', () => {
    it('returns default channel settings when user is unauthenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const settings = await getChannelSettings();
      expect(settings.whatsapp.connected).toBe(false);
      expect(settings.instagram.connected).toBe(false);
      expect(settings.messenger.connected).toBe(false);
      expect(settings.telegram.connected).toBe(false);
      expect(settings.webhookUrl).toBe('https://api.merchander.com/api/webhooks/whatsapp');
    });

    it('returns custom channel configuration when present in tenant settings', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });
      (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        tenantId: 'tenant-123',
        role: 'owner',
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                settings_data: {
                  channel_settings: {
                    whatsapp: {
                      connected: true,
                      phoneNumber: '0241234567',
                    },
                    instagram: {
                      connected: false,
                      handle: '@merchander_gh',
                      syncDirectMessages: false,
                      syncStoryMentions: false,
                    },
                    messenger: {
                      connected: false,
                      pageId: '123456789',
                    },
                    telegram: {
                      connected: false,
                      botUsername: '@test_bot',
                    },
                  },
                },
              },
            }),
          }),
        }),
      });

      const settings = await getChannelSettings();
      expect(settings.whatsapp.connected).toBe(true);
      expect(settings.whatsapp.phoneNumber).toBe('0241234567');
      expect(settings.instagram.handle).toBe('@merchander_gh');
      expect(settings.messenger.pageId).toBe('123456789');
      expect(settings.telegram.botUsername).toBe('@test_bot');
    });

    it('rejects updateChannelSettings when user is unauthenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const res = await updateChannelSettings({
        whatsapp: { connected: false, phoneNumber: '', enableFloatingStorefrontWidget: true, widgetGreeting: '', connectionType: 'direct_link' },
        instagram: { connected: false, handle: '', syncDirectMessages: false, syncStoryMentions: false },
        messenger: { connected: false, pageId: '', syncMessages: false },
        telegram: { connected: false, botUsername: '', orderNotificationAlerts: false },
        webhookUrl: '',
      });

      expect(res).toEqual({ error: 'Not authenticated' });
    });

    it('rejects updateChannelSettings for non-admin/owner roles', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-staff' } },
      });
      (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        tenantId: 'tenant-123',
        role: 'viewer',
      });

      const res = await updateChannelSettings({
        whatsapp: { connected: false, phoneNumber: '', enableFloatingStorefrontWidget: true, widgetGreeting: '', connectionType: 'direct_link' },
        instagram: { connected: false, handle: '', syncDirectMessages: false, syncStoryMentions: false },
        messenger: { connected: false, pageId: '', syncMessages: false },
        telegram: { connected: false, botUsername: '', orderNotificationAlerts: false },
        webhookUrl: '',
      });

      expect(res).toEqual({ error: 'Insufficient permissions' });
    });

    it('updates channel settings successfully for tenant owner', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-owner' } },
      });
      (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        tenantId: 'tenant-123',
        role: 'owner',
      });

      const upsertMock = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'tenant_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { settings_data: {} },
                }),
              }),
            }),
            upsert: upsertMock,
          };
        }
        return {};
      });

      const payload: ChannelSettings = {
        whatsapp: { connected: true, phoneNumber: '0241112233', enableFloatingStorefrontWidget: true, widgetGreeting: 'Hi', connectionType: 'direct_link' },
        instagram: { connected: false, handle: '@my_store', syncDirectMessages: false, syncStoryMentions: false },
        messenger: { connected: false, pageId: '987654', syncMessages: false },
        telegram: { connected: false, botUsername: '@store_bot', orderNotificationAlerts: true },
        webhookUrl: 'https://api.merchander.com/api/webhooks/whatsapp',
      };

      const res = await updateChannelSettings(payload);
      expect(res).toEqual({ success: true });
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 'tenant-123',
          settings_data: expect.objectContaining({
            channel_settings: payload,
          }),
        }),
        { onConflict: 'tenant_id' }
      );
    });
  });
});
