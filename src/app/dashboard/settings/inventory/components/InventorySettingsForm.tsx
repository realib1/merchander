'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Package, AlertTriangle, Barcode, Loader2 } from 'lucide-react';
import { InventorySettings } from '@/types/settings';
import { updateInventorySettings } from '@/app/actions/settings-commerce';
import { toast } from 'sonner';

interface InventorySettingsFormProps {
  initialSettings: InventorySettings;
}

export function InventorySettingsForm({ initialSettings }: InventorySettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateInventorySettings(settings);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Inventory settings saved successfully');
      }
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Package className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Inventory Policy</CardTitle>
              <CardDescription>Determine what happens when products run out of stock.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Stop selling when out of stock</p>
              <p className="text-xs text-muted max-w-lg">
                Automatically mark product variants as &quot;Sold Out&quot; when their stock count hits 0.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.stopSellingWhenOutOfStock)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, stopSellingWhenOutOfStock: c }))}
              aria-label="Stop selling when out of stock"
            />
          </div>

          <div className="w-full h-px bg-separator/50" />

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Track Inventory by Default</p>
              <p className="text-xs text-muted max-w-lg">
                Automatically enable stock quantity tracking for newly created products.
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Low Stock Alerts</CardTitle>
              <CardDescription>Receive warnings before items completely sell out.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2 mb-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Enable Low Stock Badges & Alerts</p>
            </div>
            <Switch
              checked={Boolean(settings.enableLowStockAlerts)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, enableLowStockAlerts: c }))}
              aria-label="Enable low stock alerts"
            />
          </div>

          {settings.enableLowStockAlerts && (
            <FormField
              label="Low Stock Threshold (Units)"
              type="number"
              min={1}
              value={settings.lowStockThreshold}
              onChange={(e) => setSettings((s) => ({ ...s, lowStockThreshold: parseInt(e.target.value) || 5 }))}
              hint="You will receive an alert when a product variant falls to this quantity or lower."
            />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Barcode className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>SKU Auto-Generation</CardTitle>
              <CardDescription>Rules for generating Stock Keeping Units automatically.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Auto-generate SKUs on Product Creation</p>
              <p className="text-xs text-muted max-w-lg">
                Automatically generate clean sequential SKUs based on category code and variant attributes.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.autoGenerateSkus)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, autoGenerateSkus: c }))}
              aria-label="Auto-generate SKUs"
            />
          </div>
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 size={14} className="animate-spin mr-2" />}
            <span>{isPending ? 'Saving...' : 'Save Inventory Settings'}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
