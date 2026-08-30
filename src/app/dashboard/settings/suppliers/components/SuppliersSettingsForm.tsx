'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Truck, Users, Send, Loader2 } from 'lucide-react';
import { SupplierSettings } from '@/types/settings';
import { updateSupplierSettings } from '@/app/actions/settings-operations';
import { toast } from 'sonner';

interface SuppliersSettingsFormProps {
  initialSettings: SupplierSettings;
}

export function SuppliersSettingsForm({ initialSettings }: SuppliersSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateSupplierSettings(settings);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Supplier & procurement defaults saved successfully');
      }
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Procurement Contact</CardTitle>
              <CardDescription>The default reply-to address when issuing Purchase Orders to suppliers.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <FormField
            label="Procurement Email"
            type="email"
            value={settings.procurementEmail}
            onChange={(e) => setSettings((s) => ({ ...s, procurementEmail: e.target.value }))}
            hint="Purchase orders and supplier inquiries will originate from this address."
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Send className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Automated Purchase Orders</CardTitle>
              <CardDescription>Configure automatic re-ordering when stock is critically low.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2 mb-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Draft Purchase Orders Automatically</p>
              <p className="text-xs text-muted max-w-md">
                Automatically draft purchase orders to the linked supplier when items hit the low stock threshold.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.enableAutoPos)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, enableAutoPos: c }))}
              aria-label="Enable automated purchase orders"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Truck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Warehouse Receiving Instructions</CardTitle>
              <CardDescription>Default receiving window and offloading guidelines for freight.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <FormField
            label="Receiving Instructions"
            isTextarea
            rows={3}
            value={settings.receivingInstructions}
            onChange={(e) => setSettings((s) => ({ ...s, receivingInstructions: e.target.value }))}
            hint="These instructions will be automatically attached to issued Purchase Orders."
          />
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 size={14} className="animate-spin mr-2" />}
            <span>{isPending ? 'Saving...' : 'Save Supplier Settings'}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
