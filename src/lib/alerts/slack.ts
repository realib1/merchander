import { createAdminClient } from '@/lib/supabase/admin';

export interface SlackAlertOptions {
  title: string;
  message: string;
  level?: 'info' | 'warning' | 'error' | 'success';
  metadata?: Record<string, unknown>;
}

export interface SlackAlertResult {
  success: boolean;
  error?: string;
}

const LEVEL_COLORS: Record<NonNullable<SlackAlertOptions['level']>, string> = {
  info: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

export async function sendSlackWebhook(
  webhookUrl: string,
  options: SlackAlertOptions
): Promise<SlackAlertResult> {
  const url = webhookUrl?.trim();
  if (!url) {
    return { success: false, error: 'Webhook URL is required.' };
  }

  const level = options.level || 'info';
  const color = LEVEL_COLORS[level];

  const fields = options.metadata
    ? Object.entries(options.metadata).map(([key, value]) => ({
        title: key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        short: true,
      }))
    : [];

  const payload = {
    text: `${options.title}: ${options.message}`,
    attachments: [
      {
        color,
        title: options.title,
        text: options.message,
        fields,
        footer: 'Merchander Platform Alerts',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        success: false,
        error: `Slack returned HTTP ${res.status}: ${text || res.statusText}`,
      };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown network error';
    return { success: false, error: message };
  }
}

export async function sendPlatformSlackAlert(options: SlackAlertOptions): Promise<SlackAlertResult> {
  try {
    let webhookUrl: string | undefined;

    // Try loading webhook URL from platform_settings first
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from('platform_settings')
        .select('integrations')
        .eq('id', 1)
        .maybeSingle();

      const integrations = data?.integrations as Record<string, string> | undefined;
      webhookUrl = integrations?.slack_webhook_url;
    } catch {
      // Fall through to environment variable if DB lookup fails
    }

    if (!webhookUrl) {
      webhookUrl = process.env.SLACK_WEBHOOK_URL;
    }

    if (!webhookUrl) {
      return { success: false, error: 'No Slack webhook URL configured.' };
    }

    return await sendSlackWebhook(webhookUrl, options);
  } catch (err) {
    console.error('sendPlatformSlackAlert error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send platform alert',
    };
  }
}
