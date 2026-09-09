'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { CreatedCredentials } from './types';
import { formatMerchantCredentials } from '@/utils/merchant-provisioning';

interface ProvisioningSuccessCardProps {
  tenantId: string;
  credentials: CreatedCredentials;
  onDone: () => void;
}

export function ProvisioningSuccessCard({
  tenantId,
  credentials,
  onDone,
}: ProvisioningSuccessCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const formatted = formatMerchantCredentials({
      businessName: credentials.storeName,
      storeUrl: credentials.subdomainUrl,
      ownerEmail: credentials.ownerEmail,
      temporaryPassword: credentials.temporaryPassword,
      loginUrl: credentials.portalUrl,
    });

    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-5 py-1">
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-y-1">
        <div className="flex items-center gap-2 font-bold text-sm">
          <Check size={16} />
          <span>Workspace Created & Ready for Handoff</span>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          The tenant workspace, owner credentials, primary store branch, storefront settings, and subscription tier have been atomically initialized.
        </p>
      </div>

      <div className="bg-surface border border-separator rounded-xl p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-separator/60 pb-2">
          <span className="text-muted font-medium">Merchant Business:</span>
          <span className="text-foreground font-bold">{credentials.storeName}</span>
        </div>
        <div className="flex items-center justify-between border-b border-separator/60 pb-2">
          <span className="text-muted font-medium">Storefront URL:</span>
          <a
            href={credentials.subdomainUrl}
            target="_blank"
            rel="noreferrer"
            className="text-brand hover:underline inline-flex items-center gap-1 font-bold"
          >
            {credentials.subdomainUrl}
            <ExternalLink size={12} />
          </a>
        </div>
        <div className="flex items-center justify-between border-b border-separator/60 pb-2">
          <span className="text-muted font-medium">Owner Login Email:</span>
          <span className="text-foreground">{credentials.ownerEmail}</span>
        </div>
        <div className="flex items-center justify-between border-b border-separator/60 pb-2">
          <span className="text-muted font-medium">Temporary Password:</span>
          <span className="text-amber-400 font-bold select-all bg-amber-400/10 px-2 py-0.5 rounded">
            {credentials.temporaryPassword}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted font-medium">Subscription Tier:</span>
          <span className="uppercase text-brand font-bold">{credentials.tier}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
        <button
          type="button"
          onClick={handleCopy}
          className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
            copied
              ? 'bg-emerald-500 text-white'
              : 'bg-brand text-brand-foreground hover:bg-brand/90'
          }`}
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied Credentials to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy Credentials for Merchant</span>
            </>
          )}
        </button>

        <Link
          href={`/platform/merchants/${tenantId}`}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold bg-surface border border-separator text-foreground hover:bg-surface/80 transition cursor-pointer"
        >
          <span>Inspect in Platform</span>
          <ExternalLink size={13} />
        </Link>

        <button
          type="button"
          onClick={onDone}
          className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface transition cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}
