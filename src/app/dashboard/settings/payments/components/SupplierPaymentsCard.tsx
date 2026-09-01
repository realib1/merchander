'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Truck, Smartphone, Building, Banknote, CreditCard } from 'lucide-react';
import { SupplierPaymentPreferences } from '@/types/settings';

import { Checkbox } from '@/components/ui/Checkbox';

interface SupplierPaymentsCardProps {
  supplierPayments: SupplierPaymentPreferences;
  onChangeSupplierPayments: (updater: Partial<SupplierPaymentPreferences>) => void;
  disabled?: boolean;
}

const SUPPLIER_METHODS: Array<{
  id: 'momo' | 'bank' | 'cash' | 'card';
  label: string;
  icon: React.ReactNode;
}> = [
  { id: 'momo', label: 'Mobile Money', icon: <Smartphone size={13} className="text-yellow-500" /> },
  { id: 'bank', label: 'Bank Transfer / Wire', icon: <Building size={13} className="text-blue-500" /> },
  { id: 'cash', label: 'Physical Cash', icon: <Banknote size={13} className="text-emerald-500" /> },
  { id: 'card', label: 'Company Card', icon: <CreditCard size={13} className="text-purple-500" /> },
];

export function SupplierPaymentsCard({
  supplierPayments,
  onChangeSupplierPayments,
  disabled = false,
}: SupplierPaymentsCardProps) {
  const toggleMethod = (methodId: 'momo' | 'bank' | 'cash' | 'card') => {
    const current = supplierPayments.defaultMethods || [];
    const exists = current.includes(methodId);
    const updated = exists ? current.filter((m) => m !== methodId) : [...current, methodId];
    onChangeSupplierPayments({ defaultMethods: updated });
  };

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
              <Truck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Supplier Payments</CardTitle>
              <CardDescription className="text-xs text-muted">
                Track payments and settlement methods for purchase orders and vendor shipments.
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={supplierPayments.enabled}
            onCheckedChange={(c) => onChangeSupplierPayments({ enabled: c })}
            disabled={disabled}
            aria-label="Enable supplier payment tracking"
          />
        </div>
      </CardHeader>
      {supplierPayments.enabled && (
        <CardBody className="space-y-3 pt-0">
          <label className="text-xs font-semibold text-foreground">Default Payment Methods for Suppliers</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUPPLIER_METHODS.map((m) => {
              const isSelected = supplierPayments.defaultMethods?.includes(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => toggleMethod(m.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'border-brand-primary bg-brand-primary/5 text-foreground'
                      : 'border-separator bg-surface text-muted hover:text-foreground'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleMethod(m.id)}
                    disabled={disabled}
                    aria-label={`Enable ${m.label} for suppliers`}
                  />
                  <span className="shrink-0">{m.icon}</span>
                  <span>{m.label}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted">
            Selected payment options will appear as quick presets when logging payments to suppliers.
          </p>
        </CardBody>
      )}
    </Card>
  );
}
