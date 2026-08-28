'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getTenantRoles() {
  const supabase = await createClient();

  // tenant_roles table has RLS policy enforcing isolation
  const { data, error } = await supabase
    .from('tenant_roles')
    .select(
      `
      *,
      tenant_users(count)
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    // If the foreign join has an issue, fallback to normal select
    const fallback = await supabase.from('tenant_roles').select('*').order('created_at', { ascending: false });
    return { data: fallback.data, error: fallback.error ? fallback.error.message : null };
  }

  return { data, error: null };
}

export async function createTenantRole(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  // Parse permissions from form data (it will be submitted as an array of checked strings)
  const permissions = formData.getAll('permissions') as string[];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Verify owner
  const { data: currentUserRecord } = await supabase
    .from('tenant_users')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .single();

  if (!currentUserRecord || (currentUserRecord.role !== 'owner' && currentUserRecord.role !== 'admin')) {
    return { error: 'Only owners and admins can manage roles' };
  }

  const { error } = await supabase.from('tenant_roles').insert([
    {
      tenant_id: currentUserRecord.tenant_id,
      name,
      description,
      permissions,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/settings/permissions');
  revalidatePath('/dashboard/staff');
  return { success: true };
}

export async function updateTenantRole(roleId: string, formData: FormData) {
  if (!roleId) return { error: 'Role ID is required' };
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const permissions = formData.getAll('permissions') as string[];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Verify owner or admin
  const { data: currentUserRecord } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!currentUserRecord || (currentUserRecord.role !== 'owner' && currentUserRecord.role !== 'admin')) {
    return { error: 'Only owners and admins can manage roles' };
  }

  const { error } = await supabase
    .from('tenant_roles')
    .update({
      name,
      description,
      permissions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', roleId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/settings/permissions');
  revalidatePath('/dashboard/staff');
  return { success: true };
}

export async function deleteTenantRole(roleId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Verify owner
  const { data: currentUserRecord } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!currentUserRecord || (currentUserRecord.role !== 'owner' && currentUserRecord.role !== 'admin')) {
    return { error: 'Only owners and admins can manage roles' };
  }

  const { error } = await supabase.from('tenant_roles').delete().eq('id', roleId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/settings/permissions');
  revalidatePath('/dashboard/staff');
  return { success: true };
}
