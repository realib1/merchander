import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserPlus, ShieldAlert, Key } from 'lucide-react';

export default function StaffSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Staff & Permissions</h1>
        <p className="text-sm text-secondary mt-1">Manage your team members and their access to Merchander.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
                <UserPlus className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Multi-user collaboration & role-based access.</CardDescription>
              </div>
            </div>
            <Button variant="primary" size="sm" disabled>
              Invite Staff
              <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-surface-elevated text-muted">Soon</span>
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="rounded-md border border-separator overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-surface-elevated border-b border-separator/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-xs font-bold text-brand-primary">
                  ME
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">Store Owner (You)</p>
                  <p className="text-xs text-secondary">Primary Administrator</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded bg-surface border border-separator text-xs text-primary font-medium">
                Owner
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
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
                <p className="text-sm font-medium text-primary">Sales Agent</p>
                <p className="text-xs text-secondary">Can chat, view orders, and manage inventory.</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md border border-separator bg-surface">
              <div>
                <p className="text-sm font-medium text-primary">Fulfillment / Dispatch</p>
                <p className="text-xs text-secondary">Can only view and pack orders.</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Configure
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <Key className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Security Enforcements</CardTitle>
              <CardDescription>Global security policies for your team.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="p-4 bg-surface-elevated rounded-md border border-separator text-xs text-secondary">
            Role-based permissions and granular team invitations will be configurable in the upcoming Team Pro release.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
