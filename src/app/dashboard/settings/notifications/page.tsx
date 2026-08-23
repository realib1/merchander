import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';

export default function NotificationsSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm text-text-secondary mt-1">Configure when and how you receive store alerts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Select which events trigger an email alert.</CardDescription>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">New Order</p>
              <p className="text-xs text-text-secondary mt-1">Receive an email when a new order is placed.</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="w-full h-px bg-separator opacity-50" />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Low Inventory</p>
              <p className="text-xs text-text-secondary mt-1">Receive an email when a product stock falls below 5 items.</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="w-full h-px bg-separator opacity-50" />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Daily Summary</p>
              <p className="text-xs text-text-secondary mt-1">Receive a daily digest of sales and store performance.</p>
            </div>
            <Switch />
          </div>
        </CardBody>
        <CardFooter className="justify-end bg-surface-elevated/30">
          <Button variant="primary">Save preferences</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
