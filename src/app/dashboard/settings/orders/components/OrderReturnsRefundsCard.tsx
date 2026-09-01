'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { RotateCcw } from 'lucide-react';
import { OrderReturnsRefundsSettings } from '@/types/settings';

interface OrderReturnsRefundsCardProps {
  returnsRefunds: OrderReturnsRefundsSettings;
  onChange: (updated: OrderReturnsRefundsSettings) => void;
  disabled?: boolean;
}

export function OrderReturnsRefundsCard({ returnsRefunds, onChange, disabled = false }: OrderReturnsRefundsCardProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 shrink-0">
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display">Returns & Refunds</CardTitle>
            <CardDescription className="text-xs text-muted">
              Operational rules for handling return requests and customer refund settlements.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div
            onClick={() =>
              onChange({
                ...returnsRefunds,
                allowReturnRequests: !returnsRefunds.allowReturnRequests,
              })
            }
            className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              returnsRefunds.allowReturnRequests
                ? 'border-brand-primary bg-brand-primary/5 text-foreground'
                : 'border-separator bg-surface text-muted hover:text-foreground'
            }`}
          >
            <Checkbox
              checked={returnsRefunds.allowReturnRequests}
              onCheckedChange={(c) => onChange({ ...returnsRefunds, allowReturnRequests: c })}
              disabled={disabled}
              aria-label="Allow customer return requests"
            />
            <div>
              <span className="text-foreground">Allow Customer Return Requests</span>
              <p className="text-[11px] text-muted font-normal">
                Shoppers can submit return requests from order tracking.
              </p>
            </div>
          </div>

          <div
            onClick={() =>
              onChange({
                ...returnsRefunds,
                refundRequiresMerchantApproval: !returnsRefunds.refundRequiresMerchantApproval,
              })
            }
            className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              returnsRefunds.refundRequiresMerchantApproval
                ? 'border-brand-primary bg-brand-primary/5 text-foreground'
                : 'border-separator bg-surface text-muted hover:text-foreground'
            }`}
          >
            <Checkbox
              checked={returnsRefunds.refundRequiresMerchantApproval}
              onCheckedChange={(c) => onChange({ ...returnsRefunds, refundRequiresMerchantApproval: c })}
              disabled={disabled}
              aria-label="Refunds require merchant approval"
            />
            <div>
              <span className="text-foreground">Require Merchant Approval</span>
              <p className="text-[11px] text-muted font-normal">
                No refund is processed until verified by store staff.
              </p>
            </div>
          </div>
        </div>

        {/* Default Refund Settlement Method */}
        <div className="space-y-1.5 pt-1">
          <label htmlFor="defaultRefundMethod" className="text-xs font-semibold text-foreground">
            Default Refund Settlement Method
          </label>
          <select
            id="defaultRefundMethod"
            value={returnsRefunds.defaultRefundMethod}
            onChange={(e) =>
              onChange({
                ...returnsRefunds,
                defaultRefundMethod: e.target.value as OrderReturnsRefundsSettings['defaultRefundMethod'],
              })
            }
            disabled={disabled}
            className="w-full sm:max-w-md rounded-xl border border-separator bg-surface px-3 py-2 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 cursor-pointer"
          >
            <option value="original_payment">Original Payment Method (MoMo / Card)</option>
            <option value="store_credit">Store Credit / Discount Voucher</option>
            <option value="manual">Manual Cash / Bank Wire Payout</option>
          </select>
          <p className="text-[11px] text-muted">
            Customer-facing return policy text is configured under Store Policies.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
