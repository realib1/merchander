'use client';

import { useActionState, useEffect, useRef } from 'react';
import { CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { ShieldCheck, Smartphone } from 'lucide-react';
import { updateSecuritySettings } from '@/app/actions/settings';
import { toast } from 'sonner';

export function SecurityForm({
  initialTwoFactor,
  initialSmsRecovery,
}: {
  initialTwoFactor: boolean;
  initialSmsRecovery: boolean;
}) {
  const [state, action, isPending] = useActionState(async (prevState: unknown, formData: FormData) => {
    return await updateSecuritySettings(formData);
  }, null);

  const lastToastedState = useRef<typeof state>(null);

  useEffect(() => {
    if (state === lastToastedState.current) return;
    lastToastedState.current = state;

    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success('Security settings updated successfully');
    }
  }, [state]);

  return (
    <form action={action}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
            <CardDescription>Add an extra layer of security to your account.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-6">
        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary">Authenticator App</p>
            <p className="text-xs text-secondary">
              Use an app like Google Authenticator or Authy to generate verification codes.
            </p>
          </div>
          <Switch
            name="twoFactor"
            defaultChecked={initialTwoFactor}
            aria-label="Enable authenticator app two-factor authentication"
          />
        </div>

        <div className="w-full h-px bg-separator/50" />

        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted" aria-hidden="true" />
              SMS Recovery
            </p>
            <p className="text-xs text-secondary">
              Receive a code via SMS if you lose access to your authenticator app.
            </p>
          </div>
          <Switch
            name="smsRecovery"
            defaultChecked={initialSmsRecovery}
            aria-label="Enable SMS recovery for two-factor authentication"
          />
        </div>
      </CardBody>
      <CardFooter className="justify-end">
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Security Settings'}
        </Button>
      </CardFooter>
    </form>
  );
}
