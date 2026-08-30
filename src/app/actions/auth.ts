'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { hashBackupCode } from '@/utils/backup-codes';

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
      return { error: error.message, email };
    }

    // 2. Check if the user has an active 2FA factor requiring AAL2
    const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (!aalError && aalData && aalData.currentLevel === 'aal1' && aalData.nextLevel === 'aal2') {
      return { mfaRequired: true, email };
    }
  } catch (err) {
    console.error('Sign-in error:', err);
    return { error: 'Authentication service temporarily unavailable. Please try again.', email };
  }

  // 3. Redirect to dashboard on success
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
  } catch (err) {
    // Allow Next.js internal redirect exceptions to bubble
    if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
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
  } catch (err) {
    if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
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
