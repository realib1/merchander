import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Cookie, Trash2, Globe } from 'lucide-react';

export default function PrivacySettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Privacy & Data</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage how customer data is handled on your storefront.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Cookie className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Customer Consent</CardTitle>
              <CardDescription>Cookie banners and GDPR compliance.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-text-primary">Show Cookie Banner</h4>
              <p className="text-sm text-text-secondary max-w-lg">
                Require customers in the EU/UK to accept tracking cookies before analytics load.
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>
          
          <div className="w-full h-px bg-separator opacity-50" />
          
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-text-primary">Marketing Consent Checkbox</h4>
              <p className="text-sm text-text-secondary max-w-lg">
                Add an opt-in checkbox at checkout for promotional emails.
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
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Data Retention</CardTitle>
              <CardDescription>How long we keep inactive customer records.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">Delete Abandoned Checkouts</label>
            <select className="w-full rounded-md border border-separator bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
              <option>After 30 days</option>
              <option>After 90 days</option>
              <option>Never</option>
            </select>
          </div>
        </CardBody>
        <CardFooter className="justify-end border-t border-separator/50 mt-4">
          <Button variant="primary">Save Policies</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
