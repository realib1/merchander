'use client';

import React, { useMemo } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { validateStoreSlug } from '@/utils/business-modules';

interface BusinessSlugInputProps {
  slug: string;
  setSlug: (slug: string) => void;
}

export function BusinessSlugInput({ slug, setSlug }: BusinessSlugInputProps) {
  const slugValidation = useMemo(() => {
    if (!slug) return null;
    return validateStoreSlug(slug);
  }, [slug]);

  const handleSlugInput = (val: string) => {
    const sanitized = val
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
    setSlug(sanitized);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-foreground">Storefront address</label>
        {slugValidation && slugValidation.valid && (
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>Available</span>
          </span>
        )}
      </div>

      <div
        className={`rounded-xl border bg-background flex items-center transition-all shadow-2xs focus-within:ring-2 ${
          slugValidation && !slugValidation.valid
            ? 'border-destructive/60 focus-within:border-destructive focus-within:ring-destructive/20'
            : 'border-separator focus-within:border-brand-primary focus-within:ring-brand-primary/20'
        }`}
      >
        <span className="pl-3.5 text-xs text-muted/60 select-none font-mono tracking-tight shrink-0">https://</span>
        <input
          type="text"
          value={slug}
          onChange={(e) => handleSlugInput(e.target.value)}
          placeholder="your-store"
          className="w-full py-2.5 px-0.5 bg-transparent border-0 outline-none text-sm font-mono font-medium text-foreground placeholder:text-muted/40 min-w-0"
        />
        <span className="pr-3.5 pl-1 text-xs font-mono font-medium text-muted select-none shrink-0">
          .merchander.store
        </span>
      </div>

      {slugValidation && !slugValidation.valid ? (
        <p className="text-[11px] text-destructive flex items-center gap-1 mt-1">
          <AlertCircle size={11} className="shrink-0" />
          <span>{slugValidation.error}</span>
        </p>
      ) : (
        <p className="text-[11px] text-muted font-mono mt-1">
          Customers will visit your store at https://{slug || 'your-store'}.merchander.store
        </p>
      )}
    </div>
  );
}
