
import { sendSlackWebhook, sendPlatformSlackAlert } from './slack';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from '@/lib/supabase/admin';

describe('src/lib/alerts/slack.ts', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.SLACK_WEBHOOK_URL;

  let mockAdminClient: {
    from: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SLACK_WEBHOOK_URL;

    mockAdminClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }),
    };
    (createAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalEnv !== undefined) {
      process.env.SLACK_WEBHOOK_URL = originalEnv;
    } else {
      delete process.env.SLACK_WEBHOOK_URL;
    }
  });

  describe('sendSlackWebhook', () => {
    it('returns error if webhookUrl is empty', async () => {
      const res = await sendSlackWebhook('', {
        title: 'Test',
        message: 'Hello',
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain('Webhook URL is required');
    });

    it('successfully sends message to Slack and formats attachments', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('ok'),
      });
      global.fetch = mockFetch;

      const res = await sendSlackWebhook('https://hooks.slack.com/services/test', {
        title: 'Alert Title',
        message: 'Alert message body',
        level: 'warning',
        metadata: {
          store: 'Glamour Haven',
          amount: 150,
        },
      });

      expect(res.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://hooks.slack.com/services/test');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body.attachments[0].title).toBe('Alert Title');
      expect(body.attachments[0].color).toBe('#F59E0B'); // Warning color
      expect(body.attachments[0].fields).toEqual([
        { title: 'store', value: 'Glamour Haven', short: true },
        { title: 'amount', value: '150', short: true },
      ]);
    });

    it('handles Slack API error responses gracefully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: vi.fn().mockResolvedValue('channel_not_found'),
      });
      global.fetch = mockFetch;

      const res = await sendSlackWebhook('https://hooks.slack.com/services/invalid', {
        title: 'Test',
        message: 'Failure',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Slack returned HTTP 404');
    });

    it('handles network throw gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection timed out'));

      const res = await sendSlackWebhook('https://hooks.slack.com/services/timeout', {
        title: 'Test',
        message: 'Timeout',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Connection timed out');
    });
  });

  describe('sendPlatformSlackAlert', () => {
    it('returns error when no webhook URL is configured anywhere', async () => {
      const res = await sendPlatformSlackAlert({
        title: 'Test',
        message: 'No URL',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('No Slack webhook URL configured');
    });

    it('uses webhook URL from platform_settings when available', async () => {
      mockAdminClient.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                integrations: {
                  slack_webhook_url: 'https://hooks.slack.com/services/db-configured',
                },
              },
              error: null,
            }),
          }),
        }),
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('ok'),
      });
      global.fetch = mockFetch;

      const res = await sendPlatformSlackAlert({
        title: 'DB Setting Alert',
        message: 'Sent via DB URL',
      });

      expect(res.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/db-configured',
        expect.anything()
      );
    });

    it('falls back to environment variable SLACK_WEBHOOK_URL when DB setting is unset', async () => {
      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/env-configured';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('ok'),
      });
      global.fetch = mockFetch;

      const res = await sendPlatformSlackAlert({
        title: 'Env Alert',
        message: 'Sent via ENV URL',
      });

      expect(res.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/env-configured',
        expect.anything()
      );
    });
  });
});
