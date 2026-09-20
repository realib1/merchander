'use client';

import React from 'react';
import { BusinessSlugInput } from './BusinessSlugInput';
import { BusinessCitySelector } from './BusinessCitySelector';

interface StepBusinessProfileProps {
  storeName: string;
  onStoreNameChange: (val: string) => void;
  slug: string;
  setSlug: (val: string) => void;
  currency: string;
  setCurrency: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
}

export function StepBusinessProfile({
  storeName,
  onStoreNameChange,
  slug,
  setSlug,
  currency,
  setCurrency,
  city,
  setCity,
}: StepBusinessProfileProps) {
  return (
    <div className="space-y-4 animate-in fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">Store profile</h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Tell us about your business and claim your storefront address.
        </p>
      </div>

      <div className="space-y-4 pt-1">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-foreground">Store or business name</label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => onStoreNameChange(e.target.value)}
            placeholder="e.g. Glamour Haven"
            className="w-full px-3.5 py-2.5 rounded-xl border border-separator bg-background text-foreground placeholder:text-muted/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-medium transition-all shadow-2xs"
          />
        </div>

        <BusinessSlugInput slug={slug} setSlug={setSlug} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 items-start">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-separator bg-background text-foreground focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-medium transition-all shadow-2xs cursor-pointer"
            >
              <option value="GHS">Ghana Cedi (GH₵)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
              <option value="GBP">British Pound (£)</option>
              <option value="NGN">Nigerian Naira (₦)</option>
            </select>
          </div>

          <BusinessCitySelector city={city} setCity={setCity} />
        </div>
      </div>
    </div>
  );
}
