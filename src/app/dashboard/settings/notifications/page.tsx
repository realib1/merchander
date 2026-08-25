import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';

export default function NotificationsSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Notifications</h1>
        <p className="text-sm text-secondary mt-1">Configure when and how you receive store alerts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Select which events trigger an email alert.</CardDescription>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">New Order</p>
              <p className="text-xs text-secondary mt-0.5">Receive an email when a new order is placed.</p>
            </div>
            <Switch defaultChecked aria-label="Receive email on new order" />
          </div>

          <div className="w-full h-px bg-separator/50" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Low Inventory</p>
              <p className="text-xs text-secondary mt-0.5">
                Receive an email when product stock falls below threshold.
              </p>
            </div>
            <Switch defaultChecked aria-label="Receive email on low inventory" />
          </div>

          <div className="w-full h-px bg-separator/50" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Daily Summary</p>
              <p className="text-xs text-secondary mt-0.5">Receive a daily digest of sales and store performance.</p>
            </div>
            <Switch aria-label="Receive daily summary email digest" />
          </div>
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="outline" size="sm" disabled>
            Save Preferences
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted">Coming Soon</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
