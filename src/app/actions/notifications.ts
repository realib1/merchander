'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getUnreadNotifications() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Unauthorized' };
  }

  // Get tenant ID
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantUser?.tenant_id) {
    return { data: null, error: 'Tenant not found' };
  }

  const { data, error } = await supabase
    .from('tenant_notifications')
    .select('*')
    .eq('tenant_id', tenantUser.tenant_id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(10);

  return { data, error: error?.message };
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('tenant_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath('/');
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantUser?.tenant_id) {
    return { success: false, error: 'Tenant not found' };
  }

  const { error } = await supabase
    .from('tenant_notifications')
    .update({ is_read: true })
    .eq('tenant_id', tenantUser.tenant_id)
    .eq('is_read', false);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}
