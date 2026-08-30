'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Mail, BellRing, Loader2, ShoppingBag, CreditCard, AlertTriangle, Radio, Share2 } from 'lucide-react';
import { NotificationSettings } from '@/types/settings';
import { updateNotificationSettings } from '@/app/actions/settings-business';
import { toast } from 'sonner';

interface NotificationsFormProps {
  initialSettings: NotificationSettings;
  userEmail: string;
}

export function NotificationsForm({ initialSettings, userEmail }: NotificationsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);

  const handleToggle = (field: keyof NotificationSettings, val: boolean) => {
    setSettings((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateNotificationSettings(settings);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Notification preferences saved successfully');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Email Notifications Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Operational alerts delivered directly to your inbox.</CardDescription>
              </div>
            </div>
            {userEmail && (
              <span className="text-xs font-mono text-muted bg-surface-elevated px-2.5 py-1 rounded-lg border border-separator/60">
                {userEmail}
              </span>
            )}
          </div>
        </CardHeader>
        <CardBody className="space-y-5">
          {/* New Order */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-surface-elevated text-brand-primary mt-0.5 shrink-0">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">New Order Placed</p>
                <p className="text-xs text-muted">
                  Receive an instant email with line items and customer details when an order is created.
                </p>
              </div>
            </div>
            <Switch
              checked={Boolean(settings.emailNewOrder)}
              onCheckedChange={(c: boolean) => handleToggle('emailNewOrder', c)}
              aria-label="Receive email on new order"
            />
          </div>

          <div className="w-full h-px bg-separator/50" />

          {/* Payment Received */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-surface-elevated text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Payment Received & Verified</p>
                <p className="text-xs text-muted">
                  Receive an email confirmation whenever Mobile Money or Card payment is captured.
                </p>
              </div>
            </div>
            <Switch
              checked={Boolean(settings.emailPaymentReceived)}
              onCheckedChange={(c: boolean) => handleToggle('emailPaymentReceived', c)}
              aria-label="Receive email on payment received"
            />
          </div>

          <div className="w-full h-px bg-separator/50" />

          {/* Low Inventory */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-surface-elevated text-amber-500 mt-0.5 shrink-0">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Low Stock Warning</p>
                <p className="text-xs text-muted">
                  Receive an alert when product variant stock drops to or below the configured threshold.
                </p>
              </div>
            </div>
            <Switch
              checked={Boolean(settings.emailLowInventory)}
              onCheckedChange={(c: boolean) => handleToggle('emailLowInventory', c)}
              aria-label="Receive email on low inventory"
            />
          </div>
        </CardBody>
      </Card>

      {/* 2. In-App & Connected Channel Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <BellRing className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>In-App & Channel Alerts</CardTitle>
              <CardDescription>Live notifications across your active dashboard and connected channels.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-5">
          {/* Live In-App Badges */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-surface-elevated text-purple-600 dark:text-purple-400 mt-0.5 shrink-0">
                <Radio className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Live Dashboard Notifications</p>
                <p className="text-xs text-muted">
                  Display real-time notification badges and alert banners while actively managing your store.
                </p>
              </div>
            </div>
            <Switch
              checked={Boolean(settings.inAppOrderAlerts)}
              onCheckedChange={(c: boolean) => handleToggle('inAppOrderAlerts', c)}
              aria-label="Enable live in-app notifications"
            />
          </div>

          <div className="w-full h-px bg-separator/50" />

          {/* Connected Social Channel Dispatch */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-surface-elevated text-brand-primary mt-0.5 shrink-0">
                <Share2 className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Connected Channel Forwarding</p>
                <p className="text-xs text-muted">
                  Forward high-priority order pings to your active social channel configured in Connected Channels.
                </p>
              </div>
            </div>
            <Switch
              checked={Boolean(settings.channelOrderAlerts)}
              onCheckedChange={(c: boolean) => handleToggle('channelOrderAlerts', c)}
              aria-label="Enable connected channel notifications"
            />
          </div>
        </CardBody>

        <CardFooter className="justify-end">
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 size={14} className="animate-spin mr-2" />}
            <span>{isPending ? 'Saving...' : 'Save Notification Preferences'}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
