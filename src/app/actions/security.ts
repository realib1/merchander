'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateBackupCodeBatch } from '@/utils/backup-codes';

const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(passwordComplexityRegex, 'Password must include uppercase, lowercase, numbers, and special characters'),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

export async function changePassword(formData: FormData) {
  const rawData = {
    currentPassword: formData.get('currentPassword')?.toString() || '',
    newPassword: formData.get('newPassword')?.toString() || '',
    confirmPassword: formData.get('confirmPassword')?.toString() || '',
  };

  const validation = changePasswordSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const { currentPassword, newPassword } = validation.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: 'Not authenticated' };
  }

  // 1. Verify the user's current password by re-authenticating
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { error: 'Current password is incorrect.' };
  }

  // 2. Update to the new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error('Password update error:', updateError);
    return { error: updateError.message || 'Failed to update password.' };
  }

  revalidatePath('/dashboard/settings/security');
  return { success: true };
}

export async function signOutOtherSessions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    const { error } = await supabase.auth.signOut({ scope: 'others' });
    if (error) {
      console.error('Sign out other sessions error:', error);
      return { error: error.message || 'Failed to sign out other sessions' };
    }

    revalidatePath('/dashboard/settings/security');
    return { success: true };
  } catch (err) {
    console.error('Error revoking other sessions:', err);
    return { error: 'Failed to revoke other sessions' };
  }
}

export async function enrollTotp() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: 'Not authenticated' };
  }

  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'Merchander',
      friendlyName: user.email,
    });

    if (error) {
      console.error('MFA enroll error:', error);
      if (error.message?.includes('mfa_totp_enroll_not_enabled') || error.message?.includes('disabled for TOTP')) {
        return {
          error:
            'TOTP Multi-Factor Authentication is disabled in your Supabase project settings. Please enable TOTP in your Supabase Auth configuration.',
        };
      }
      return { error: error.message || 'Failed to start MFA setup' };
    }

    return {
      success: true,
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    };
  } catch (err) {
    console.error('Error starting TOTP enrollment:', err);
    return { error: 'Failed to start TOTP enrollment' };
  }
}

export async function verifyAndEnableTotp(factorId: string, code: string) {
  if (!factorId || !code || code.trim().length !== 6) {
    return { error: 'Please enter a valid 6-digit authentication code.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });

    if (verifyError) {
      console.error('MFA verify error:', verifyError);
      return { error: verifyError.message || 'Invalid verification code. Please check your app and try again.' };
    }

    // Generate 8 emergency backup recovery codes
    const { plaintextCodes, hashedCodes } = generateBackupCodeBatch(8);

    // Remove any existing backup codes for this user
    await supabase.from('user_backup_codes').delete().eq('user_id', user.id);

    // Insert new hashed backup codes
    const backupRows = hashedCodes.map((codeHash) => ({
      user_id: user.id,
      code_hash: codeHash,
    }));

    const { error: insertError } = await supabase.from('user_backup_codes').insert(backupRows);
    if (insertError) {
      console.error('Error saving backup codes:', insertError);
    }

    // Update tenant_settings
    const { data: tenantMember } = await supabase
      .from('tenant_members')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (tenantMember?.tenant_id) {
      await supabase
        .from('tenant_settings')
        .update({ two_factor_enabled: true })
        .eq('tenant_id', tenantMember.tenant_id);
    }

    revalidatePath('/dashboard/settings/security');
    return {
      success: true,
      backupCodes: plaintextCodes,
    };
  } catch (err) {
    console.error('Error verifying TOTP code:', err);
    return { error: 'Failed to verify authentication code' };
  }
}

export async function getBackupCodesStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { remainingCount: 0 };
  }

  try {
    const { count, error } = await supabase
      .from('user_backup_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('used_at', null);

    if (error) {
      return { remainingCount: 0 };
    }

    return { remainingCount: count || 0 };
  } catch {
    return { remainingCount: 0 };
  }
}

export async function regenerateBackupCodes(currentPassword: string) {
  if (!currentPassword) {
    return { error: 'Current password is required to regenerate backup codes.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: 'Not authenticated' };
  }

  // 1. Re-authenticate with current password for security
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (authError) {
    return { error: 'Current password is incorrect.' };
  }

  try {
    // 2. Generate new batch of 8 backup codes
    const { plaintextCodes, hashedCodes } = generateBackupCodeBatch(8);

    // 3. Delete old backup codes
    await supabase.from('user_backup_codes').delete().eq('user_id', user.id);

    // 4. Insert new backup codes
    const backupRows = hashedCodes.map((codeHash) => ({
      user_id: user.id,
      code_hash: codeHash,
    }));

    const { error: insertError } = await supabase.from('user_backup_codes').insert(backupRows);
    if (insertError) {
      console.error('Error inserting regenerated backup codes:', insertError);
      return { error: 'Failed to save new backup codes.' };
    }

    revalidatePath('/dashboard/settings/security');
    return {
      success: true,
      backupCodes: plaintextCodes,
    };
  } catch (err) {
    console.error('Error regenerating backup codes:', err);
    return { error: 'Failed to regenerate backup recovery codes.' };
  }
}

export async function disableTotp() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();

    if (listError) {
      console.error('Error listing MFA factors:', listError);
      return { error: listError.message || 'Failed to retrieve MFA factors' };
    }

    const totpFactors = factors?.totp || [];
    for (const factor of totpFactors) {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (unenrollError) {
        console.error('Error unenrolling factor:', unenrollError);
      }
    }

    // Clean up backup codes
    await supabase.from('user_backup_codes').delete().eq('user_id', user.id);

    // Update tenant_settings
    const { data: tenantMember } = await supabase
      .from('tenant_members')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (tenantMember?.tenant_id) {
      await supabase
        .from('tenant_settings')
        .update({ two_factor_enabled: false })
        .eq('tenant_id', tenantMember.tenant_id);
    }

    revalidatePath('/dashboard/settings/security');
    return { success: true };
  } catch (err) {
    console.error('Error disabling 2FA:', err);
    return { error: 'Failed to disable Two-Factor Authentication' };
  }
}
