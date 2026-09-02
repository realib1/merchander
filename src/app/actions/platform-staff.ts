'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { PlatformRole, PlatformStaffUser } from '@/types/platform';
import { verifyPlatformStaff } from './platform';
import { logPlatformAuditAction } from './platform-audit';



/**
 * Fetch all platform staff users with their roles and activity state
 */
export async function getPlatformStaffListAction(): Promise<{
  staff: PlatformStaffUser[];
  error?: string;
}> {
  try {
    await verifyPlatformStaff();
    const adminSupabase = createAdminClient();

    const { data } = await adminSupabase
      .from('platform_staff_users')
      .select('*')
      .order('created_at', { ascending: false });

    const staffData = data || [];

    if (staffData.length === 0) {
      return { staff: [], error: 'No platform staff configured. Seed the platform_staff_users table via migration.' };
    }

    return { staff: staffData as PlatformStaffUser[] };
  } catch (err) {
    console.error('Error fetching platform staff list:', err);
    return { staff: [], error: err instanceof Error ? err.message : 'Failed to fetch staff' };
  }
}

/**
 * Add or link a new platform staff member
 */
export async function addPlatformStaffAction(params: {
  email: string;
  role: PlatformRole;
  reason?: string;
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user, role: callerRole } = await verifyPlatformStaff(['platform_owner', 'platform_admin']);
    const adminSupabase = createAdminClient();

    const normalizedEmail = params.email.trim().toLowerCase();

    // 1. Look up existing auth user by email
    const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers({ perPage: 100 });
    if (listError) {
      return { error: `Failed to search users: ${listError.message}` };
    }

    let targetUserId: string | null = null;
    const targetUser = usersData.users.find((u) => u.email?.toLowerCase() === normalizedEmail);

    if (targetUser) {
      targetUserId = targetUser.id;
    } else {
      // Create invited user
      const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
        user_metadata: { platform_role: params.role },
      });

      if (createError) {
        return { error: `Failed to register staff user: ${createError.message}` };
      }
      targetUserId = newUser.user.id;
    }

    // 2. Insert into platform_staff_users
    const { error: insertError } = await adminSupabase.from('platform_staff_users').upsert(
      {
        user_id: targetUserId,
        email: normalizedEmail,
        role: params.role,
        is_active: true,
        mfa_enabled: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (insertError) {
      return { error: insertError.message };
    }

    // 3. Immutable audit log
    await logPlatformAuditAction({
      action: 'ADD_PLATFORM_STAFF',
      target_type: 'staff_role',
      target_id: targetUserId,
      target_name: normalizedEmail,
      reason: params.reason || `Staff user ${normalizedEmail} assigned role ${params.role} by ${callerRole}`,
      metadata: { role: params.role, addedBy: user.email },
    });

    revalidatePath('/platform/security');
    revalidatePath('/platform/settings');
    return { success: true };
  } catch (err) {
    console.error('Error adding platform staff:', err);
    return { error: err instanceof Error ? err.message : 'Failed to add staff member' };
  }
}

/**
 * Update the platform role of a staff user
 */
export async function updatePlatformStaffRoleAction(
  staffId: string,
  newRole: PlatformRole,
  reason?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user, role: callerRole } = await verifyPlatformStaff(['platform_owner', 'platform_admin']);
    const adminSupabase = createAdminClient();

    if (newRole === 'platform_owner' && callerRole !== 'platform_owner') {
      return { error: 'Only Platform Owners can promote users to Platform Owner' };
    }

    const { data: staff, error: fetchErr } = await adminSupabase
      .from('platform_staff_users')
      .select('email, role')
      .eq('id', staffId)
      .single();

    if (fetchErr || !staff) {
      return { error: 'Staff member not found' };
    }

    const { error: updateErr } = await adminSupabase
      .from('platform_staff_users')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', staffId);

    if (updateErr) {
      return { error: updateErr.message };
    }

    await logPlatformAuditAction({
      action: 'UPDATE_STAFF_ROLE',
      target_type: 'staff_role',
      target_id: staffId,
      target_name: staff.email,
      reason: reason || `Role updated from ${staff.role} to ${newRole} by ${callerRole}`,
      metadata: { previousRole: staff.role, newRole, actorEmail: user.email },
    });

    revalidatePath('/platform/security');
    revalidatePath('/platform/settings');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update staff role' };
  }
}

/**
 * Toggle active / deactivated status of a staff user
 */
export async function togglePlatformStaffStatusAction(
  staffId: string,
  isActive: boolean,
  reason?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user, role: callerRole } = await verifyPlatformStaff(['platform_owner', 'platform_admin']);
    const adminSupabase = createAdminClient();

    const { data: staff } = await adminSupabase
      .from('platform_staff_users')
      .select('email, user_id')
      .eq('id', staffId)
      .single();

    if (staff && staff.user_id === user.id && !isActive) {
      return { error: 'You cannot deactivate your own platform staff account' };
    }

    const { error } = await adminSupabase
      .from('platform_staff_users')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', staffId);

    if (error) {
      return { error: error.message };
    }

    await logPlatformAuditAction({
      action: isActive ? 'REACTIVATE_STAFF_USER' : 'DEACTIVATE_STAFF_USER',
      target_type: 'staff_role',
      target_id: staffId,
      target_name: staff?.email || staffId,
      reason: reason || `Account set to ${isActive ? 'active' : 'deactivated'} by ${callerRole}`,
      metadata: { isActive, actorEmail: user.email },
    });

    revalidatePath('/platform/security');
    revalidatePath('/platform/settings');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update staff status' };
  }
}

/**
 * Remove a staff member completely from platform staff
 */
export async function removePlatformStaffAction(
  staffId: string,
  reason?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user } = await verifyPlatformStaff(['platform_owner']);
    const adminSupabase = createAdminClient();

    const { data: staff } = await adminSupabase
      .from('platform_staff_users')
      .select('email, user_id')
      .eq('id', staffId)
      .single();

    if (staff && staff.user_id === user.id) {
      return { error: 'You cannot remove your own platform owner account' };
    }

    const { error } = await adminSupabase
      .from('platform_staff_users')
      .delete()
      .eq('id', staffId);

    if (error) {
      return { error: error.message };
    }

    await logPlatformAuditAction({
      action: 'REMOVE_STAFF_USER',
      target_type: 'staff_role',
      target_id: staffId,
      target_name: staff?.email || staffId,
      reason: reason || `Staff user permanently removed by Platform Owner (${user.email})`,
      metadata: { removedEmail: staff?.email, actorEmail: user.email },
    });

    revalidatePath('/platform/security');
    revalidatePath('/platform/settings');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to remove staff member' };
  }
}
