'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
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
      // Do not write failed logins to platform_audit_logs: the caller is
      // unauthenticated here and `email` is attacker-controlled, so recording it
      // lets anyone flood the immutable audit trail with caller-shaped rows.
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
      await logAuthEvent(user.email || email, 'auth.platform_login_success', 'Platform staff authenticated', user.id);
      redirect('/platform');
    }

    if (user) {
      await logAuthEvent(user.email || email, 'auth.merchant_login_success', 'Merchant authenticated', user.id);
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

export async function requestPasswordReset(prevState: unknown, formData: FormData) {
  const email = ((formData.get('email') as string) || '').trim().toLowerCase();

  if (!email || !email.includes('@') || !email.includes('.')) {
    return { error: 'Please enter a valid email address.' };
  }

  try {
    const supabase = await createClient();
    const headersList = await headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000';
    const protocol = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      if (error.status === 429 || error.message?.toLowerCase().includes('rate')) {
        return { error: 'Too many requests. Please wait a few minutes before trying again.' };
      }
      console.warn('Supabase password reset warning:', error.message);
    }

    return {
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    };
  } catch (err) {
    console.error('Password reset request error:', err);
    return { error: 'Unable to process your request. Please try again later.' };
  }
}

export async function updateUserPassword(prevState: unknown, formData: FormData) {
  const password = ((formData.get('password') as string) || '').trim();
  const confirmPassword = ((formData.get('confirmPassword') as string) || '').trim();

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: 'Your password reset session has expired or is invalid. Please request a new link.' };
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      return { error: updateError.message || 'Failed to update password. Please try again.' };
    }

    // Terminate the temporary recovery session so the user logs in with new credentials
    await supabase.auth.signOut();
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    console.error('Password update error:', err);
    return { error: 'Unable to update password. Please try again.' };
  }

  redirect('/login?reset=success');
}

