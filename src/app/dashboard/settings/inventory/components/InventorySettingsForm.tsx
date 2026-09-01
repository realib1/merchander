'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Package, AlertTriangle, Barcode, Loader2, Save, RotateCcw } from 'lucide-react';
import { InventorySettings } from '@/types/settings';
import { updateInventorySettings } from '@/app/actions/settings-commerce';
import { toast } from 'sonner';

interface InventorySettingsFormProps {
  initialSettings: InventorySettings;
}

export function InventorySettingsForm({ initialSettings }: InventorySettingsFormProps) {
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
      const res = await updateInventorySettings(settings);
      if (res.error) {
        toast.error(res.error);
      } else {
        setSavedSettings(settings);
        toast.success('Inventory settings saved successfully');
      }
    });
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* 1. Inventory Policy Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <Package className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Inventory & Stock Policy</CardTitle>
              <CardDescription className="text-xs text-muted">
                Determine fulfillment and availability behavior when product stock is depleted.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-0">
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Stop Selling When Out of Stock</p>
              <p className="text-[11px] text-muted">
                Automatically mark product variants as &quot;Sold Out&quot; on storefront and bots when stock reaches 0.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.stopSellingWhenOutOfStock)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, stopSellingWhenOutOfStock: c }))}
              aria-label="Stop selling when out of stock"
            />
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Track Inventory by Default</p>
              <p className="text-[11px] text-muted">
                Automatically enable stock quantity tracking for newly created products and variants.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.trackInventoryByDefault)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, trackInventoryByDefault: c }))}
              aria-label="Track inventory by default for new products"
            />
          </div>
        </CardBody>
      </Card>

      {/* 2. Low Stock Alerts Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Low Stock Alerts</CardTitle>
              <CardDescription className="text-xs text-muted">
                Receive proactive warnings before product variants completely sell out.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-0">
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Enable Low Stock Badges & Alerts</p>
              <p className="text-[11px] text-muted">
                Highlights depleted items on the inventory ledger and sends notification warnings.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.enableLowStockAlerts)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, enableLowStockAlerts: c }))}
              aria-label="Enable low stock alerts"
            />
          </div>

          {settings.enableLowStockAlerts && (
            <div className="p-3.5 rounded-xl border border-separator bg-surface-elevated/20">
              <FormField
                label="Low Stock Threshold (Units)"
                type="number"
                min={1}
                value={settings.lowStockThreshold}
                onChange={(e) => setSettings((s) => ({ ...s, lowStockThreshold: parseInt(e.target.value) || 5 }))}
                hint="You will receive an alert when a product variant falls to this quantity or lower."
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* 3. SKU Auto-Generation Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Barcode className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">SKU Auto-Generation</CardTitle>
              <CardDescription className="text-xs text-muted">
                Rules for generating Stock Keeping Units automatically.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Auto-generate SKUs on Product Creation</p>
              <p className="text-[11px] text-muted">
                Automatically generate sequential SKUs based on category code and variant attributes.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.autoGenerateSkus)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, autoGenerateSkus: c }))}
              aria-label="Auto-generate SKUs"
            />
          </div>
        </CardBody>
      </Card>

      {/* Sticky Bottom Save Bar */}
      {isDirty && (
        <div className="fixed sm:sticky bottom-4 left-4 right-4 sm:left-auto sm:right-auto z-40 bg-surface-elevated/95 backdrop-blur-md border border-separator shadow-lg rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 animate-slideUp">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
            <span className="text-xs font-semibold text-foreground">You have unsaved inventory settings</span>
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
