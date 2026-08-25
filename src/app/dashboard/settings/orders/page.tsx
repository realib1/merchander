import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { ShoppingBag, Hash, MailWarning } from 'lucide-react';

export default function OrdersSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Order Settings</h1>
        <p className="text-sm text-secondary mt-1">
          Manage how orders are processed, formatted, and communicated to customers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Order Processing</CardTitle>
              <CardDescription>Default behaviors when a new order is placed.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Order Confirmation Emails</p>
              <p className="text-xs text-secondary">
                Automatically send a receipt to the customer when they complete an order.
              </p>
            </div>
            <Switch defaultChecked={true} aria-label="Enable order confirmation emails" />
          </div>

          <div className="w-full h-px bg-separator/50" />

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Staff Order Notifications</p>
              <p className="text-xs text-secondary">
                Notify assigned staff members immediately when a new order arrives.
              </p>
            </div>
            <Switch defaultChecked={true} aria-label="Enable staff order notifications" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Hash className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Order Formatting</CardTitle>
              <CardDescription>Customize how your order numbers look (e.g., #ORD-1001).</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField label="Order Prefix" defaultValue="#ORD-" hint="Appears before the number." />
            <FormField label="Order Suffix" hint="Appears after the number (Optional)." />
          </div>
          <div className="p-4 bg-surface-elevated rounded-md border border-separator text-sm">
            <span className="text-secondary">Your next order number will look like: </span>
            <span className="font-semibold text-primary">#ORD-1042</span>
          </div>
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="outline" size="sm" disabled>
            Save Formatting
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted">Coming Soon</span>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <MailWarning className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Abandoned Checkouts</CardTitle>
              <CardDescription>Recover lost sales by automatically contacting customers.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Send Recovery Reminders</p>
              <p className="text-xs text-secondary">
                Automatically send a reminder to customers who leave without completing payment.
              </p>
            </div>
            <Switch defaultChecked={false} aria-label="Enable abandoned checkout recovery reminders" />
          </div>

          <div className="space-y-1.5 opacity-50 pointer-events-none">
            <label htmlFor="abandoned-send-after" className="text-xs font-semibold text-primary">
              Send after
            </label>
            <select
              id="abandoned-send-after"
              disabled
              defaultValue="12 hours"
              className="w-full rounded-md border border-separator bg-surface px-3.5 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="10 hours">10 hours</option>
              <option value="12 hours">12 hours</option>
              <option value="24 hours">24 hours</option>
            </select>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
