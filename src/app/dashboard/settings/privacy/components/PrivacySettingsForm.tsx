'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Cookie, Trash2, Loader2 } from 'lucide-react';
import { PrivacySettings } from '@/types/settings';
import { updatePrivacySettings } from '@/app/actions/settings-data';
import { toast } from 'sonner';

interface PrivacySettingsFormProps {
  initialSettings: PrivacySettings;
}

export function PrivacySettingsForm({ initialSettings }: PrivacySettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);

  const handleSave = () => {
    startTransition(async () => {
      const res = await updatePrivacySettings(settings);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Privacy & consent policies saved successfully');
      }
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Cookie className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Customer Consent & Analytics</CardTitle>
              <CardDescription>Cookie banners and storefront privacy compliance.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Show Cookie Consent Banner</p>
              <p className="text-xs text-muted max-w-lg">
                Require customers in regulated jurisdictions to consent to tracking cookies before analytics load.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.showCookieBanner)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, showCookieBanner: c }))}
              aria-label="Show cookie banner"
            />
          </div>

          <div className="w-full h-px bg-separator/50" />

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Marketing Opt-In Checkbox at Checkout</p>
              <p className="text-xs text-muted max-w-lg">
                Add an opt-in checkbox at bag checkout for promotional broadcast campaigns.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.marketingConsentCheckbox)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, marketingConsentCheckbox: c }))}
              aria-label="Enable marketing consent checkbox"
            />
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
              <CardTitle>Customer Data Retention</CardTitle>
              <CardDescription>Automated purging for inactive cart records.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="space-y-1.5">
            <label htmlFor="data-retention-select" className="text-xs font-semibold text-foreground">
              Purge Incomplete Abandoned Carts After
            </label>
            <select
              id="data-retention-select"
              value={settings.deleteAbandonedAfterDays}
              onChange={(e) => setSettings((s) => ({ ...s, deleteAbandonedAfterDays: parseInt(e.target.value) || 90 }))}
              className="w-full max-w-sm rounded-lg border border-separator bg-surface px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value={30}>After 30 days</option>
              <option value={90}>After 90 days</option>
              <option value={180}>After 180 days</option>
              <option value={365}>After 1 year</option>
            </select>
          </div>
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 size={14} className="animate-spin mr-2" />}
            <span>{isPending ? 'Saving...' : 'Save Privacy Policies'}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
