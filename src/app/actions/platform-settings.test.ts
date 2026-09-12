
import {
  getPlatformSettingsAction,
  updatePlatformSettingsAction,
  testSlackWebhookAction,
} from './platform-settings';
import { DEFAULT_PLATFORM_SETTINGS } from '@/types/platform';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('./platform', () => ({
  verifyPlatformStaff: vi.fn(),
}));

vi.mock('./platform-audit', () => ({
  logPlatformAuditAction: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/alerts/slack', () => ({
  sendPlatformSlackAlert: vi.fn().mockResolvedValue({ success: true }),
  sendSlackWebhook: vi.fn().mockResolvedValue({ success: true }),
}));

import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPlatformStaff } from './platform';
import { logPlatformAuditAction } from './platform-audit';
import { sendPlatformSlackAlert, sendSlackWebhook } from '@/lib/alerts/slack';

describe('src/app/actions/platform-settings.ts', () => {
  let mockSupabase: {
    from: ReturnType<typeof vi.fn>;
  };
  let mockUpsert: ReturnType<typeof vi.fn>;
  let mockMaybeSingle: ReturnType<typeof vi.fn>;
  let mockSingle: ReturnType<typeof vi.fn>;

  const defaultRow = {
    id: 1,
    platform_name: 'Merchander',
    support_email: 'support@merchander.com',
    default_currency: 'GHS',
    maintenance_mode: false,
    disable_new_signups: false,
    integrations: {
      slack_webhook_url: 'https://hooks.slack.com/services/test/valid',
    },
    updated_at: '2026-09-11T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (verifyPlatformStaff as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'staff-user-1',
      role: 'platform_owner',
      is_active: true,
    });

    mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { ...defaultRow },
      error: null,
    });

    mockSingle = vi.fn().mockResolvedValue({
      data: { ...defaultRow },
      error: null,
    });

    mockUpsert = vi.fn().mockImplementation((payload: unknown) => {
      const promise = Promise.resolve({ error: null, data: payload });
      return Object.assign(promise, {
        select: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
      });
    });

    mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: mockMaybeSingle,
            single: mockSingle,
          }),
        }),
        upsert: mockUpsert,
      }),
    };
    (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
  });

  describe('getPlatformSettingsAction', () => {
    it('returns settings when caller is platform staff', async () => {
      const res = await getPlatformSettingsAction();
      expect(res.error).toBeNull();
      expect(res.data?.platform_name).toBe('Merchander');
      expect(verifyPlatformStaff).toHaveBeenCalled();
    });

    it('returns error if caller is not authorized', async () => {
      (verifyPlatformStaff as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Unauthorized')
      );

      const res = await getPlatformSettingsAction();
      expect(res.data).toBeNull();
      expect(res.error).toBe('Unauthorized');
    });

    it('auto-seeds default row when platform_settings row id=1 is missing', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockSingle.mockResolvedValueOnce({
        data: { ...defaultRow, id: 1 },
        error: null,
      });

      const res = await getPlatformSettingsAction();
      expect(res.error).toBeNull();
      expect(res.data?.id).toBe(1);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          platform_name: DEFAULT_PLATFORM_SETTINGS.platform_name,
        })
      );
    });

    it('falls back gracefully to DEFAULT_PLATFORM_SETTINGS if auto-seed fails', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'DB connection error' } });
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Table does not exist' } });

      const res = await getPlatformSettingsAction();
      expect(res.error).toBeNull();
      expect(res.data).toEqual(DEFAULT_PLATFORM_SETTINGS);
    });
  });

  describe('updatePlatformSettingsAction', () => {
    it('updates settings and triggers Slack alert when maintenance mode is changed', async () => {
      const res = await updatePlatformSettingsAction({
        maintenance_mode: true,
      });

      expect(res.success).toBe(true);
      expect(res.error).toBeNull();
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          maintenance_mode: true,
        })
      );
      expect(sendPlatformSlackAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Maintenance Mode Activated'),
          level: 'warning',
        })
      );
      expect(logPlatformAuditAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update_platform_settings',
        })
      );
    });

    it('merges integrations jsonb without wiping existing keys', async () => {
      const res = await updatePlatformSettingsAction({
        integrations: {
          openai_api_key: 'sk-new-key',
        },
      });

      expect(res.success).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          integrations: {
            slack_webhook_url: 'https://hooks.slack.com/services/test/valid',
            openai_api_key: 'sk-new-key',
          },
        })
      );
    });
  });

  describe('testSlackWebhookAction', () => {
    it('rejects invalid or non-https webhook URL', async () => {
      const res = await testSlackWebhookAction('http://insecure-url.com');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Invalid Slack webhook URL');
    });

    it('calls sendSlackWebhook with the provided URL', async () => {
      const res = await testSlackWebhookAction(
        'https://hooks.slack.com/services/custom/hook'
      );

      expect(res.success).toBe(true);
      expect(res.error).toBeNull();
      expect(sendSlackWebhook).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/custom/hook',
        expect.objectContaining({
          title: expect.stringContaining('Test Platform Alert'),
        })
      );
    });

    it('falls back to saved platform setting if URL is not provided', async () => {
      const res = await testSlackWebhookAction();

      expect(res.success).toBe(true);
      expect(sendSlackWebhook).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/test/valid',
        expect.anything()
      );
    });

    it('returns error if sendSlackWebhook fails', async () => {
      (sendSlackWebhook as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: 'Slack returned HTTP 404',
      });

      const res = await testSlackWebhookAction(
        'https://hooks.slack.com/services/test/valid'
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Slack returned HTTP 404');
    });
  });
});
