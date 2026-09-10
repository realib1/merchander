import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAutomationSettings, updateAutomationSettings } from './settings-social';

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
});
