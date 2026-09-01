'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { MapPin } from 'lucide-react';
import { BusinessContactData } from '@/types/settings';

interface BusinessContactCardProps {
  data: BusinessContactData;
  onChange: (field: keyof BusinessContactData, value: string) => void;
  disabled?: boolean;
}

const COUNTRY_OPTIONS = ['Ghana', 'Nigeria', 'Kenya', 'South Africa', 'United Kingdom', 'United States'];

export function BusinessContactCard({ data, onChange, disabled = false }: BusinessContactCardProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary shrink-0">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display">Contact</CardTitle>
            <CardDescription className="text-xs text-muted">
              Business phone, support email, operating address, and website.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="contactPhone" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>Business Phone</span>
            </label>
            <input
              id="contactPhone"
              type="tel"
              value={data.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              disabled={disabled}
              placeholder="e.g. +233 24 123 4567"
              className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs font-mono transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contactEmail" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>Business Email</span>
            </label>
            <input
              id="contactEmail"
              type="email"
              value={data.email}
              onChange={(e) => onChange('email', e.target.value)}
              disabled={disabled}
              placeholder="support@yourstore.com"
              className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="website" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span>Website (Optional)</span>
          </label>
          <input
            id="website"
            type="url"
            value={data.website}
            onChange={(e) => onChange('website', e.target.value)}
            disabled={disabled}
            placeholder="https://yourstore.com"
            className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-50"
          />
        </div>

        <div className="w-full h-px bg-separator/50" />

        {/* Address Fields */}
        <div className="space-y-4">
          <div className="text-xs font-semibold text-foreground">Address / Location</div>
          <FormField
            name="street"
            label="Street Address / Location"
            value={data.street}
            onChange={(e) => onChange('street', e.target.value)}
            disabled={disabled}
            placeholder="e.g. 14 Oxford Street, Osu"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FormField
              name="city"
              label="City"
              value={data.city}
              onChange={(e) => onChange('city', e.target.value)}
              disabled={disabled}
              placeholder="e.g. Accra"
            />

            <FormField
              name="state"
              label="State / Region"
              value={data.state}
              onChange={(e) => onChange('state', e.target.value)}
              disabled={disabled}
              placeholder="e.g. Greater Accra"
            />

            <div className="space-y-1.5">
              <label htmlFor="country" className="text-xs font-semibold text-foreground">
                Country
              </label>
              <select
                id="country"
                value={data.country}
                onChange={(e) => onChange('country', e.target.value)}
                disabled={disabled}
                className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-50 cursor-pointer"
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
