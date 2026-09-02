'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { hashBackupCode } from '@/utils/backup-codes';
import { isActivePlatformStaff } from '@/lib/auth/platform-staff';

async function isPlatformStaffUser(userId: string): Promise<boolean> {
  try {
    return await isActivePlatformStaff(createAdminClient(), userId);
  } catch {
    return false;
  }
}

async function logAuthEvent(email: string, action: string, reason?: string, userId?: string) {
  try {
    const adminSupabase = createAdminClient();
    await adminSupabase.from('platform_audit_logs').insert({
      actor_id: userId || null,
      actor_email: email,
      actor_role: 'system',
      action,
      target_type: 'security_event',
      target_id: email,
      target_name: email,
      reason: reason || 'Authentication event',
      metadata: { timestamp: new Date().toISOString() },
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to log auth event:', err);
  }
}

export async function login(prevState: unknown, formData: FormData) {
  const email = (formData.get('email') as string) || '';
  const password = (formData.get('password') as string) || '';

  if (!email || !password) {
    return { error: 'Email and password are required', email: email || '' };
  }

  try {
    const supabase = await createClient();

    // 1. Attempt to sign in with email and password (AAL1)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      await logAuthEvent(email, 'auth.login_failed', error.message);
      return { error: error.message, email };
    }

    // 2. Check if the user has an active 2FA factor requiring AAL2
    const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (!aalError && aalData && aalData.currentLevel === 'aal1' && aalData.nextLevel === 'aal2') {
      return { mfaRequired: true, email };
    }

    // 3. Determine redirect destination based on platform staff status
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && (await isPlatformStaffUser(user.id))) {
      await logAuthEvent(email, 'auth.platform_login_success', 'Platform staff authenticated', user.id);
      redirect('/platform');
    }

    if (user) {
      await logAuthEvent(email, 'auth.merchant_login_success', 'Merchant authenticated', user.id);
    }
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    console.error('Sign-in error:', err);
    return { error: 'Authentication service temporarily unavailable. Please try again.', email };
  }

  // 4. Redirect to merchant dashboard for standard users
  redirect('/dashboard');
}

export async function verifyLoginMfa(code: string) {
  if (!code || code.trim().length !== 6) {
    return { error: 'Please enter a valid 6-digit code.' };
  }

  try {
    const supabase = await createClient();

    // Find the active verified TOTP factor
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();

    if (factorsError || !factors) {
      return { error: 'Unable to retrieve authentication factors. Please sign in again.' };
    }

    const verifiedFactor = factors.totp.find((f) => f.status === 'verified');
    if (!verifiedFactor) {
      return { error: 'No active authenticator app factor found.' };
    }

    // Verify 6-digit TOTP challenge to elevate session to AAL2
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: verifiedFactor.id,
      code: code.trim(),
    });

    if (verifyError) {
      return { error: 'Invalid verification code. Please check your authenticator app.' };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && (await isPlatformStaffUser(user.id))) {
      redirect('/platform');
    }
  } catch (err) {
    // Allow Next.js internal redirect exceptions to bubble
    if (isRedirectError(err)) {
      throw err;
    }
    console.error('Login MFA verification error:', err);
    return { error: 'Verification failed. Please try again.' };
  }

  redirect('/dashboard');
}

export async function verifyLoginBackupCode(backupCode: string) {
  if (!backupCode || backupCode.trim().length < 8) {
    return { error: 'Please enter a valid emergency backup recovery code.' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Session expired. Please sign in again with your password.' };
    }

    const codeHash = hashBackupCode(backupCode);

    // Look for matching unused backup code
    const { data: backupRecord, error: findError } = await supabase
      .from('user_backup_codes')
      .select('id')
      .eq('user_id', user.id)
      .eq('code_hash', codeHash)
      .is('used_at', null)
      .single();

    if (findError || !backupRecord) {
      return { error: 'Invalid or already used backup recovery code.' };
    }

    // Mark code as used
    await supabase.from('user_backup_codes').update({ used_at: new Date().toISOString() }).eq('id', backupRecord.id);

    if (await isPlatformStaffUser(user.id)) {
      redirect('/platform');
    }
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    console.error('Backup code verification error:', err);
    return { error: 'Unable to verify backup code. Please try again.' };
  }

  redirect('/dashboard');
}

export async function logout() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Sign-out error:', err);
  }

  redirect('/login');
}
