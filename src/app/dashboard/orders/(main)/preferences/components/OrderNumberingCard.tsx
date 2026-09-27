'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Hash } from 'lucide-react';
import { OrderNumberingSettings } from '@/types/settings';

interface OrderNumberingCardProps {
  numbering: OrderNumberingSettings;
  onChange: (updated: OrderNumberingSettings) => void;
  disabled?: boolean;
}

export function OrderNumberingCard({ numbering, onChange, disabled = false }: OrderNumberingCardProps) {
  const currentYear = new Date().getFullYear();
  const padNumber = (num: number) => String(num).padStart(5, '0');

  const getPreviewNumber = () => {
    const prefix = numbering.prefix.trim() || 'ORD';
    const num = padNumber(numbering.nextNumber || 142);

    if (numbering.format === 'ORD-{{NUMBER}}') {
      return `${prefix}-${num}`;
    }
    if (numbering.format === 'ORD-{{MONTH}}-{{NUMBER}}') {
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      return `${prefix}-${currentYear}${month}-${num}`;
    }
    return `${prefix}-${currentYear}-${num}`;
  };

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
            <Hash className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display">Order Numbering</CardTitle>
            <CardDescription className="text-xs text-muted">
              Configure standard identifier format and invoice sequence prefix.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            name="orderPrefix"
            label="Prefix Code"
            placeholder="e.g. ORD, INV, STORE"
            value={numbering.prefix}
            onChange={(e) => onChange({ ...numbering, prefix: e.target.value.toUpperCase() })}
            hint="Appears at the start of every generated order code."
            disabled={disabled}
          />

          <div className="space-y-1.5">
            <label htmlFor="orderNumberFormat" className="text-xs font-semibold text-foreground">
              Number Format
            </label>
            <select
              id="orderNumberFormat"
              value={numbering.format}
              onChange={(e) =>
                onChange({
                  ...numbering,
                  format: e.target.value as OrderNumberingSettings['format'],
                })
              }
              disabled={disabled}
              className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 cursor-pointer"
            >
              <option value="ORD-{{YEAR}}-{{NUMBER}}">
                ORD-&#123;&#123;YEAR&#125;&#125;-&#123;&#123;NUMBER&#125;&#125; (e.g. ORD-2026-00142)
              </option>
              <option value="ORD-{{NUMBER}}">ORD-&#123;&#123;NUMBER&#125;&#125; (e.g. ORD-00142)</option>
              <option value="ORD-{{MONTH}}-{{NUMBER}}">
                ORD-&#123;&#123;YEAR&#125;&#125;&#123;&#123;MONTH&#125;&#125;-&#123;&#123;NUMBER&#125;&#125; (e.g.
                ORD-202608-00142)
              </option>
            </select>
          </div>
        </div>

        {/* Live Next Order Preview */}
        <div className="p-3.5 rounded-xl border border-separator bg-surface-elevated/40 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-foreground">Next Generated Order:</span>
            <p className="text-[11px] text-muted">Preview of how your next customer receipt will be formatted.</p>
          </div>
          <span className="font-mono font-bold text-sm text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-lg border border-brand-primary/20">
            {getPreviewNumber()}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
