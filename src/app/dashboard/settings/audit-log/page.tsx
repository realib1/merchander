import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Activity, Download } from 'lucide-react';

export default function AuditLogSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-sm  mt-1">Review a secure trail of all actions performed by your team.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>The last 30 days of team activity.</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-0">
          <div className="rounded-md border border-separator overflow-hidden divide-y divide-separator">
            <div className="p-4 bg-surface hover:bg-surface-elevated transition-colors flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center shrink-0 border border-separator">
                <span className="text-xs font-bold">AU</span>
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">Admin User</span> updated the{' '}
                  <span className="font-medium">Shipping Rates</span>.
                </p>
                <p className="text-xs  mt-1">Today at 10:42 AM • IP: 102.176.65.12</p>
              </div>
            </div>
            <div className="p-4 bg-surface hover:bg-surface-elevated transition-colors flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center shrink-0 border border-separator">
                <span className="text-xs font-bold">JD</span>
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">John Doe</span> processed a refund for{' '}
                  <span className="font-medium">#ORD-1041</span>.
                </p>
                <p className="text-xs  mt-1">Yesterday at 4:15 PM • IP: 154.160.22.45</p>
              </div>
            </div>
            <div className="p-4 bg-surface hover:bg-surface-elevated transition-colors flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center shrink-0 border border-separator">
                <span className="text-xs font-bold">AU</span>
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">Admin User</span> logged in.
                </p>
                <p className="text-xs  mt-1">Yesterday at 9:00 AM • IP: 102.176.65.12</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
