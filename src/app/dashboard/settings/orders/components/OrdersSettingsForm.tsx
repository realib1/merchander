'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { ShoppingBag, Hash, MailWarning, Loader2 } from 'lucide-react';
import { OrderSettings } from '@/types/settings';
import { updateOrderSettings } from '@/app/actions/settings-commerce';
import { toast } from 'sonner';

interface OrdersSettingsFormProps {
  initialSettings: OrderSettings;
}

export function OrdersSettingsForm({ initialSettings }: OrdersSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateOrderSettings(settings);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Order settings saved successfully');
      }
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Order Processing</CardTitle>
              <CardDescription>Default behaviors when a new order is placed.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Order Confirmation Receipts</p>
              <p className="text-xs text-muted">Automatically send a digital receipt to the customer when paid.</p>
            </div>
            <Switch
              checked={Boolean(settings.orderConfirmationEmail)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, orderConfirmationEmail: c }))}
              aria-label="Enable order confirmation emails"
            />
          </div>

          <div className="w-full h-px bg-separator/50" />

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Staff Order Notifications</p>
              <p className="text-xs text-muted">Notify active staff members immediately when an order is created.</p>
            </div>
            <Switch
              checked={Boolean(settings.staffOrderNotifications)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, staffOrderNotifications: c }))}
              aria-label="Enable staff order notifications"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Hash className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Order Number Formatting</CardTitle>
              <CardDescription>Customize prefix and suffix for customer invoices.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              label="Order Prefix"
              value={settings.orderPrefix}
              onChange={(e) => setSettings((s) => ({ ...s, orderPrefix: e.target.value }))}
              hint="Appears before the number (e.g. #ORD-)."
            />
            <FormField
              label="Order Suffix"
              value={settings.orderSuffix}
              onChange={(e) => setSettings((s) => ({ ...s, orderSuffix: e.target.value }))}
              hint="Optional suffix code (e.g. -GH)."
            />
          </div>
          <div className="p-4 bg-surface-elevated rounded-xl border border-separator text-xs">
            <span className="text-muted">Your formatted order numbers will look like: </span>
            <span className="font-bold text-foreground font-mono ml-1">
              {settings.orderPrefix || ''}1042{settings.orderSuffix || ''}
            </span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <MailWarning className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Abandoned Checkouts</CardTitle>
              <CardDescription>Recover lost storefront sales with automatic reminders.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Send Recovery Reminders</p>
              <p className="text-xs text-muted">
                Send WhatsApp or SMS prompt to shoppers who left items in their cart.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.abandonedRecoveryEnabled)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, abandonedRecoveryEnabled: c }))}
              aria-label="Enable abandoned checkout recovery"
            />
          </div>

          {settings.abandonedRecoveryEnabled && (
            <div className="space-y-1.5">
              <label htmlFor="abandoned-hours" className="text-xs font-semibold text-foreground">
                Trigger Reminder After
              </label>
              <select
                id="abandoned-hours"
                value={settings.abandonedSendAfterHours}
                onChange={(e) => setSettings((s) => ({ ...s, abandonedSendAfterHours: Number(e.target.value) }))}
                className="w-full max-w-sm rounded-lg border border-separator bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value={1}>1 Hour</option>
                <option value={6}>6 Hours</option>
                <option value={12}>12 Hours</option>
                <option value={24}>24 Hours</option>
              </select>
            </div>
          )}
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 size={14} className="animate-spin mr-2" />}
            <span>{isPending ? 'Saving...' : 'Save Order Settings'}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
