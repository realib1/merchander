'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Layers } from 'lucide-react';
import { OrderStatusSettings } from '@/types/settings';

interface OrderStatusCardProps {
  statuses: OrderStatusSettings;
  onChange: (updated: OrderStatusSettings) => void;
  disabled?: boolean;
}

const ALL_STATUSES: Array<{
  id: OrderStatusSettings['enabledStatuses'][number];
  label: string;
  dotColor: string;
  badgeClass: string;
}> = [
  {
    id: 'pending',
    label: 'Pending Payment / Review',
    dotColor: 'bg-amber-500',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    id: 'confirmed',
    label: 'Confirmed',
    dotColor: 'bg-blue-500',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    id: 'processing',
    label: 'Processing / Packing',
    dotColor: 'bg-purple-500',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  {
    id: 'ready',
    label: 'Ready for Pickup / Dispatch',
    dotColor: 'bg-teal-500',
    badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  },
  {
    id: 'shipped',
    label: 'Shipped / In Transit',
    dotColor: 'bg-indigo-500',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'delivered',
    label: 'Delivered',
    dotColor: 'bg-emerald-500',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'cancelled',
    label: 'Cancelled',
    dotColor: 'bg-red-500',
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
  {
    id: 'returned',
    label: 'Returned',
    dotColor: 'bg-orange-500',
    badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  {
    id: 'refunded',
    label: 'Refunded',
    dotColor: 'bg-slate-500',
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  },
];

export function OrderStatusCard({ statuses, onChange, disabled = false }: OrderStatusCardProps) {
  const toggleStatus = (statusId: OrderStatusSettings['enabledStatuses'][number]) => {
    // Core terminal statuses cannot be completely disabled
    if (['pending', 'confirmed', 'delivered', 'cancelled'].includes(statusId)) return;

    const current = statuses.enabledStatuses || [];
    const exists = current.includes(statusId);
    const updated = exists ? current.filter((s) => s !== statusId) : [...current, statusId];
    onChange({ enabledStatuses: updated });
  };

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
            <Layers className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display">Standard Order Lifecycle</CardTitle>
            <CardDescription className="text-xs text-muted">
              Choose which standard statuses are enabled in your store&apos;s fulfillment workflow.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-3 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {ALL_STATUSES.map((s) => {
            const isEnabled = statuses.enabledStatuses?.includes(s.id);
            const isLocked = ['pending', 'confirmed', 'delivered', 'cancelled'].includes(s.id);

            return (
              <div
                key={s.id}
                onClick={() => !isLocked && toggleStatus(s.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition ${
                  isLocked ? 'cursor-default opacity-85' : 'cursor-pointer'
                } ${
                  isEnabled
                    ? 'border-brand-primary/40 bg-surface-elevated text-foreground'
                    : 'border-separator bg-surface text-muted hover:text-foreground opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${s.dotColor}`} />
                  <span className="truncate">{s.label}</span>
                </div>
                <Checkbox
                  checked={isEnabled}
                  onCheckedChange={() => !isLocked && toggleStatus(s.id)}
                  disabled={disabled || isLocked}
                  aria-label={`Enable status ${s.label}`}
                />
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted">
          Underlying data model remains standardized for analytics while optional stages can be customized.
        </p>
      </CardBody>
    </Card>
  );
}
