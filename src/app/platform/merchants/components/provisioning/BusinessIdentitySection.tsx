'use client';

import React from 'react';
import { Store, Globe } from 'lucide-react';

interface BusinessIdentitySectionProps {
  storeName: string;
  slug: string;
  city: string;
  branchName: string;
  onStoreNameChange: (val: string) => void;
  onSlugChange: (val: string) => void;
  onCityChange: (val: string) => void;
  onBranchNameChange: (val: string) => void;
}

export function BusinessIdentitySection({
  storeName,
  slug,
  city,
  branchName,
  onStoreNameChange,
  onSlugChange,
  onCityChange,
  onBranchNameChange,
}: BusinessIdentitySectionProps) {
  return (
    <div className="space-y-3">
      <div className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
        <Store size={13} />
        <span>1. Business Details & Web Storefront</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="font-semibold text-secondary block text-xs">
            Store / Trading Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Abena's Fashion Hub"
            value={storeName}
            onChange={(e) => onStoreNameChange(e.target.value)}
            className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-secondary block text-xs">
            Subdomain Slug <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="abenas-fashion"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand font-mono text-xs"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface/70 border border-separator/70 text-muted font-mono text-[11px]">
        <Globe size={13} className="text-brand shrink-0" />
        <span>Live URL:</span>
        <span className="text-foreground font-semibold">
          https://{slug || 'your-store'}.merchander.app
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="font-semibold text-secondary block text-xs">Primary Branch City</label>
          <select
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand text-xs"
          >
            <option value="Accra">Accra (Greater Accra)</option>
            <option value="Kumasi">Kumasi (Ashanti)</option>
            <option value="Takoradi">Sekondi-Takoradi (Western)</option>
            <option value="Tamale">Tamale (Northern)</option>
            <option value="Sunyani">Sunyani (Bono)</option>
            <option value="Cape Coast">Cape Coast (Central)</option>
            <option value="Tema">Tema (Greater Accra)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-secondary block text-xs">Primary Branch Name</label>
          <input
            type="text"
            placeholder={storeName ? `${storeName} - Main Branch` : 'Main Branch'}
            value={branchName}
            onChange={(e) => onBranchNameChange(e.target.value)}
            className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-foreground focus:outline-hidden focus:border-brand text-xs"
          />
        </div>
      </div>
    </div>
  );
}
