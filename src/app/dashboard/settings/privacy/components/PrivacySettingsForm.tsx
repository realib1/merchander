'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Cookie, Trash2, Loader2, Save, RotateCcw, ShieldCheck, Eye, CheckCircle2, Info } from 'lucide-react';
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
      {/* 1. Legal & Regulatory Compliance Card */}
      <div className="rounded-2xl border border-brand-primary/20 bg-brand-primary/5 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground font-display">
                Data Sovereignty & Legal Framework
              </h3>
              <p className="text-xs text-muted">
                Adhering to regional data privacy laws and merchant compliance mandates.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              <CheckCircle2 size={12} /> Ghana DPA Act 843
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={12} /> GDPR Baseline
            </span>
          </div>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Under the <strong>Ghana Data Protection Act 2012 (Act 843)</strong>, merchants processing consumer records must ensure customer consent is captured before sending direct marketing broadcasts and provide clear notices regarding tracking technologies. Merchander enforces strict tenant data isolation and provides these controls to keep your store fully compliant.
        </p>
      </div>

      {/* 2. Customer Consent Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <Cookie className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Customer Consent & Tracking</CardTitle>
              <CardDescription className="text-xs text-muted">
                Configure cookie notices and marketing permission capture on your public storefront.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-0">
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Show Cookie Consent Banner</p>
              <p className="text-[11px] text-muted">
                Displays a bottom consent banner to new shoppers visiting your online catalog.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.showCookieBanner)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, showCookieBanner: c }))}
              aria-label="Show cookie banner"
            />
          </div>

          {/* Interactive Cookie Banner Preview */}
          <div className="p-4 rounded-xl border border-separator/80 bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Eye size={13} className="text-brand-primary" />
                Storefront Banner Preview
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  settings.showCookieBanner
                    ? 'bg-success/10 text-success'
                    : 'bg-muted/10 text-muted'
                }`}
              >
                {settings.showCookieBanner ? 'Active on Storefront' : 'Currently Hidden'}
              </span>
            </div>

            {settings.showCookieBanner ? (
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-separator shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <Cookie size={14} className="text-amber-500" />
                    We respect your privacy
                  </p>
                  <p className="text-[11px] text-muted">
                    This store uses cookies to remember your shopping bag, analyze visits, and deliver smooth checkout.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-separator bg-surface text-muted">
                    Essential Only
                  </span>
                  <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-brand-primary text-white">
                    Accept All
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-3 text-center text-xs text-muted italic bg-surface-elevated/20 rounded-lg border border-dashed border-separator">
                Cookie banner is turned off. Storefront visitors will not see a cookie prompt.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Marketing Opt-In Checkbox at Checkout</p>
              <p className="text-[11px] text-muted">
                Allows shoppers to opt-in for WhatsApp and SMS promotional drops when placing an order.
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

      {/* 3. Customer Data Retention Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Customer Data Retention & Hygiene</CardTitle>
              <CardDescription className="text-xs text-muted">
                Automated purging schedule for stale checkout drafts and abandoned bags.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-0">
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
              <option value={30}>After 30 days (Recommended for lean storage)</option>
              <option value={90}>After 90 days (Standard recovery window)</option>
              <option value={180}>After 180 days (Extended remarketing)</option>
              <option value={365}>After 1 year</option>
            </select>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-elevated/40 border border-separator text-xs text-muted">
            <Info size={15} className="text-brand-primary shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Purging only removes uncompleted buyer drafts and abandoned carts. Completed orders, customer profiles, payment receipts, and tax records are permanently preserved in your ledger for audit integrity.
            </p>
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
