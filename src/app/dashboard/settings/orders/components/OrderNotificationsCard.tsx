'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { BellRing } from 'lucide-react';
import { OrderNotificationEventsSettings } from '@/types/settings';

interface OrderNotificationsCardProps {
  notifications: OrderNotificationEventsSettings;
  onChange: (updated: OrderNotificationEventsSettings) => void;
  disabled?: boolean;
}

const NOTIFICATION_EVENTS: Array<{
  id: keyof OrderNotificationEventsSettings;
  label: string;
  description: string;
}> = [
  { id: 'newOrder', label: 'New Order Placed', description: 'Triggered when a shopper or agent creates an order.' },
  {
    id: 'orderCancelled',
    label: 'Order Cancelled',
    description: 'Triggered when an order is cancelled by customer or staff.',
  },
  {
    id: 'paymentReceived',
    label: 'Payment Received',
    description: 'Triggered when MoMo or POS payment is reconciled.',
  },
  { id: 'orderReady', label: 'Order Ready', description: 'Triggered when items are packed and ready for dispatch.' },
  { id: 'orderDelivered', label: 'Order Delivered', description: 'Triggered when delivery rider confirms handover.' },
  {
    id: 'returnRequested',
    label: 'Return Requested',
    description: 'Triggered when customer submits a return inquiry.',
  },
];

export function OrderNotificationsCard({ notifications, onChange, disabled = false }: OrderNotificationsCardProps) {
  const toggleEvent = (eventId: keyof OrderNotificationEventsSettings) => {
    onChange({
      ...notifications,
      [eventId]: !notifications[eventId],
    });
  };

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
            <BellRing className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display">Order Event Notifications</CardTitle>
            <CardDescription className="text-xs text-muted">
              Select which order events trigger alerts. Global notification channels configure delivery destinations.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-2.5 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {NOTIFICATION_EVENTS.map((event) => {
            const isEnabled = notifications[event.id];
            return (
              <div
                key={event.id}
                onClick={() => toggleEvent(event.id)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  isEnabled
                    ? 'border-brand-primary bg-brand-primary/5 text-foreground'
                    : 'border-separator bg-surface text-muted hover:text-foreground'
                }`}
              >
                <Checkbox
                  checked={isEnabled}
                  onCheckedChange={() => toggleEvent(event.id)}
                  disabled={disabled}
                  aria-label={`Enable ${event.label}`}
                />
                <div>
                  <span className="text-foreground">{event.label}</span>
                  <p className="text-[11px] text-muted font-normal">{event.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
