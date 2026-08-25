import { createClient } from '@/lib/supabase/server';
import { getTenantInfo, getTenantSettings } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import { SecurityForm } from './components/SecurityForm';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { KeyRound, MonitorSmartphone, ShieldCheck } from 'lucide-react';

export default async function SecuritySettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let tenantSettings = null;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    tenantSettings = await getTenantSettings(supabase, tenantId, 'two_factor_enabled, sms_recovery_enabled');
  } catch (error) {
    console.error('Error fetching security settings:', error);
  }

  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Security Settings</h1>
        <p className="text-sm text-secondary mt-1">Manage your password, authentication, and active sessions.</p>
      </div>

      {/* Password Section */}
      <Card>
        <form>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
                <KeyRound className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <FormField label="Current Password" type="password" name="currentPassword" disabled />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="New Password" type="password" name="newPassword" disabled />
              <FormField label="Confirm New Password" type="password" name="confirmPassword" disabled />
            </div>
            <p className="text-xs text-secondary mt-2">
              Password must be at least 8 characters long and contain a mix of uppercase, lowercase, numbers, and
              symbols.
            </p>
          </CardBody>
          <CardFooter className="justify-end">
            <Button variant="primary" size="sm" type="button" disabled>
              Update Password
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted">Coming Soon</span>
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <SecurityForm
          initialTwoFactor={Boolean(tenantSettings?.two_factor_enabled)}
          initialSmsRecovery={Boolean(tenantSettings?.sms_recovery_enabled)}
        />
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <MonitorSmartphone className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Devices and browsers currently authenticated.</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-elevated border border-separator">
            <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-primary">Current Web Session</p>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Active
                </span>
              </div>
              <p className="text-xs text-secondary">
                Signed in as <span className="font-mono text-primary">{user.email}</span>
              </p>
              <p className="text-xs text-muted">
                Multi-device revocation and remote sign-out controls are rolling out in the next platform update.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
