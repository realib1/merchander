import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Cookie, Trash2 } from 'lucide-react';

export default function PrivacySettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Privacy & Data</h1>
        <p className="text-sm text-secondary mt-1">Manage how customer data is handled on your storefront.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Cookie className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Customer Consent</CardTitle>
              <CardDescription>Cookie banners and privacy compliance.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Show Cookie Banner</p>
              <p className="text-xs text-secondary max-w-lg">
                Require customers in regulated regions to accept tracking cookies before analytics load.
              </p>
            </div>
            <Switch defaultChecked={false} aria-label="Show cookie banner" />
          </div>

          <div className="w-full h-px bg-separator/50" />

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Marketing Consent Checkbox</p>
              <p className="text-xs text-secondary max-w-lg">
                Add an opt-in checkbox at checkout for promotional updates.
              </p>
            </div>
            <Switch defaultChecked={true} aria-label="Enable marketing consent checkbox" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Data Retention</CardTitle>
              <CardDescription>How long we keep inactive customer records.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="space-y-1.5">
            <label htmlFor="data-retention-select" className="text-xs font-semibold text-primary">
              Delete Abandoned Checkouts
            </label>
            <select
              id="data-retention-select"
              defaultValue="After 90 days"
              className="w-full rounded-md border border-separator bg-surface px-3.5 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="After 30 days">After 30 days</option>
              <option value="After 90 days">After 90 days</option>
              <option value="Never">Never</option>
            </select>
          </div>
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="outline" size="sm" disabled>
            Save Policies
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted">Soon</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
