'use client';

import React from 'react';

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
        <h2 className="text-xl font-bold text-foreground">Tell us about your business</h2>
        <p className="text-sm text-muted mt-1">
          We will set up your workspace and create your custom storefront URL.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5">
          Store or Trading Name
        </label>
        <input
          type="text"
          value={storeName}
          onChange={(e) => onStoreNameChange(e.target.value)}
          placeholder="e.g. Glamour Haven Gh"
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-separator bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5">
          Storefront Web Address (Subdomain)
        </label>
        <div className="flex items-center">
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
            placeholder="glamour-haven"
            className="w-full px-3.5 py-2.5 text-sm rounded-l-xl border border-r-0 border-separator bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
          />
          <span className="inline-flex items-center px-3 py-2.5 text-xs font-semibold text-muted bg-surface-elevated border border-separator rounded-r-xl whitespace-nowrap">
            .merchander.store
          </span>
        </div>
        <p className="text-[11px] text-brand-primary font-mono mt-1">
          Preview: https://{slug || '[store]'}.merchander.store
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Primary Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-separator bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
          >
            <option value="GHS">Ghana Cedi (GH₵ - GHS)</option>
            <option value="USD">US Dollar ($ - USD)</option>
            <option value="EUR">Euro (€ - EUR)</option>
            <option value="GBP">British Pound (£ - GBP)</option>
            <option value="NGN">Nigerian Naira (₦ - NGN)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Operational City
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-separator bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
          >
            <option value="Accra">Greater Accra (Accra, Tema)</option>
            <option value="Kumasi">Ashanti Region (Kumasi)</option>
            <option value="Takoradi">Western Region (Takoradi)</option>
            <option value="Tamale">Northern Region (Tamale)</option>
            <option value="Other">Other / Nationwide</option>
          </select>
        </div>
      </div>
    </div>
  );
}
