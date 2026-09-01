'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import {
  Mail,
  BellRing,
  Loader2,
  ShoppingBag,
  CreditCard,
  AlertTriangle,
  Radio,
  Share2,
  Save,
  RotateCcw,
} from 'lucide-react';
import { NotificationSettings } from '@/types/settings';
import { updateNotificationSettings } from '@/app/actions/settings-business';
import { toast } from 'sonner';

interface NotificationsFormProps {
  initialSettings: NotificationSettings;
  userEmail: string;
}

export function NotificationsForm({ initialSettings, userEmail }: NotificationsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings);
  const [savedSettings, setSavedSettings] = useState<NotificationSettings>(initialSettings);

  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(savedSettings);
  }, [settings, savedSettings]);

  const handleToggle = (field: keyof NotificationSettings, val: boolean) => {
    setSettings((prev) => ({ ...prev, [field]: val }));
  };

  const handleReset = () => {
    setSettings(savedSettings);
    toast.info('Changes reverted');
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateNotificationSettings(settings);
      if (res.error) {
        toast.error(res.error);
      } else {
        setSavedSettings(settings);
        toast.success('Notification preferences saved successfully');
      }
    });
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* 1. Email Notifications Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-base font-bold font-display">Email Notifications</CardTitle>
                <CardDescription className="text-xs text-muted">
                  Operational alerts delivered directly to your registered inbox.
                </CardDescription>
              </div>
            </div>
            {userEmail && (
              <span className="text-xs font-mono text-muted bg-surface-elevated px-2.5 py-1 rounded-lg border border-separator/60">
                {userEmail}
              </span>
            )}
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-4">
          {/* New Order */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-surface-elevated text-brand-primary shrink-0">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">New Order Placed</p>
                <p className="text-[11px] text-muted">
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

          {/* Payment Received */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-surface-elevated text-emerald-600 dark:text-emerald-400 shrink-0">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Payment Received & Verified</p>
                <p className="text-[11px] text-muted">
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

          {/* Low Inventory */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-surface-elevated text-amber-500 shrink-0">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Low Stock Warning</p>
                <p className="text-[11px] text-muted">
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
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <BellRing className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">In-App & Channel Alerts</CardTitle>
              <CardDescription className="text-xs text-muted">
                Live notifications across your active dashboard and connected channels.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-4">
          {/* Live In-App Badges */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-surface-elevated text-purple-600 dark:text-purple-400 shrink-0">
                <Radio className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Live Dashboard Notifications</p>
                <p className="text-[11px] text-muted">
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

          {/* Connected Social Channel Dispatch */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-surface-elevated text-brand-primary shrink-0">
                <Share2 className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Connected Channel Forwarding</p>
                <p className="text-[11px] text-muted">
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
      </Card>

      {/* Sticky Bottom Save Bar */}
      {isDirty && (
        <div className="fixed sm:sticky bottom-4 left-4 right-4 sm:left-auto sm:right-auto z-40 bg-surface-elevated/95 backdrop-blur-md border border-separator shadow-lg rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 animate-slideUp">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
            <span className="text-xs font-semibold text-foreground">You have unsaved notification preferences</span>
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
