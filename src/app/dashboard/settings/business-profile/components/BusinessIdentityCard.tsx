'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Building2 } from 'lucide-react';
import { BusinessIdentityData } from '@/types/settings';
import { LogoUploader } from './LogoUploader';

interface BusinessIdentityCardProps {
  data: BusinessIdentityData;
  onChange: (field: keyof BusinessIdentityData, value: string) => void;
  disabled?: boolean;
}

const CATEGORY_OPTIONS = [
  'Retail & E-commerce',
  'Fashion & Apparel',
  'Health & Beauty',
  'Electronics & Gadgets',
  'Food & Groceries',
  'Home & Living',
  'Wholesale & Distribution',
  'Services & Consulting',
  'Art & Handcrafts',
];

export function BusinessIdentityCard({ data, onChange, disabled = false }: BusinessIdentityCardProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary shrink-0">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display">Business Identity</CardTitle>
            <CardDescription className="text-xs text-muted">
              Logo, business name, username/handle, category, and description.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        {/* Logo File Upload Component */}
        <LogoUploader
          logoUrl={data.logoUrl}
          businessName={data.businessName}
          onChange={(url) => onChange('logoUrl', url)}
          disabled={disabled}
        />

        {/* Business Names & Handle Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            name="businessName"
            label="Business Name"
            value={data.businessName}
            onChange={(e) => onChange('businessName', e.target.value)}
            disabled={disabled}
            placeholder="e.g. Accra Apparel Ltd"
            required
          />

          <FormField
            name="tradingName"
            label="Trading Name / DBA (Optional)"
            value={data.tradingName}
            onChange={(e) => onChange('tradingName', e.target.value)}
            disabled={disabled}
            placeholder="e.g. Accra Apparel"
          />

          <div className="space-y-1.5">
            <label htmlFor="handle" className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Username / Handle</span>
              <span className="text-[10px] font-mono text-muted">@{data.handle || 'handle'}</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs font-mono font-bold text-muted select-none">@</span>
              <input
                id="handle"
                type="text"
                value={data.handle}
                onChange={(e) => onChange('handle', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                disabled={disabled}
                placeholder="handle"
                className="w-full rounded-xl border border-separator bg-surface pl-7 pr-3 py-2 text-xs font-mono transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="category" className="text-xs font-semibold text-foreground">
              Business Category
            </label>
            <select
              id="category"
              value={data.category}
              onChange={(e) => onChange('category', e.target.value)}
              disabled={disabled}
              className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-50 cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Short Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="description" className="text-xs font-semibold text-foreground">
              Description
            </label>
            <span className="text-[10px] text-muted">{data.description.length}/150</span>
          </div>
          <textarea
            id="description"
            rows={2}
            maxLength={150}
            value={data.description}
            onChange={(e) => onChange('description', e.target.value)}
            disabled={disabled}
            placeholder="Short overview of your business..."
            className="w-full rounded-xl border border-separator bg-surface p-3 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-50 resize-none"
          />
        </div>
      </CardBody>
    </Card>
  );
}
