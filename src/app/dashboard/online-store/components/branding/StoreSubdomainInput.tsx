'use client';

import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Link } from 'lucide-react';
import { generateStoreSlug } from '@/utils/storefront';
import { ROOT_DOMAIN } from '@/utils/domain';

interface StoreSubdomainInputProps {
  slug: string;
  storeName: string;
  primaryColor: string;
  onSlugChange: (val: string) => void;
}

export function StoreSubdomainInput({
  slug,
  storeName,
  primaryColor,
  onSlugChange,
}: StoreSubdomainInputProps) {
  const [copied, setCopied] = useState(false);
  const cleanSlug = slug.trim().toLowerCase();
  const fullSubdomainUrl = `https://${cleanSlug || 'store'}.${ROOT_DOMAIN}`;
  const isValidSlug = cleanSlug.length >= 3 && !cleanSlug.endsWith('-') && !cleanSlug.startsWith('-');

  const handleCopy = () => {
    navigator.clipboard.writeText(fullSubdomainUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAutoGenerate = () => {
    if (!storeName.trim()) return;
    const generated = generateStoreSlug(storeName);
    if (generated) onSlugChange(generated);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <span>Store Subdomain URL</span>
          <span className="text-destructive">*</span>
        </label>
        {storeName.trim() && (
          <button
            type="button"
            onClick={handleAutoGenerate}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-foreground transition cursor-pointer hover:underline"
            title="Generate URL handle from store name"
          >
            <Link size={11} style={{ color: primaryColor }} />
            <span>Auto-generate</span>
          </button>
        )}
      </div>

      <div className="flex items-center bg-surface-elevated border border-separator rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-brand-primary focus-within:border-brand-primary transition shadow-2xs">
        <span className="text-[11px] text-muted px-2.5 sm:px-3 py-2 bg-surface/60 border-r border-separator select-none font-mono">
          https://
        </span>
        <input
          type="text"
          required
          value={slug}
          onChange={(e) => {
            const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
            onSlugChange(sanitized);
          }}
          placeholder="yourstore"
          className="flex-1 min-w-0 bg-transparent px-3 py-2 text-xs font-mono font-medium text-foreground placeholder:text-muted outline-none"
        />
        <span className="text-[11px] text-muted px-2.5 sm:px-3 py-2 bg-surface/60 border-l border-separator select-none font-mono">
          .{ROOT_DOMAIN}
        </span>
      </div>

      {/* Live URL bar & quick actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full ${isValidSlug ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="text-muted truncate font-mono text-[11px]">{fullSubdomainUrl}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-muted hover:text-foreground transition cursor-pointer px-2 py-0.5 rounded-md hover:bg-surface-elevated"
            title="Copy full store URL"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {cleanSlug && (
            <a
              href={`/store/${cleanSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-brand-primary hover:opacity-80 transition font-semibold px-2 py-0.5 rounded-md hover:bg-brand-primary/10"
              title="Preview storefront in new tab"
            >
              <span>Visit</span>
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
