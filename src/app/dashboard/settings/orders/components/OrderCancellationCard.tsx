'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormField } from '@/components/ui/FormField';
import { XCircle } from 'lucide-react';
import { OrderCancellationSettings } from '@/types/settings';

interface OrderCancellationCardProps {
  cancellation: OrderCancellationSettings;
  onChange: (updated: OrderCancellationSettings) => void;
  disabled?: boolean;
}

export function OrderCancellationCard({ cancellation, onChange, disabled = false }: OrderCancellationCardProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
            <XCircle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display">Order Cancellation</CardTitle>
            <CardDescription className="text-xs text-muted">
              Define customer self-service cancellation rules and processing boundaries.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-4 pt-0">
        {/* Who can cancel */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">Who Can Cancel an Order:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              onClick={() =>
                onChange({
                  ...cancellation,
                  allowMerchantCancellation: !cancellation.allowMerchantCancellation,
                })
              }
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                cancellation.allowMerchantCancellation
                  ? 'border-brand-primary bg-brand-primary/5 text-foreground'
                  : 'border-separator bg-surface text-muted hover:text-foreground'
              }`}
            >
              <Checkbox
                checked={cancellation.allowMerchantCancellation}
                onCheckedChange={(c) => onChange({ ...cancellation, allowMerchantCancellation: c })}
                disabled={disabled}
                aria-label="Merchant staff can cancel"
              />
              <span>Store Owner & Staff</span>
            </div>

            <div
              onClick={() =>
                onChange({
                  ...cancellation,
                  allowCustomerCancellation: !cancellation.allowCustomerCancellation,
                })
              }
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                cancellation.allowCustomerCancellation
                  ? 'border-brand-primary bg-brand-primary/5 text-foreground'
                  : 'border-separator bg-surface text-muted hover:text-foreground'
              }`}
            >
              <Checkbox
                checked={cancellation.allowCustomerCancellation}
                onCheckedChange={(c) => onChange({ ...cancellation, allowCustomerCancellation: c })}
                disabled={disabled}
                aria-label="Customer self-service cancellation"
              />
              <span>Customer Self-Service</span>
            </div>
          </div>
        </div>

        {/* Customer cancellation window + Processing lock */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <FormField
            name="customerCancellationWindow"
            label="Customer Cancellation Window (Minutes)"
            type="number"
            min={5}
            max={1440}
            value={cancellation.customerCancellationWindowMinutes}
            onChange={(e) =>
              onChange({
                ...cancellation,
                customerCancellationWindowMinutes: Number(e.target.value) || 30,
              })
            }
            hint="Grace period after placement where customer can cancel directly."
            disabled={disabled || !cancellation.allowCustomerCancellation}
          />

          <div
            onClick={() =>
              onChange({
                ...cancellation,
                requireApprovalAfterProcessing: !cancellation.requireApprovalAfterProcessing,
              })
            }
            className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition self-start cursor-pointer mt-0 sm:mt-6.5 ${
              cancellation.requireApprovalAfterProcessing
                ? 'border-brand-primary bg-brand-primary/5 text-foreground'
                : 'border-separator bg-surface text-muted hover:text-foreground'
            }`}
          >
            <Checkbox
              checked={cancellation.requireApprovalAfterProcessing}
              onCheckedChange={(c) => onChange({ ...cancellation, requireApprovalAfterProcessing: c })}
              disabled={disabled}
              aria-label="Require approval once processing begins"
            />
            <span>Merchant approval required after packing/processing begins</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
