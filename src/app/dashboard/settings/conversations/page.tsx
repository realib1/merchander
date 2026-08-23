import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Inbox, Users, Clock } from 'lucide-react';

export default function ConversationsSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Conversations</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage how incoming customer chats are assigned and handled.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Inbox className="h-5 w-5" />
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
              <h4 className="text-sm font-medium text-text-primary">Auto-assign to staff</h4>
              <p className="text-sm text-text-secondary max-w-lg">
                Automatically distribute incoming chats to active staff members using round-robin.
              </p>
            </div>
            <Switch defaultChecked={true} />
          </div>
          
          <div className="w-full h-px bg-separator opacity-50" />
          
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-text-primary">Sticky Routing</h4>
              <p className="text-sm text-text-secondary max-w-lg">
                If a customer messages again, assign them to the staff member who helped them last.
              </p>
            </div>
            <Switch defaultChecked={true} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Clock className="h-5 w-5" />
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
              <h4 className="text-sm font-medium text-text-primary">Enable SLA Tracking</h4>
            </div>
            <Switch defaultChecked={false} />
          </div>
          
          <div className="space-y-1.5 opacity-50 pointer-events-none">
            <label className="text-sm font-medium text-text-primary">Target Response Time</label>
            <select disabled className="w-full rounded-md border border-separator bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
              <option>15 Minutes</option>
              <option>30 Minutes</option>
              <option>1 Hour</option>
            </select>
          </div>
        </CardBody>
        <CardFooter className="justify-end border-t border-separator/50 mt-4">
          <Button variant="primary">Save Routing Preferences</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
