'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { CheckCircle } from 'lucide-react';
import { OrderConfirmationSettings } from '@/types/settings';

interface OrderConfirmationCardProps {
  confirmation: OrderConfirmationSettings;
  onChange: (updated: OrderConfirmationSettings) => void;
  disabled?: boolean;
}

export function OrderConfirmationCard({ confirmation, onChange, disabled = false }: OrderConfirmationCardProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <CheckCircle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display">Order Confirmation</CardTitle>
            <CardDescription className="text-xs text-muted">
              Define verification triggers before orders enter active fulfillment.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-2.5 pt-0">
        <div
          onClick={() => onChange({ ...confirmation, autoConfirmStorefront: !confirmation.autoConfirmStorefront })}
          className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
            confirmation.autoConfirmStorefront
              ? 'border-brand-primary bg-brand-primary/5 text-foreground'
              : 'border-separator bg-surface text-muted hover:text-foreground'
          }`}
        >
          <Checkbox
            checked={confirmation.autoConfirmStorefront}
            onCheckedChange={(c) => onChange({ ...confirmation, autoConfirmStorefront: c })}
            disabled={disabled}
            aria-label="Auto-confirm storefront orders"
          />
          <div>
            <span className="text-foreground">Automatically confirm storefront orders</span>
            <p className="text-[11px] text-muted font-normal">
              Paid storefront checkouts transition directly to Confirmed.
            </p>
          </div>
        </div>

        <div
          onClick={() =>
            onChange({
              ...confirmation,
              requireApprovalBeforeProcessing: !confirmation.requireApprovalBeforeProcessing,
            })
          }
          className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
            confirmation.requireApprovalBeforeProcessing
              ? 'border-brand-primary bg-brand-primary/5 text-foreground'
              : 'border-separator bg-surface text-muted hover:text-foreground'
          }`}
        >
          <Checkbox
            checked={confirmation.requireApprovalBeforeProcessing}
            onCheckedChange={(c) => onChange({ ...confirmation, requireApprovalBeforeProcessing: c })}
            disabled={disabled}
            aria-label="Require confirmation before processing"
          />
          <div>
            <span className="text-foreground">Require confirmation before processing</span>
            <p className="text-[11px] text-muted font-normal">
              Staff must verify item inventory and customer details before dispatch.
            </p>
          </div>
        </div>

        <div
          onClick={() =>
            onChange({
              ...confirmation,
              sendCustomerConfirmation: !confirmation.sendCustomerConfirmation,
            })
          }
          className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
            confirmation.sendCustomerConfirmation
              ? 'border-brand-primary bg-brand-primary/5 text-foreground'
              : 'border-separator bg-surface text-muted hover:text-foreground'
          }`}
        >
          <Checkbox
            checked={confirmation.sendCustomerConfirmation}
            onCheckedChange={(c) => onChange({ ...confirmation, sendCustomerConfirmation: c })}
            disabled={disabled}
            aria-label="Send customer confirmation notification"
          />
          <div>
            <span className="text-foreground">Send customer confirmation notification</span>
            <p className="text-[11px] text-muted font-normal">
              Dispatch instant receipt and tracking link via WhatsApp / Email.
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
