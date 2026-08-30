import { createClient } from '@/lib/supabase/server';
import { getTenantInfo, getTenantSettings } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import { PasswordChangeForm } from './components/PasswordChangeForm';
import { SecurityForm } from './components/SecurityForm';
import { ActiveSessionsCard } from './components/ActiveSessionsCard';
import { Card } from '@/components/ui/Card';

export const metadata = {
  title: 'Security Settings | Merchander',
  description: 'Manage your password, authentication safeguards, and active device sessions.',
};

export default async function SecuritySettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let tenantSettings = null;
  let isTwoFactorEnabled = false;

  try {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const hasVerifiedTotp = Boolean(factors?.totp?.some((f) => f.status === 'verified'));

    const { tenantId } = await getTenantInfo(supabase, user.id);
    tenantSettings = await getTenantSettings(supabase, tenantId, 'two_factor_enabled');
    isTwoFactorEnabled = hasVerifiedTotp || Boolean(tenantSettings?.two_factor_enabled);
  } catch (error) {
    console.error('Error fetching security settings:', error);
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">Security Settings</h1>
        <p className="text-sm text-muted mt-1">
          Manage your password, multi-factor authentication, and active sessions.
        </p>
      </div>

      {/* Password Management */}
      <Card>
        <PasswordChangeForm />
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <SecurityForm initialTwoFactor={isTwoFactorEnabled} />
      </Card>

      {/* Active Sessions & Remote Revocation */}
      <Card>
        <ActiveSessionsCard userEmail={user.email || ''} />
      </Card>
    </div>
  );
}
