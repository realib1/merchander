'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { FileText } from 'lucide-react';
import { PaymentRecordingSettings } from '@/types/settings';

interface PaymentRecordingCardProps {
  recording: PaymentRecordingSettings;
  onChangeRecording: (key: keyof PaymentRecordingSettings, val: boolean) => void;
  disabled?: boolean;
}

export function PaymentRecordingCard({ recording, onChangeRecording, disabled = false }: PaymentRecordingCardProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display">Payment Recording Policies</CardTitle>
            <CardDescription className="text-xs text-muted">
              Configure rules for how payments and ledger records are logged across your store.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-separator bg-surface">
            <div className="space-y-0.5 pr-2">
              <h4 className="text-xs font-bold text-foreground">Manual Payment Recording</h4>
              <p className="text-[11px] text-muted">Allow staff to record cash & offline transfers</p>
            </div>
            <Switch
              checked={recording.allowManualRecording}
              onCheckedChange={(c) => onChangeRecording('allowManualRecording', c)}
              disabled={disabled}
              aria-label="Allow manual payment recording"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-separator bg-surface">
            <div className="space-y-0.5 pr-2">
              <h4 className="text-xs font-bold text-foreground">Require Transaction Reference</h4>
              <p className="text-[11px] text-muted">Enforce entering MoMo or bank transaction IDs</p>
            </div>
            <Switch
              checked={recording.requirePaymentReference}
              onCheckedChange={(c) => onChangeRecording('requirePaymentReference', c)}
              disabled={disabled}
              aria-label="Require transaction reference"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-separator bg-surface">
            <div className="space-y-0.5 pr-2">
              <h4 className="text-xs font-bold text-foreground">Record Partial Payments</h4>
              <p className="text-[11px] text-muted">Allow deposits, installments, and split payments</p>
            </div>
            <Switch
              checked={recording.allowPartialPayments}
              onCheckedChange={(c) => onChangeRecording('allowPartialPayments', c)}
              disabled={disabled}
              aria-label="Record partial payments"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-separator bg-surface">
            <div className="space-y-0.5 pr-2">
              <h4 className="text-xs font-bold text-foreground">Record Supplier Payments</h4>
              <p className="text-[11px] text-muted">Track payments made for inventory and logistics</p>
            </div>
            <Switch
              checked={recording.recordSupplierPayments}
              onCheckedChange={(c) => onChangeRecording('recordSupplierPayments', c)}
              disabled={disabled}
              aria-label="Record supplier payments"
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
