'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Bot } from 'lucide-react';
import { BusinessIntelligenceGrounding } from '@/types/settings';

interface IntelligenceGroundingCardProps {
  data: BusinessIntelligenceGrounding;
  onChange: (field: keyof BusinessIntelligenceGrounding, value: string) => void;
  disabled?: boolean;
}

const FIELDS = [
  {
    key: 'aboutBusiness' as const,
    label: 'About the Business',
    placeholder: 'Brief summary of the business origin, mission, and background.',
  },
  {
    key: 'whatWeSell' as const,
    label: 'What the Business Sells',
    placeholder: 'Overview of product categories, materials, and offerings.',
  },
  {
    key: 'deliveryInfo' as const,
    label: 'Delivery Information',
    placeholder: 'Standard delivery timelines, coverage areas, and dispatch terms.',
  },
  {
    key: 'returnPolicy' as const,
    label: 'Return / Refund Policy',
    placeholder: 'Return windows, exchange conditions, and refund rules.',
  },
  {
    key: 'customerPolicies' as const,
    label: 'Other Customer-Facing Policies',
    placeholder: 'Payment methods accepted, warranty, and customer support rules.',
  },
];

export function IntelligenceGroundingCard({ data, onChange, disabled = false }: IntelligenceGroundingCardProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary shrink-0">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display">Information Used by Intelligence</CardTitle>
            <CardDescription className="text-xs text-muted">
              Business information used by customer-facing assistants and automated responses.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {FIELDS.map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={key} className="text-xs font-semibold text-foreground">
                {label}
              </label>
              <span className="text-[10px] text-muted">{data[key].length}/1000</span>
            </div>
            <textarea
              id={key}
              rows={2}
              maxLength={1000}
              value={data[key]}
              onChange={(e) => onChange(key, e.target.value)}
              disabled={disabled}
              placeholder={placeholder}
              className="w-full rounded-xl border border-separator bg-surface p-3 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-50 resize-none"
            />
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
