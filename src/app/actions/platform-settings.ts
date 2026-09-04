'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { verifyPlatformStaff } from './platform';
import { PLATFORM_RBAC_RULES } from '@/lib/auth/platform-staff';
import { PlatformSettings } from '@/types/platform';
import { logPlatformAuditAction } from './platform-audit';
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
