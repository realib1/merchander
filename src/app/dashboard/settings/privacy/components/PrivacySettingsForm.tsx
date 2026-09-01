'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Cookie, Trash2, Loader2, Save, RotateCcw } from 'lucide-react';
import { PrivacySettings } from '@/types/settings';
import { updatePrivacySettings } from '@/app/actions/settings-data';
import { toast } from 'sonner';

interface PrivacySettingsFormProps {
  initialSettings: PrivacySettings;
}

export function PrivacySettingsForm({ initialSettings }: PrivacySettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [savedSettings, setSavedSettings] = useState(initialSettings);

  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(savedSettings);
  }, [settings, savedSettings]);

  const handleReset = () => {
    setSettings(savedSettings);
    toast.info('Changes reverted');
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updatePrivacySettings(settings);
      if (res.error) {
        toast.error(res.error);
      } else {
        setSavedSettings(settings);
        toast.success('Privacy & consent policies saved successfully');
      }
    });
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* 1. Customer Consent Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <Cookie className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Customer Consent & Tracking</CardTitle>
              <CardDescription className="text-xs text-muted">
                Cookie banners and storefront privacy compliance.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-0">
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Show Cookie Consent Banner</p>
              <p className="text-[11px] text-muted">
                Require customers to accept cookie usage before non-essential tracking scripts initialize.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.showCookieBanner)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, showCookieBanner: c }))}
              aria-label="Show cookie banner"
            />
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Marketing Opt-In Checkbox at Checkout</p>
              <p className="text-[11px] text-muted">
                Display an opt-in checkbox at bag checkout for promotional broadcast campaigns.
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

      {/* 2. Customer Data Retention Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Customer Data Retention</CardTitle>
              <CardDescription className="text-xs text-muted">
                Automated purging schedule for abandoned checkout records.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="space-y-1.5">
            <label htmlFor="data-retention-select" className="text-xs font-semibold text-foreground">
              Purge Incomplete Abandoned Carts After
            </label>
            <select
              id="data-retention-select"
              value={settings.deleteAbandonedAfterDays}
              onChange={(e) => setSettings((s) => ({ ...s, deleteAbandonedAfterDays: parseInt(e.target.value) || 90 }))}
              className="w-full max-w-sm rounded-xl border border-separator bg-surface px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
            >
              <option value={30}>After 30 days</option>
              <option value={90}>After 90 days</option>
              <option value={180}>After 180 days</option>
              <option value={365}>After 1 year</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Sticky Bottom Save Bar */}
      {isDirty && (
        <div className="fixed sm:sticky bottom-4 left-4 right-4 sm:left-auto sm:right-auto z-40 bg-surface-elevated/95 backdrop-blur-md border border-separator shadow-lg rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 animate-slideUp">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
            <span className="text-xs font-semibold text-foreground">You have unsaved privacy settings</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isPending}
              className="cursor-pointer"
            >
              <RotateCcw size={13} className="mr-1" />
              <span>Revert</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="cursor-pointer"
            >
              {isPending ? <Loader2 size={13} className="animate-spin mr-1" /> : <Save size={13} className="mr-1" />}
              <span>{isPending ? 'Saving...' : 'Save Preferences'}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
