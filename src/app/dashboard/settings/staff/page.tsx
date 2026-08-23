import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserPlus, ShieldAlert, Key } from 'lucide-react';

export default function StaffSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Staff & Permissions</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your team members and their access to Merchander.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>2 of 5 seats used.</CardDescription>
              </div>
            </div>
            <Button variant="primary" size="sm">Invite Staff</Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="rounded-md border border-separator overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-surface-elevated border-b border-separator/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-xs font-bold text-brand-primary">AU</div>
                <div>
                  <h4 className="text-sm font-medium text-text-primary">Admin User (You)</h4>
                  <p className="text-xs text-text-secondary">merchant@example.com</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded bg-surface border border-separator text-xs text-text-secondary">Owner</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface hover:bg-surface-elevated transition-colors border-b border-separator/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-500">JD</div>
                <div>
                  <h4 className="text-sm font-medium text-text-primary">John Doe</h4>
                  <p className="text-xs text-text-secondary">john.d@example.com</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded bg-surface border border-separator text-xs text-text-secondary">Sales Agent</div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>Define what different staff roles can see and do.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
           <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-md border border-separator bg-surface">
              <div>
                <p className="text-sm font-medium text-text-primary">Sales Agent</p>
                <p className="text-xs text-text-secondary">Can chat, view orders, and manage inventory.</p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md border border-separator bg-surface">
              <div>
                <p className="text-sm font-medium text-text-primary">Fulfillment / Dispatch</p>
                <p className="text-xs text-text-secondary">Can only view and pack orders.</p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
           </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Security Enforcements</CardTitle>
              <CardDescription>Global security policies for your team.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="p-4 bg-surface-elevated rounded-md border border-separator text-sm text-text-secondary">
            All staff members are currently required to enable Two-Factor Authentication (2FA) before accessing the dashboard.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
