'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function getStaffMembers() {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const { data: tenantUsers, error: tuError } = await supabase.from('tenant_users').select(`
      id, 
      user_id, 
      role, 
      created_at,
      role_id,
      tenant_roles(name)
    `);

  if (tuError) {
    console.error('Error fetching tenant users:', tuError);
    return { data: null, error: tuError.message };
  }

  // Fetch user details from Supabase Auth admin
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

  if (authError) {
    console.error('Error fetching auth users:', authError);
    return { data: null, error: authError.message };
  }

  const staff = tenantUsers.map((tu) => {
    const authUser = authData.users.find((u) => u.id === tu.user_id);
    const meta = authUser?.user_metadata || {};

    // Construct name from first/last if full_name is missing
    let displayName = meta.full_name;
    if (!displayName && (meta.first_name || meta.last_name)) {
      displayName = `${meta.first_name || ''} ${meta.last_name || ''}`.trim();
    }

    // Resolve role name
    let roleDisplay = tu.role;
    if (tu.role_id && tu.tenant_roles) {
      // @ts-expect-error - Supabase types might not have resolved the join automatically
      roleDisplay = tu.tenant_roles.name;
    }

    return {
      id: tu.id, // tenant_user.id
      user_id: tu.user_id,
      email: authUser?.email || 'Unknown Email',
      full_name: displayName || 'Team Member',
      role: roleDisplay,
      role_id: tu.role_id,
      created_at: tu.created_at,
      last_sign_in_at: authUser?.last_sign_in_at || null,
    };
  });

  return { data: staff, error: null };
}

export async function inviteStaffMember(formData: FormData) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const email = formData.get('email') as string;
  const role = formData.get('role') as string;
  const full_name = (formData.get('full_name') as string) || 'Team Member';

  // 1. Get current user's tenant
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: currentUserRecord } = await supabase
    .from('tenant_users')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .single();

  if (!currentUserRecord || currentUserRecord.role !== 'owner') {
    return { error: 'Only owners can invite staff' };
  }

  // 2. Invite user via Supabase Auth Admin
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { full_name },
  });

  if (inviteError) {
    return { error: inviteError.message };
  }

  const newUserId = inviteData.user.id;

  // 3. Link them to the tenant
  const { error: linkError } = await supabaseAdmin.from('tenant_users').insert([
    {
      tenant_id: currentUserRecord.tenant_id,
      user_id: newUserId,
      role: role,
    },
  ]);

  if (linkError) {
    // If linking fails, we probably shouldn't leave the invited user floating, but for now just return error
    return { error: linkError.message };
  }

  revalidatePath('/dashboard/staff');
  return { success: true };
}

export async function removeStaffMember(tenantUserId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: currentUserRecord } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!currentUserRecord || currentUserRecord.role !== 'owner') {
    return { error: 'Only owners can remove staff' };
  }

  // Get the auth.users ID to delete from auth if necessary, or just remove from tenant_users
  const { data: targetRecord } = await supabase.from('tenant_users').select('user_id').eq('id', tenantUserId).single();

  if (!targetRecord) return { error: 'Staff member not found' };

  // Delete from tenant_users
  const { error } = await supabase.from('tenant_users').delete().eq('id', tenantUserId);

  if (error) return { error: error.message };

  // Optionally delete from auth.users (Be careful: they might belong to other tenants)
  // For this simple slice, removing from tenant is usually enough.

  revalidatePath('/dashboard/staff');
  return { success: true };
}
export async function updateStaffMember(
  tenantUserId: string,
  data: { role?: string; role_id?: string | null; full_name?: string }
) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Only owners can update staff roles/details
  const { data: currentUserRecord } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!currentUserRecord || currentUserRecord.role !== 'owner') {
    return { error: 'Only owners can update staff members' };
  }

  const { data: targetRecord } = await supabase.from('tenant_users').select('user_id').eq('id', tenantUserId).single();

  if (!targetRecord) return { error: 'Staff member not found' };

  // Update tenant_users (role and role_id)
  if (data.role !== undefined || data.role_id !== undefined) {
    const updatePayload: Record<string, string | null> = {};
    if (data.role !== undefined) updatePayload.role = data.role;
    if (data.role_id !== undefined) updatePayload.role_id = data.role_id;

    const { error: tuError } = await supabaseAdmin.from('tenant_users').update(updatePayload).eq('id', tenantUserId);

    if (tuError) return { error: tuError.message };
  }

  // Update auth.users (full_name) via Admin API
  if (data.full_name) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(targetRecord.user_id, {
      user_metadata: { full_name: data.full_name },
    });

    if (authError) return { error: authError.message };
  }

  revalidatePath('/dashboard/staff');
  return { success: true };
}
export async function sendPasswordReset(tenantUserId: string) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Verify permission
  const { data: currentUserRecord } = await supabase
    .from('tenant_users')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!currentUserRecord || currentUserRecord.role !== 'owner') {
    return { error: 'Only owners can send password resets' };
  }

  // Get staff member's auth.users ID
  const { data: targetRecord } = await supabase.from('tenant_users').select('user_id').eq('id', tenantUserId).single();

  if (!targetRecord) return { error: 'Staff member not found' };

  // Get their email from admin listUsers (since we don't store email in tenant_users)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) return { error: authError.message };

  const targetAuthUser = authData.users.find((u) => u.id === targetRecord.user_id);
  if (!targetAuthUser || !targetAuthUser.email) return { error: 'Staff member email not found' };

  // Generate recovery link (Supabase will email it automatically if generateLink is not used, but using generateLink gives us the link directly, OR we can just use resetPasswordForEmail)
  const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(targetAuthUser.email);

  if (resetError) return { error: resetError.message };

  return { success: true };
}
