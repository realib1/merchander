'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { verifyPlatformStaff } from './platform';
import { PLATFORM_RBAC_RULES } from '@/lib/auth/platform-staff';
import { PlatformSettings } from '@/types/platform';
import { logPlatformAuditAction } from './platform-audit';
import { sendPlatformSlackAlert, sendSlackWebhook } from '@/lib/alerts/slack';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  platform_name: z.string().min(1).optional(),
  support_email: z.string().email().optional().or(z.literal('')),
  default_currency: z.string().length(3).optional(),
  maintenance_mode: z.boolean().optional(),
  disable_new_signups: z.boolean().optional(),
  integrations: z.record(z.any()).optional(),
});

export async function getPlatformSettingsAction(): Promise<{ data: PlatformSettings | null; error: string | null }> {
  try {
    await verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/settings']);
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('platform_settings').select('*').eq('id', 1).single();

    if (error) {
      console.error('getPlatformSettings error:', error);
      return { data: null, error: 'Failed to load platform settings.' };
    }

    return { data: data as PlatformSettings, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return { data: null, error: message };
  }
}

export async function updatePlatformSettingsAction(
  updates: z.infer<typeof updateSettingsSchema>
): Promise<{ success: boolean; error: string | null }> {
  try {
    await verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/settings']);
    
    const parsed = updateSettingsSchema.parse(updates);
    
    const supabase = createAdminClient();
    
    const finalUpdates: Record<string, unknown> = { ...parsed };
    
    if (parsed.integrations) {
      const { data: current } = await supabase.from('platform_settings').select('integrations').eq('id', 1).single();
      finalUpdates.integrations = {
        ...(current?.integrations || {}),
        ...parsed.integrations
      };
    }
    
    finalUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('platform_settings')
      .update(finalUpdates)
      .eq('id', 1);

    if (error) {
      console.error('updatePlatformSettingsAction error:', error);
      return { success: false, error: 'Failed to update settings.' };
    }

    // Trigger platform alert on maintenance mode toggle (non-blocking)
    if (parsed.maintenance_mode !== undefined) {
      const isMaint = parsed.maintenance_mode;
      sendPlatformSlackAlert({
        title: isMaint ? '⚠️ Platform Maintenance Mode Activated' : '✅ Platform Maintenance Mode Deactivated',
        message: isMaint
          ? 'Platform maintenance mode has been enabled. Non-staff traffic is being redirected to /maintenance.'
          : 'Platform maintenance mode has been disabled. Normal operations resumed.',
        level: isMaint ? 'warning' : 'success',
        metadata: {
          timestamp: new Date().toISOString(),
        },
      }).catch((alertErr) => {
        console.warn('Failed to send maintenance Slack alert:', alertErr);
      });
    }

    await logPlatformAuditAction({
      action: 'update_platform_settings',
      target_type: 'system_config',
      target_id: '1',
      reason: 'Updated platform general settings',
      metadata: { changed_keys: Object.keys(finalUpdates) },
    });

    revalidatePath('/platform/settings');
    revalidatePath('/platform/settings/integrations');
    revalidatePath('/platform/settings/controls');
    
    return { success: true, error: null };
  } catch (error) {
    console.error('updatePlatformSettingsAction caught error:', error);
    const message = error instanceof Error ? error.message : 'Invalid request';
    return { success: false, error: message };
  }
}

export async function testSlackWebhookAction(
  webhookUrl?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    await verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/settings']);

    let targetUrl = webhookUrl?.trim();
    if (!targetUrl) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('platform_settings')
        .select('integrations')
        .eq('id', 1)
        .single();
      const integrations = data?.integrations as Record<string, string> | undefined;
      targetUrl = integrations?.slack_webhook_url || process.env.SLACK_WEBHOOK_URL;
    }

    if (!targetUrl) {
      return { success: false, error: 'No Slack webhook URL provided or configured.' };
    }

    if (!targetUrl.startsWith('https://hooks.slack.com/') && !targetUrl.startsWith('https://')) {
      return { success: false, error: 'Invalid Slack webhook URL. Must start with https://hooks.slack.com/' };
    }

    const result = await sendSlackWebhook(targetUrl, {
      title: '🔔 Test Platform Alert',
      message: 'This is a test notification confirming your Slack integration is connected and working properly.',
      level: 'success',
      metadata: {
        timestamp: new Date().toISOString(),
        test: true,
      },
    });

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to deliver message to Slack webhook.' };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('testSlackWebhookAction caught error:', error);
    const message = error instanceof Error ? error.message : 'Unauthorized or error testing webhook';
    return { success: false, error: message };
  }
}
