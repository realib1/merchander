'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import { BusinessHoursSettings, NotificationSettings } from '@/types/settings';

const DEFAULT_HOURS: BusinessHoursSettings = {
  timezone: 'GMT (Greenwich Mean Time)',
  days: [
    { id: 'mon', name: 'Monday', isOpen: true, openTime: '08:00 AM', closeTime: '06:00 PM' },
    { id: 'tue', name: 'Tuesday', isOpen: true, openTime: '08:00 AM', closeTime: '06:00 PM' },
    { id: 'wed', name: 'Wednesday', isOpen: true, openTime: '08:00 AM', closeTime: '06:00 PM' },
    { id: 'thu', name: 'Thursday', isOpen: true, openTime: '08:00 AM', closeTime: '06:00 PM' },
    { id: 'fri', name: 'Friday', isOpen: true, openTime: '08:00 AM', closeTime: '06:00 PM' },
    { id: 'sat', name: 'Saturday', isOpen: true, openTime: '09:00 AM', closeTime: '04:00 PM' },
    { id: 'sun', name: 'Sunday', isOpen: false, openTime: '10:00 AM', closeTime: '02:00 PM' },
  ],
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emailNewOrder: true,
  emailPaymentReceived: true,
  emailLowInventory: true,
  inAppOrderAlerts: true,
  channelOrderAlerts: true,
};

export async function getBusinessHours(): Promise<BusinessHoursSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_HOURS;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data } = await supabase.from('tenant_settings').select('settings_data').eq('tenant_id', tenantId).single();
    const custom = (data?.settings_data as Record<string, unknown> | null)?.business_hours;
    if (custom && typeof custom === 'object') {
      return custom as unknown as BusinessHoursSettings;
    }
  } catch (err) {
    console.error('Error fetching business hours:', err);
  }
  return DEFAULT_HOURS;
}

export async function updateBusinessHours(payload: BusinessHoursSettings) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') {
      return { error: 'Insufficient permissions' };
    }

    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .single();
    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const updatedData = { ...currentData, business_hours: payload };

    const { error } = await supabase
      .from('tenant_settings')
      .update({ settings_data: updatedData })
      .eq('tenant_id', tenantId);

    if (error) throw error;

    revalidatePath('/dashboard/settings/hours');
    revalidatePath('/dashboard/settings/business-hours');
    return { success: true };
  } catch (err) {
    console.error('Error saving business hours:', err);
    return { error: 'Failed to update business hours' };
  }
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_NOTIFICATIONS;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data } = await supabase.from('tenant_settings').select('settings_data').eq('tenant_id', tenantId).single();
    const custom = (data?.settings_data as Record<string, unknown> | null)?.notifications;
    if (custom && typeof custom === 'object') {
      return custom as unknown as NotificationSettings;
    }
  } catch (err) {
    console.error('Error fetching notification settings:', err);
  }
  return DEFAULT_NOTIFICATIONS;
}

export async function updateNotificationSettings(payload: NotificationSettings) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') {
      return { error: 'Insufficient permissions' };
    }

    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .single();
    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const updatedData = { ...currentData, notifications: payload };

    const { error } = await supabase
      .from('tenant_settings')
      .update({ settings_data: updatedData })
      .eq('tenant_id', tenantId);

    if (error) throw error;

    revalidatePath('/dashboard/settings/notifications');
    return { success: true };
  } catch (err) {
    console.error('Error saving notification settings:', err);
    return { error: 'Failed to update notification settings' };
  }
}
