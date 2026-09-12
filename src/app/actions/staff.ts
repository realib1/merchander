'use server';

import { z } from 'zod';
import { getURL } from '@/utils/url';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const tenantUserIdSchema = z.string().uuid('Invalid staff member reference');

const inviteStaffSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  role: z.enum(['owner', 'admin', 'member'], { errorMap: () => ({ message: 'Invalid role' }) }),
  full_name: z.string().trim().min(1).max(120).optional(),
});

const updateStaffSchema = z.object({
  tenantUserId: tenantUserIdSchema,
  role: z.enum(['owner', 'admin', 'member'], { errorMap: () => ({ message: 'Invalid role' }) }).optional(),
  role_id: z.string().uuid('Invalid role reference').nullable().optional(),
  full_name: z.string().trim().min(1).max(120).optional(),
});

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

  // Resolve each staff member's auth record with a targeted lookup by id.
  // A bare listUsers() only returns the first page (50 users) platform-wide,
  // so anyone past page 1 would render with placeholder name/email.
  const staff = await Promise.all(
    (tenantUsers || []).map(async (tu) => {
      const { data: authLookup } = await supabaseAdmin.auth.admin.getUserById(tu.user_id);
      const authUser = authLookup?.user ?? null;
      const meta = authUser?.user_metadata || {};

      // Construct name from first/last if full_name is missing
      let displayName = meta.full_name || meta.name;
      if (!displayName && (meta.first_name || meta.last_name)) {
        displayName = `${meta.first_name || ''} ${meta.last_name || ''}`.trim();
      }
      if (!displayName && authUser?.email) {
        const emailUser = authUser.email.split('@')[0] || '';
        displayName = emailUser
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .trim();
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
    })
  );

  return { data: staff, error: null };
}

export async function inviteStaffMember(formData: FormData) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const validation = inviteStaffSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
    full_name: (formData.get('full_name') as string) || undefined,
  });

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const { email, role } = validation.data;
  const rawFullName = validation.data.full_name?.trim();
  const emailPrefix = email.split('@')[0]?.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
  const full_name = rawFullName || emailPrefix || 'Team Member';

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
  const appUrl = getURL();
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { full_name, name: full_name },
    redirectTo: `${appUrl}/auth/callback?next=/dashboard`,
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

  const idCheck = tenantUserIdSchema.safeParse(tenantUserId);
  if (!idCheck.success) return { error: idCheck.error.errors[0].message };

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
    return { error: 'Only owners can remove staff' };
  }

  // Get the target row and confirm it belongs to the caller's tenant before deleting.
  const { data: targetRecord } = await supabase
    .from('tenant_users')
    .select('user_id, tenant_id')
    .eq('id', idCheck.data)
    .single();

  if (!targetRecord || targetRecord.tenant_id !== currentUserRecord.tenant_id) {
    return { error: 'Staff member not found' };
  }

  // Delete from tenant_users
  const { error } = await supabase.from('tenant_users').delete().eq('id', idCheck.data);

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

  const validation = updateStaffSchema.safeParse({ tenantUserId, ...data });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }
  const parsed = validation.data;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Only owners can update staff roles/details
  const { data: currentUserRecord } = await supabase
    .from('tenant_users')
    .select('role, tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!currentUserRecord || currentUserRecord.role !== 'owner') {
    return { error: 'Only owners can update staff members' };
  }

  const { data: targetRecord } = await supabase
    .from('tenant_users')
    .select('user_id, tenant_id')
    .eq('id', parsed.tenantUserId)
    .single();

  if (!targetRecord || targetRecord.tenant_id !== currentUserRecord.tenant_id) {
    return { error: 'Staff member not found' };
  }

  // Update tenant_users (role and role_id)
  if (parsed.role !== undefined || parsed.role_id !== undefined) {
    const updatePayload: Record<string, string | null> = {};
    if (parsed.role !== undefined) updatePayload.role = parsed.role;
    if (parsed.role_id !== undefined) updatePayload.role_id = parsed.role_id;

    // Service-role client bypasses RLS, so scope the write by tenant in app code,
    // not just by the client-supplied row id.
    const { error: tuError } = await supabaseAdmin
      .from('tenant_users')
      .update(updatePayload)
      .eq('id', parsed.tenantUserId)
      .eq('tenant_id', currentUserRecord.tenant_id);

    if (tuError) return { error: tuError.message };
  }

  // Update auth.users (full_name) via Admin API
  if (parsed.full_name) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(targetRecord.user_id, {
      user_metadata: { full_name: parsed.full_name },
    });

    if (authError) return { error: authError.message };
  }

  revalidatePath('/dashboard/staff');
  return { success: true };
}
export async function sendPasswordReset(tenantUserId: string) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const idCheck = tenantUserIdSchema.safeParse(tenantUserId);
  if (!idCheck.success) return { error: idCheck.error.errors[0].message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Verify permission
  const { data: currentUserRecord } = await supabase
    .from('tenant_users')
    .select('role, tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!currentUserRecord || currentUserRecord.role !== 'owner') {
    return { error: 'Only owners can send password resets' };
  }

  // Get staff member's auth.users ID and confirm same-tenant
  const { data: targetRecord } = await supabase
    .from('tenant_users')
    .select('user_id, tenant_id')
    .eq('id', idCheck.data)
    .single();

  if (!targetRecord || targetRecord.tenant_id !== currentUserRecord.tenant_id) {
    return { error: 'Staff member not found' };
  }

  // Look up the email with a targeted call by id (tenant_users does not store it).
  const { data: authLookup, error: authError } = await supabaseAdmin.auth.admin.getUserById(targetRecord.user_id);
  if (authError) return { error: authError.message };

  const targetEmail = authLookup?.user?.email;
  if (!targetEmail) return { error: 'Staff member email not found' };

  const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(targetEmail);

  if (resetError) return { error: resetError.message };

  return { success: true };
}
