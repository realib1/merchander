'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { PackageCheck, FileText, Timer, Loader2, Save, RotateCcw } from 'lucide-react';
import { FulfillmentSettings } from '@/types/settings';
import { updateFulfillmentSettings } from '@/app/actions/settings-operations';
import { toast } from 'sonner';

interface FulfillmentSettingsFormProps {
  initialSettings: FulfillmentSettings;
}

export function FulfillmentSettingsForm({ initialSettings }: FulfillmentSettingsFormProps) {
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
      const res = await updateFulfillmentSettings(settings);
      if (res.error) {
        toast.error(res.error);
      } else {
        setSavedSettings(settings);
        toast.success('Fulfillment settings saved successfully');
      }
    });
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* 1. Order Fulfillment Policies Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <PackageCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Order Fulfillment Policies</CardTitle>
              <CardDescription className="text-xs text-muted">
                Default workflows for packing and processing customer parcels.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-0">
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Automatic Digital Fulfillment</p>
              <p className="text-[11px] text-muted">
                Automatically mark digital items as fulfilled upon verified MoMo/Card payment.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.autoFulfillDigital)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, autoFulfillDigital: c }))}
              aria-label="Enable automatic fulfillment"
            />
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Require Barcode Verification</p>
              <p className="text-[11px] text-muted">
                Require warehouse staff to scan variant barcodes before marking orders as packed.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.requireScanning)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, requireScanning: c }))}
              aria-label="Require barcode scanning"
            />
          </div>
        </CardBody>
      </Card>

      {/* 2. Packing Slips & Documents Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Packing Slips & Waybill Documents</CardTitle>
              <CardDescription className="text-xs text-muted">
                Customize the information printed on shipment paperwork and delivery notes.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-0">
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Show Item Prices on Waybills</p>
              <p className="text-[11px] text-muted">
                Include variant pricing and total amount due on printed packing slips.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.packingSlipShowPrices)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, packingSlipShowPrices: c }))}
              aria-label="Show prices on packing slips"
            />
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Print Return & Exchange Policy</p>
              <p className="text-[11px] text-muted">
                Print store return guidelines at the bottom of customer receipts.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.packingSlipReturnPolicy)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, packingSlipReturnPolicy: c }))}
              aria-label="Include return policy on packing slips"
            />
          </div>
        </CardBody>
      </Card>

      {/* 3. SLA Preparation Time Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Timer className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Handling & Preparation SLA</CardTitle>
              <CardDescription className="text-xs text-muted">
                Estimated preparation window before dispatch.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="space-y-1.5">
            <label htmlFor="handling-time" className="text-xs font-semibold text-foreground">
              Expected Fulfillment Time
            </label>
            <select
              id="handling-time"
              value={settings.handlingTimeDays}
              onChange={(e) => setSettings((s) => ({ ...s, handlingTimeDays: e.target.value }))}
              className="w-full max-w-sm rounded-xl border border-separator bg-surface px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
            >
              <option value="Same business day">Same business day (Express)</option>
              <option value="1 business day">1 business day</option>
              <option value="1-2 business days">1-2 business days</option>
              <option value="2-3 business days">2-3 business days</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Sticky Bottom Save Bar */}
      {isDirty && (
        <div className="fixed sm:sticky bottom-4 left-4 right-4 sm:left-auto sm:right-auto z-40 bg-surface-elevated/95 backdrop-blur-md border border-separator shadow-lg rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 animate-slideUp">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
            <span className="text-xs font-semibold text-foreground">You have unsaved fulfillment settings</span>
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
