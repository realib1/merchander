'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { CreditCard, Smartphone, Banknote, ShieldCheck, Loader2 } from 'lucide-react';
import { PaymentSettings } from '@/types/settings';
import { updatePaymentSettings } from '@/app/actions/settings-commerce';
import { toast } from 'sonner';

interface PaymentsSettingsFormProps {
  initialSettings: PaymentSettings;
}

export function PaymentsSettingsForm({ initialSettings }: PaymentsSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);

  const handleSave = () => {
    startTransition(async () => {
      const res = await updatePaymentSettings(settings);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Payment settings saved successfully');
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Mobile Money */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                <Smartphone className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Mobile Money (Ghana MoMo)</CardTitle>
                <CardDescription>Accept automated and manual MoMo payments from local networks.</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-elevated border border-separator">
              <div>
                <p className="text-xs font-bold text-foreground">MTN MoMo</p>
                <p className="text-[10px] text-muted">024 / 054 / 055 / 059</p>
              </div>
              <Switch
                checked={Boolean(settings.enableMtnMomo)}
                onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, enableMtnMomo: c }))}
                aria-label="Enable MTN Mobile Money"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-elevated border border-separator">
              <div>
                <p className="text-xs font-bold text-foreground">Telecel Cash</p>
                <p className="text-[10px] text-muted">020 / 050</p>
              </div>
              <Switch
                checked={Boolean(settings.enableTelecelCash)}
                onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, enableTelecelCash: c }))}
                aria-label="Enable Telecel Cash"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-elevated border border-separator">
              <div>
                <p className="text-xs font-bold text-foreground">AT Money</p>
                <p className="text-[10px] text-muted">027 / 057 / 026</p>
              </div>
              <Switch
                checked={Boolean(settings.enableAtMoney)}
                onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, enableAtMoney: c }))}
                aria-label="Enable AT Money"
              />
            </div>
          </div>

          <div className="p-4 bg-surface-elevated rounded-xl border border-separator flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-foreground">MoMo Reference Reconciliation</p>
              <p className="text-xs text-muted mt-0.5">
                Merchander automatically scans incoming transaction IDs and reconciles pending orders.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Credit & Debit Cards */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <CreditCard className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Cards & Online Checkout</CardTitle>
                <CardDescription>Accept Visa, Mastercard, and international bank cards.</CardDescription>
              </div>
            </div>
            <Switch
              checked={Boolean(settings.enableCards)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, enableCards: c }))}
              aria-label="Enable card payments"
            />
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-xs text-muted">
            Card transactions are encrypted via 3D-Secure 2.0 and settled directly to your linked settlement account.
          </p>
        </CardBody>
      </Card>

      {/* Cash on Delivery */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Banknote className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Cash on Delivery (COD)</CardTitle>
                <CardDescription>Allow customers to pay dispatch riders upon package arrival.</CardDescription>
              </div>
            </div>
            <Switch
              checked={Boolean(settings.enableCod)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, enableCod: c }))}
              aria-label="Enable Cash on Delivery"
            />
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <p className="text-xs text-muted">
            Recommended only for verified customer routes or specific Greater Accra dispatch zones.
          </p>

          {settings.enableCod && (
            <FormField
              label="Maximum Allowed Order for COD (GHS)"
              type="number"
              min={50}
              value={settings.codMaxOrderAmount}
              onChange={(e) => setSettings((s) => ({ ...s, codMaxOrderAmount: parseFloat(e.target.value) || 500 }))}
              hint="Orders above this amount will require upfront MoMo or card payment."
            />
          )}
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 size={14} className="animate-spin mr-2" />}
            <span>{isPending ? 'Saving...' : 'Save Payment Methods'}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
