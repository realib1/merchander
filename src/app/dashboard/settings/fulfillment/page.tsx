import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { PackageCheck, FileText, Timer } from 'lucide-react';

export default function FulfillmentSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fulfillment</h1>
        <p className="text-sm  mt-1">Configure how orders are packed and processed by your team.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <PackageCheck className="h-5 w-5" />
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
              <h4 className="text-sm font-medium">Automatic Fulfillment</h4>
              <p className="text-sm  max-w-lg">
                Automatically mark digital products or gift cards as fulfilled upon payment.
              </p>
            </div>
            <Switch defaultChecked={true} />
          </div>

          <div className="w-full h-px bg-separator opacity-50" />

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Require Scanning</h4>
              <p className="text-sm  max-w-lg">
                Require staff to scan product barcodes before an order can be marked as packed.
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <FileText className="h-5 w-5" />
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
              <h4 className="text-sm font-medium">Show Prices</h4>
              <p className="text-sm  max-w-lg">Include product prices and order totals on the printed packing slip.</p>
            </div>
            <Switch defaultChecked={false} />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Include Return Instructions</h4>
              <p className="text-sm  max-w-lg">
                Print your store&apos;s default return policy at the bottom of every slip.
              </p>
            </div>
            <Switch defaultChecked={true} />
          </div>
        </CardBody>
        <CardFooter className="justify-end border-t border-separator/50 mt-4">
          <Button variant="outline">Preview Packing Slip</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Handling Time</CardTitle>
              <CardDescription>Estimated time to process orders before shipping.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Expected Processing Time</label>
            <select className="w-full rounded-md border border-separator bg-surface px-3 py-2 text-sm  focus:outline-none focus:ring-2 focus:ring-brand-primary">
              <option>Same business day</option>
              <option>1 business day</option>
              <option>1-2 business days</option>
              <option>2-3 business days</option>
            </select>
            <p className="text-xs  mt-1">This expectation is shown to customers at checkout.</p>
          </div>
        </CardBody>
        <CardFooter className="justify-end border-t border-separator/50 mt-4">
          <Button variant="primary">Save Fulfillment Settings</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
