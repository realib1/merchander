'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { PackageCheck, FileText, Timer, Loader2 } from 'lucide-react';
import { FulfillmentSettings } from '@/types/settings';
import { updateFulfillmentSettings } from '@/app/actions/settings-operations';
import { toast } from 'sonner';

interface FulfillmentSettingsFormProps {
  initialSettings: FulfillmentSettings;
}

export function FulfillmentSettingsForm({ initialSettings }: FulfillmentSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateFulfillmentSettings(settings);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Fulfillment settings saved successfully');
      }
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <PackageCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Order Fulfillment Policies</CardTitle>
              <CardDescription>Default workflows for packing and processing customer parcels.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Automatic Digital Fulfillment</p>
              <p className="text-xs text-muted max-w-lg">
                Automatically mark digital items as fulfilled upon verified MoMo/Card payment.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.autoFulfillDigital)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, autoFulfillDigital: c }))}
              aria-label="Enable automatic fulfillment"
            />
          </div>

          <div className="w-full h-px bg-separator/50" />

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Require Barcode Verification</p>
              <p className="text-xs text-muted max-w-lg">
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Packing Slips & Waybill Documents</CardTitle>
              <CardDescription>Customize the information printed on shipment paperwork.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Show Item Prices on Waybills</p>
              <p className="text-xs text-muted max-w-lg">
                Include variant pricing and total amount due on printed packing slips.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.packingSlipShowPrices)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, packingSlipShowPrices: c }))}
              aria-label="Show prices on packing slips"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Print Return & Exchange Policy</p>
              <p className="text-xs text-muted max-w-lg">
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <Timer className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Handling & Preparation SLA</CardTitle>
              <CardDescription>Estimated preparation window before dispatch.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="space-y-1.5">
            <label htmlFor="handling-time" className="text-xs font-semibold text-foreground">
              Expected Fulfillment Time
            </label>
            <select
              id="handling-time"
              value={settings.handlingTimeDays}
              onChange={(e) => setSettings((s) => ({ ...s, handlingTimeDays: e.target.value }))}
              className="w-full max-w-sm rounded-lg border border-separator bg-surface px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="Same business day">Same business day (Express)</option>
              <option value="1 business day">1 business day</option>
              <option value="1-2 business days">1-2 business days</option>
              <option value="2-3 business days">2-3 business days</option>
            </select>
          </div>
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 size={14} className="animate-spin mr-2" />}
            <span>{isPending ? 'Saving...' : 'Save Fulfillment Settings'}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
