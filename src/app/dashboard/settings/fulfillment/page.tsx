import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { PackageCheck, FileText, Timer } from 'lucide-react';

export default function FulfillmentSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Fulfillment</h1>
        <p className="text-sm text-secondary mt-1">Configure how orders are packed and processed by your team.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <PackageCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Order Processing</CardTitle>
              <CardDescription>Default workflows for fulfilling customer orders.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Automatic Fulfillment</p>
              <p className="text-xs text-secondary max-w-lg">
                Automatically mark digital products or gift cards as fulfilled upon payment.
              </p>
            </div>
            <Switch defaultChecked={true} aria-label="Enable automatic fulfillment" />
          </div>

          <div className="w-full h-px bg-separator/50" />

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Require Scanning</p>
              <p className="text-xs text-secondary max-w-lg">
                Require staff to scan product barcodes before an order can be marked as packed.
              </p>
            </div>
            <Switch defaultChecked={false} aria-label="Require barcode scanning before fulfillment" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Packing Slips</CardTitle>
              <CardDescription>Customize the documents included in your shipments.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Show Prices</p>
              <p className="text-xs text-secondary max-w-lg">
                Include product prices and order totals on the printed packing slip.
              </p>
            </div>
            <Switch defaultChecked={false} aria-label="Show prices on packing slips" />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Include Return Instructions</p>
              <p className="text-xs text-secondary max-w-lg">
                Print your store&apos;s default return policy at the bottom of every slip.
              </p>
            </div>
            <Switch defaultChecked={true} aria-label="Include return instructions on packing slips" />
          </div>
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="outline" size="sm" disabled>
            Preview Packing Slip
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted">Soon</span>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <Timer className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Handling Time</CardTitle>
              <CardDescription>Estimated time to process orders before shipping.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="space-y-1.5">
            <label htmlFor="expected-processing-time" className="text-xs font-semibold text-primary">
              Expected Processing Time
            </label>
            <select
              id="expected-processing-time"
              defaultValue="Same business day"
              className="w-full rounded-md border border-separator bg-surface px-3.5 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="Same business day">Same business day</option>
              <option value="1 business day">1 business day</option>
              <option value="1-2 business days">1-2 business days</option>
              <option value="2-3 business days">2-3 business days</option>
            </select>
            <p className="text-xs text-secondary mt-1">This expectation is shown to customers at checkout.</p>
          </div>
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="outline" size="sm" disabled>
            Save Fulfillment Settings
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted">Soon</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
