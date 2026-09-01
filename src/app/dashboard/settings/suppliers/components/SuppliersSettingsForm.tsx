'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Truck, Users, Loader2, Save, RotateCcw, Hash } from 'lucide-react';
import { SupplierSettings } from '@/types/settings';
import { updateSupplierSettings } from '@/app/actions/settings-operations';
import { toast } from 'sonner';

interface SuppliersSettingsFormProps {
  initialSettings: SupplierSettings;
}

export function SuppliersSettingsForm({ initialSettings }: SuppliersSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState<SupplierSettings>({
    poPrefix: 'PO-',
    defaultCurrency: 'USD',
    paymentTerms: 'immediate',
    ...initialSettings,
  });
  const [savedSettings, setSavedSettings] = useState<SupplierSettings>({
    poPrefix: 'PO-',
    defaultCurrency: 'USD',
    paymentTerms: 'immediate',
    ...initialSettings,
  });

  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(savedSettings);
  }, [settings, savedSettings]);

  const handleReset = () => {
    setSettings(savedSettings);
    toast.info('Changes reverted');
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateSupplierSettings(settings);
      if (res.error) {
        toast.error(res.error);
      } else {
        setSavedSettings(settings);
        toast.success('Supplier & procurement defaults saved successfully');
      }
    });
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* 1. Procurement Standards Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Hash className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Purchase Order Standards</CardTitle>
              <CardDescription className="text-xs text-muted">
                Default numbering sequence, invoice currency, and commercial payment terms.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField
              label="PO Code Prefix"
              value={settings.poPrefix || 'PO-'}
              onChange={(e) => setSettings((s) => ({ ...s, poPrefix: e.target.value.toUpperCase() }))}
              placeholder="PO-"
              hint="Prefixed to newly drafted Purchase Orders."
              disabled={isPending}
            />

            <div className="space-y-1.5">
              <label htmlFor="default-currency" className="text-xs font-semibold text-foreground">
                Default Supplier Currency
              </label>
              <select
                id="default-currency"
                value={settings.defaultCurrency || 'USD'}
                onChange={(e) => setSettings((s) => ({ ...s, defaultCurrency: e.target.value }))}
                disabled={isPending}
                className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 cursor-pointer"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="GHS">GHS (GH₵) - Ghana Cedi</option>
                <option value="CNY">CNY (¥) - Chinese Yuan</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
              <p className="text-[11px] text-muted">Standard currency for foreign supplier restocks.</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="payment-terms" className="text-xs font-semibold text-foreground">
                Default Payment Terms
              </label>
              <select
                id="payment-terms"
                value={settings.paymentTerms || 'immediate'}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    paymentTerms: e.target.value as SupplierSettings['paymentTerms'],
                  }))
                }
                disabled={isPending}
                className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 cursor-pointer"
              >
                <option value="immediate">Immediate / Advance Payment</option>
                <option value="net15">Net 15 Days</option>
                <option value="net30">Net 30 Days</option>
                <option value="net60">Net 60 Days</option>
              </select>
              <p className="text-[11px] text-muted">Standard credit terms with suppliers.</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 2. Procurement Contact Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Procurement Contact</CardTitle>
              <CardDescription className="text-xs text-muted">
                The default reply-to address when issuing Purchase Orders to suppliers.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-0">
          <FormField
            label="Procurement Email"
            type="email"
            value={settings.procurementEmail}
            onChange={(e) => setSettings((s) => ({ ...s, procurementEmail: e.target.value }))}
            hint="Purchase orders and supplier inquiries will originate from this address."
            disabled={isPending}
          />
        </CardBody>
      </Card>

      {/* 3. Automated POs & Receiving Instructions */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Truck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Warehouse Receiving Instructions</CardTitle>
              <CardDescription className="text-xs text-muted">
                Default receiving window and offloading guidelines for freight deliveries.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-0">
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Draft Purchase Orders Automatically</p>
              <p className="text-[11px] text-muted">
                Automatically draft purchase orders to the linked supplier when items hit the low stock threshold.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.enableAutoPos)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, enableAutoPos: c }))}
              aria-label="Enable automated purchase orders"
            />
          </div>

          <FormField
            label="Receiving Instructions"
            isTextarea
            rows={3}
            value={settings.receivingInstructions}
            onChange={(e) => setSettings((s) => ({ ...s, receivingInstructions: e.target.value }))}
            hint="These instructions will be automatically attached to issued Purchase Orders."
            disabled={isPending}
          />
        </CardBody>
      </Card>

      {/* Sticky Bottom Save Bar */}
      {isDirty && (
        <div className="fixed sm:sticky bottom-4 left-4 right-4 sm:left-auto sm:right-auto z-40 bg-surface-elevated/95 backdrop-blur-md border border-separator shadow-lg rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 animate-slideUp">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
            <span className="text-xs font-semibold text-foreground">You have unsaved supplier settings</span>
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
