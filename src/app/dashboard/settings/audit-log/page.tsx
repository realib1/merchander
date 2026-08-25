import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Activity, Download } from 'lucide-react';

export default function AuditLogSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Audit Log</h1>
        <p className="text-sm text-secondary mt-1">Review a secure trail of all actions performed by your team.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
                <Activity className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>The last 30 days of team activity.</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
              Export CSV
              <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-surface-elevated text-muted">Soon</span>
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-0">
          <div className="rounded-md border overflow-hidden divide-y divide-separator">
            <div className="p-4 bg-surface hover:bg-surface-elevated transition-colors flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center shrink-0 border border-separator">
                <span className="text-xs font-bold text-primary">ME</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-primary">
                  <span className="font-medium">Store Owner</span> updated the{' '}
                  <span className="font-medium">Business Profile</span>.
                </p>
                <p className="text-xs text-secondary mt-1">Today</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
