
import { getPrivacySettings, updatePrivacySettings } from './settings-data';
import { getNotificationSettings, updateNotificationSettings } from './settings-business';
import { PrivacySettings, NotificationSettings } from '@/types/settings';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/supabase/queries', () => ({
  getTenantInfo: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';

describe('Settings Preferences: Privacy and Notifications', () => {
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

    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  describe('Privacy Settings', () => {
    it('returns default privacy settings when user is unauthenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const settings = await getPrivacySettings();
      expect(settings).toEqual({
        showCookieBanner: false,
        marketingConsentCheckbox: true,
        deleteAbandonedAfterDays: 90,
      });
    });

    it('returns custom privacy settings from tenant settings data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      vi.mocked(getTenantInfo).mockResolvedValue({
        tenantId: 'tenant-abc',
        role: 'owner',
      } as unknown as Awaited<ReturnType<typeof getTenantInfo>>);

      const customPrivacy: PrivacySettings = {
        showCookieBanner: true,
        marketingConsentCheckbox: false,
        deleteAbandonedAfterDays: 30,
      };

      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { settings_data: { privacy_settings: customPrivacy } },
          }),
        }),
      });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const settings = await getPrivacySettings();
      expect(settings).toEqual(customPrivacy);
    });

    it('rejects updatePrivacySettings when user is unauthenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await updatePrivacySettings({
        showCookieBanner: true,
        marketingConsentCheckbox: true,
        deleteAbandonedAfterDays: 60,
      });

      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('rejects updatePrivacySettings when user does not have owner/admin role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'staff-123' } },
      });
      vi.mocked(getTenantInfo).mockResolvedValue({
        tenantId: 'tenant-abc',
        role: 'member',
      } as unknown as Awaited<ReturnType<typeof getTenantInfo>>);

      const result = await updatePrivacySettings({
        showCookieBanner: true,
        marketingConsentCheckbox: true,
        deleteAbandonedAfterDays: 60,
      });

      expect(result).toEqual({ error: 'Insufficient permissions' });
    });

    it('updates privacy settings successfully for owner', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'owner-123' } },
      });
      vi.mocked(getTenantInfo).mockResolvedValue({
        tenantId: 'tenant-abc',
        role: 'owner',
      } as unknown as Awaited<ReturnType<typeof getTenantInfo>>);

      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { settings_data: { other_pref: true } },
          }),
        }),
      });
      const upsertMock = vi.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'tenant_settings') {
          return {
            select: selectMock,
            upsert: upsertMock,
          };
        }
        return {};
      });

      const payload: PrivacySettings = {
        showCookieBanner: true,
        marketingConsentCheckbox: false,
        deleteAbandonedAfterDays: 180,
      };

      const result = await updatePrivacySettings(payload);
      expect(result).toEqual({ success: true });
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 'tenant-abc',
          settings_data: {
            other_pref: true,
            privacy_settings: payload,
          },
        }),
        { onConflict: 'tenant_id' }
      );
    });
  });

  describe('Notification Settings', () => {
    it('returns default notification settings when user is unauthenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const settings = await getNotificationSettings();
      expect(settings).toEqual({
        emailNewOrder: true,
        emailPaymentReceived: true,
        emailLowInventory: true,
        inAppOrderAlerts: true,
        channelOrderAlerts: true,
      });
    });

    it('returns saved custom notification settings for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      vi.mocked(getTenantInfo).mockResolvedValue({
        tenantId: 'tenant-abc',
        role: 'owner',
      } as unknown as Awaited<ReturnType<typeof getTenantInfo>>);

      const customNotifications: NotificationSettings = {
        emailNewOrder: false,
        emailPaymentReceived: false,
        emailLowInventory: false,
        inAppOrderAlerts: true,
        channelOrderAlerts: false,
      };

      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { settings_data: { notifications: customNotifications } },
          }),
        }),
      });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const settings = await getNotificationSettings();
      expect(settings).toEqual(customNotifications);
    });

    it('rejects updateNotificationSettings for non-privileged role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      vi.mocked(getTenantInfo).mockResolvedValue({
        tenantId: 'tenant-abc',
        role: 'viewer',
      } as unknown as Awaited<ReturnType<typeof getTenantInfo>>);

      const result = await updateNotificationSettings({
        emailNewOrder: false,
        emailPaymentReceived: false,
        emailLowInventory: false,
        inAppOrderAlerts: false,
        channelOrderAlerts: false,
      });

      expect(result).toEqual({ error: 'Insufficient permissions' });
    });

    it('updates notification settings successfully for admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123' } },
      });
      vi.mocked(getTenantInfo).mockResolvedValue({
        tenantId: 'tenant-abc',
        role: 'admin',
      } as unknown as Awaited<ReturnType<typeof getTenantInfo>>);

      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { settings_data: { existing: 123 } },
          }),
        }),
      });
      const upsertMock = vi.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'tenant_settings') {
          return {
            select: selectMock,
            upsert: upsertMock,
          };
        }
        return {};
      });

      const payload: NotificationSettings = {
        emailNewOrder: true,
        emailPaymentReceived: false,
        emailLowInventory: true,
        inAppOrderAlerts: true,
        channelOrderAlerts: true,
      };

      const result = await updateNotificationSettings(payload);
      expect(result).toEqual({ success: true });
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 'tenant-abc',
          settings_data: {
            existing: 123,
            notifications: payload,
          },
        }),
        { onConflict: 'tenant_id' }
      );
    });
  });
});
