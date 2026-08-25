import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Inbox, Clock } from 'lucide-react';

export default function ConversationsSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Conversations</h1>
        <p className="text-sm text-secondary mt-1">Manage how incoming customer chats are assigned and handled.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Inbox className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Inbox Routing</CardTitle>
              <CardDescription>Rules for assigning new conversations to your team.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Auto-assign to staff</p>
              <p className="text-xs text-secondary max-w-lg">
                Automatically distribute incoming chats to active staff members using round-robin.
              </p>
            </div>
            <Switch defaultChecked={true} aria-label="Auto-assign chats to staff" />
          </div>

          <div className="w-full h-px bg-separator/50" />

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Sticky Routing</p>
              <p className="text-xs text-secondary max-w-lg">
                If a customer messages again, assign them to the staff member who helped them last.
              </p>
            </div>
            <Switch defaultChecked={true} aria-label="Enable sticky routing for returning customers" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Service Level Agreement (SLA)</CardTitle>
              <CardDescription>Track team performance against response time targets.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2 mb-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Enable SLA Tracking</p>
            </div>
            <Switch defaultChecked={false} aria-label="Enable SLA Tracking" />
          </div>

          <div className="space-y-1.5 opacity-50 pointer-events-none">
            <label htmlFor="target-sla" className="text-xs font-semibold text-primary">
              Target Response Time
            </label>
            <select
              id="target-sla"
              disabled
              defaultValue="30 Minutes"
              className="w-full rounded-md border border-separator bg-surface px-3.5 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="15 Minutes">15 Minutes</option>
              <option value="30 Minutes">30 Minutes</option>
              <option value="1 Hour">1 Hour</option>
            </select>
          </div>
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="outline" size="sm" disabled>
            Save Routing Preferences
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted">Soon</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
