'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CNAME_TARGET } from '@/utils/domain';

interface CustomDomainSectionProps {
  customDomain: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CustomDomainSection({ customDomain, onChange, disabled = false }: CustomDomainSectionProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor="customDomain" className="text-xs font-semibold text-foreground">
          Custom Domain
        </label>
        <Link
          href="/dashboard/online-store"
          className="text-[11px] font-semibold text-brand-primary hover:underline inline-flex items-center gap-1"
        >
          <span>Manage in Online Store</span>
          <ArrowRight size={11} aria-hidden="true" />
        </Link>
      </div>
      <input
        id="customDomain"
        type="text"
        value={customDomain}
        onChange={(e) => onChange(e.target.value.toLowerCase().trim())}
        disabled={disabled}
        placeholder="shop.yourbrand.com"
        className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs font-mono transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-50"
      />
      <p className="text-[11px] text-muted">
        Connect a custom domain by creating a CNAME record pointing to{' '}
        <span className="font-mono text-foreground font-medium">{CNAME_TARGET}</span>
      </p>
    </div>
  );
}
