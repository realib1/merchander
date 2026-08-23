import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { ShieldCheck, Smartphone, KeyRound, MonitorSmartphone } from 'lucide-react';

export default function SecuritySettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Security Settings</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your password, authentication, and active sessions.
        </p>
      </div>

      {/* Password Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <FormField label="Current Password" type="password" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="New Password" type="password" />
            <FormField label="Confirm New Password" type="password" />
          </div>
          <p className="text-xs text-text-muted mt-2">
            Password must be at least 8 characters long and contain a mix of uppercase, lowercase, numbers, and symbols.
          </p>
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="primary">Update Password</Button>
        </CardFooter>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="h-5 w-5" />
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
              <h4 className="text-sm font-medium text-text-primary">Authenticator App</h4>
              <p className="text-sm text-text-secondary">
                Use an app like Google Authenticator or Authy to generate verification codes.
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>
          
          <div className="w-full h-px bg-separator opacity-50" />
          
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-text-muted" />
                SMS Recovery
              </h4>
              <p className="text-sm text-text-secondary">
                Receive a code via SMS if you lose access to your authenticator app.
              </p>
            </div>
            <Switch defaultChecked={true} />
          </div>
        </CardBody>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <MonitorSmartphone className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Devices that are currently logged into your account.</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" className="text-destructive border-destructive/50 hover:bg-destructive/10">
              Sign out all devices
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-0 p-0">
          <div className="divide-y divide-separator/50">
            {/* Session 1 */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-start gap-4">
                <MonitorSmartphone className="h-8 w-8 text-text-muted mt-1" />
                <div>
                  <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
                    MacBook Pro - Accra, Ghana
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Current Session
                    </span>
                  </h4>
                  <p className="text-xs text-text-secondary mt-1">Chrome on macOS 14.2 • IP: 197.210.64.12</p>
                  <p className="text-xs text-text-muted mt-0.5">Active now</p>
                </div>
              </div>
            </div>

            {/* Session 2 */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-start gap-4">
                <Smartphone className="h-8 w-8 text-text-muted mt-1" />
                <div>
                  <h4 className="text-sm font-medium text-text-primary">iPhone 14 Pro - Accra, Ghana</h4>
                  <p className="text-xs text-text-secondary mt-1">Safari on iOS 17.1 • IP: 154.160.10.4</p>
                  <p className="text-xs text-text-muted mt-0.5">Last active: 2 hours ago</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-text-secondary">Revoke</Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
