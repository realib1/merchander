'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Coins } from 'lucide-react';

interface CurrencyCardProps {
  currency: string;
  onChangeCurrency: (currency: string) => void;
  disabled?: boolean;
}

const CURRENCY_OPTIONS = [
  { code: 'GHS', label: 'GHS - Ghanaian Cedi (₵)', symbol: '₵' },
  { code: 'USD', label: 'USD - US Dollar ($)', symbol: '$' },
  { code: 'NGN', label: 'NGN - Nigerian Naira (₦)', symbol: '₦' },
  { code: 'EUR', label: 'EUR - Euro (€)', symbol: '€' },
  { code: 'GBP', label: 'GBP - British Pound (£)', symbol: '£' },
  { code: 'CNY', label: 'CNY - Chinese Yuan (¥)', symbol: '¥' },
];

export function CurrencyCard({ currency, onChangeCurrency, disabled = false }: CurrencyCardProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Coins className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display">Operating Currency</CardTitle>
            <CardDescription className="text-xs text-muted">
              Primary currency used for product pricing, orders, and payment records.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="currency" className="text-xs font-semibold text-foreground">
            Primary Currency
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => onChangeCurrency(e.target.value)}
            disabled={disabled}
            className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-50 cursor-pointer"
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted">All prices and transaction reports will default to this currency.</p>
        </div>
      </CardBody>
    </Card>
  );
}
