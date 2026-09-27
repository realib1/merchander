'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { FormField } from '@/components/ui/FormField';
import { Smartphone, Banknote, Building, CreditCard } from 'lucide-react';
import { PaymentSettings, P2PAccount } from '@/types/settings';
import { ManualP2PAccountsList } from './ManualP2PAccountsList';

interface PaymentMethodsCardProps {
  settings: PaymentSettings;
  onChangeMethod: (key: keyof PaymentSettings['methods'], val: boolean) => void;
  onChangeP2PAccounts: (accounts: P2PAccount[]) => void;
  onChangeCodMax: (val: number) => void;
  onChangeInstructions: (val: string) => void;
  disabled?: boolean;
}

export function PaymentMethodsCard({
  settings,
  onChangeMethod,
  onChangeP2PAccounts,
  onChangeCodMax,
  onChangeInstructions,
  disabled = false,
}: PaymentMethodsCardProps) {
  const { methods, p2pAccounts, codMaxOrderAmount, paymentInstructions } = settings;

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 shrink-0">
            <Smartphone className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display">Accepted Payment Methods</CardTitle>
            <CardDescription className="text-xs text-muted">
              Select the payment methods you accept from customers across storefront checkout and conversation channels.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-6">
        {/* 1. Method Switches Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-separator bg-surface">
            <div className="flex items-center gap-2.5">
              <Smartphone className="h-4 w-4 text-yellow-500 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-foreground">Mobile Money</h4>
                <p className="text-[10px] text-muted">MTN MoMo, Telecel Cash, AT Money</p>
              </div>
            </div>
            <Switch
              checked={methods.mobileMoney}
              onCheckedChange={(c) => onChangeMethod('mobileMoney', c)}
              disabled={disabled}
              aria-label="Enable Mobile Money"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-separator bg-surface">
            <div className="flex items-center gap-2.5">
              <Banknote className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-foreground">Cash / Cash on Delivery</h4>
                <p className="text-[10px] text-muted">In-store cash and dispatch delivery</p>
              </div>
            </div>
            <Switch
              checked={methods.cash}
              onCheckedChange={(c) => onChangeMethod('cash', c)}
              disabled={disabled}
              aria-label="Enable Cash"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-separator bg-surface">
            <div className="flex items-center gap-2.5">
              <Building className="h-4 w-4 text-blue-500 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-foreground">Bank Transfer</h4>
                <p className="text-[10px] text-muted">Direct commercial bank deposits</p>
              </div>
            </div>
            <Switch
              checked={methods.bankTransfer}
              onCheckedChange={(c) => onChangeMethod('bankTransfer', c)}
              disabled={disabled}
              aria-label="Enable Bank Transfer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-separator bg-surface">
            <div className="flex items-center gap-2.5">
              <CreditCard className="h-4 w-4 text-purple-500 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-foreground">Debit / Credit Card</h4>
                <p className="text-[10px] text-muted">Visa & Mastercard payments</p>
              </div>
            </div>
            <Switch
              checked={methods.card}
              onCheckedChange={(c) => onChangeMethod('card', c)}
              disabled={disabled}
              aria-label="Enable Card payments"
            />
          </div>
        </div>

        {/* COD Maximum Limit (Conditional) */}
        {methods.cash && (
          <div className="p-3.5 rounded-xl border border-separator bg-surface-elevated space-y-1">
            <FormField
              name="codMaxOrderAmount"
              label="Maximum Order Value for Cash on Delivery (GHS)"
              type="number"
              min={50}
              value={codMaxOrderAmount || 500}
              onChange={(e) => onChangeCodMax(parseFloat(e.target.value) || 500)}
              disabled={disabled}
              hint="Orders above this amount will require an upfront Mobile Money or Card payment."
            />
          </div>
        )}

        {/* 2. Dynamic P2P Account List with Plus Button */}
        <ManualP2PAccountsList
          accounts={p2pAccounts || []}
          onChangeAccounts={onChangeP2PAccounts}
          disabled={disabled}
        />

        {/* 3. Customer Payment Instructions */}
        <div className="space-y-1.5 pt-2 border-t border-separator">
          <label htmlFor="paymentInstructions" className="text-xs font-semibold text-foreground">
            Customer Payment Instructions
          </label>
          <textarea
            id="paymentInstructions"
            rows={2}
            value={paymentInstructions || ''}
            onChange={(e) => onChangeInstructions(e.target.value)}
            disabled={disabled}
            placeholder="e.g. Please use your Order Short ID as payment reference."
            className="w-full rounded-xl border border-separator bg-surface p-3 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-50 resize-none"
          />
          <p className="text-[11px] text-muted">
            Displayed to customers during checkout and provided by bots during conversations.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
