'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { OrderSettings } from '@/types/settings';
import { updateOrderSettings } from '@/app/actions/settings-commerce';
import { OrderNumberingCard } from './OrderNumberingCard';
import { OrderCreationCard } from './OrderCreationCard';
import { OrderConfirmationCard } from './OrderConfirmationCard';
import { OrderStatusCard } from './OrderStatusCard';
import { OrderCancellationCard } from './OrderCancellationCard';
import { OrderReturnsRefundsCard } from './OrderReturnsRefundsCard';
import { OrderInventoryBehaviourCard } from './OrderInventoryBehaviourCard';
import { OrderNotificationsCard } from './OrderNotificationsCard';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface OrdersSettingsFormProps {
  initialSettings: OrderSettings;
}

export function OrdersSettingsForm({ initialSettings }: OrdersSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState<OrderSettings>(initialSettings);
  const [savedSettings, setSavedSettings] = useState<OrderSettings>(initialSettings);

  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(savedSettings);
  }, [settings, savedSettings]);

  const handleReset = () => {
    setSettings(savedSettings);
    toast.info('Changes reverted');
  };

  const handleSave = () => {
    startTransition(async () => {
      // Sync legacy flat fields for backward compatibility
      const payload: OrderSettings = {
        ...settings,
        orderPrefix: settings.numbering.prefix,
        orderConfirmationEmail: settings.confirmation.sendCustomerConfirmation,
      };

      const res = await updateOrderSettings(payload);
      if (res.error) {
        toast.error(res.error);
      } else {
        setSavedSettings(settings);
        toast.success('Orders preferences saved successfully');
      }
    });
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-8 animate-fadeIn">
      {/* 1. Order Numbering */}
      <OrderNumberingCard
        numbering={settings.numbering}
        onChange={(updated) => setSettings((s) => ({ ...s, numbering: updated }))}
        disabled={isPending}
      />

      {/* 2. Order Creation & AI */}
      <OrderCreationCard
        creation={settings.creation}
        onChange={(updated) => setSettings((s) => ({ ...s, creation: updated }))}
        disabled={isPending}
      />

      {/* 3. Order Confirmation */}
      <OrderConfirmationCard
        confirmation={settings.confirmation}
        onChange={(updated) => setSettings((s) => ({ ...s, confirmation: updated }))}
        disabled={isPending}
      />

      {/* 4. Order Lifecycle Statuses */}
      <OrderStatusCard
        statuses={settings.statuses}
        onChange={(updated) => setSettings((s) => ({ ...s, statuses: updated }))}
        disabled={isPending}
      />

      {/* 5. Cancellation Policy */}
      <OrderCancellationCard
        cancellation={settings.cancellation}
        onChange={(updated) => setSettings((s) => ({ ...s, cancellation: updated }))}
        disabled={isPending}
      />

      {/* 6. Returns & Refunds */}
      <OrderReturnsRefundsCard
        returnsRefunds={settings.returnsRefunds}
        onChange={(updated) => setSettings((s) => ({ ...s, returnsRefunds: updated }))}
        disabled={isPending}
      />

      {/* 7. Inventory & Stock Behaviour */}
      <OrderInventoryBehaviourCard
        inventory={settings.inventory}
        onChange={(updated) => setSettings((s) => ({ ...s, inventory: updated }))}
        disabled={isPending}
      />

      {/* 8. Event Notifications */}
      <OrderNotificationsCard
        notifications={settings.notifications}
        onChange={(updated) => setSettings((s) => ({ ...s, notifications: updated }))}
        disabled={isPending}
      />

      {/* Sticky Bottom Save Bar */}
      {isDirty && (
        <div className="fixed sm:sticky bottom-4 left-4 right-4 sm:left-auto sm:right-auto z-40 bg-surface-elevated/95 backdrop-blur-md border border-separator shadow-lg rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 animate-slideUp">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
            <span className="text-xs font-semibold text-foreground">You have unsaved order preferences</span>
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
