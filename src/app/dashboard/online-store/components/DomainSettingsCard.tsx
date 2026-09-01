'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Globe, Copy, Check, ExternalLink, RefreshCw, Trash2, BadgeCheck, AlertTriangle, Clock } from 'lucide-react';
import { CustomDomainConfig } from '@/types/storefront';
import { verifyCustomDomain, removeCustomDomain } from '@/app/actions/storefront-domain';
import { getStorefrontSubdomainUrl, getDnsHostRecord } from '@/utils/domain';
import { toast } from 'sonner';

interface DomainSettingsCardProps {
  slug: string;
  initialDomainConfig: CustomDomainConfig | null;
}

export function DomainSettingsCard({ slug, initialDomainConfig }: DomainSettingsCardProps) {
  const [domainConfig, setDomainConfig] = useState<CustomDomainConfig | null>(initialDomainConfig);
  const [domainInput, setDomainInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const defaultUrl = getStorefrontSubdomainUrl(slug);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = (targetDomain?: string) => {
    const toCheck = targetDomain || domainInput || domainConfig?.domain;
    if (!toCheck) {
      toast.error('Please enter a custom domain');
      return;
    }

    startTransition(async () => {
      try {
        const res = await verifyCustomDomain(toCheck);
        if (res.error) {
          toast.error(res.error);
        } else if (res.config) {
          setDomainConfig(res.config);
          setDomainInput('');
          toast[res.config.status === 'valid' ? 'success' : 'info'](
            res.config.status === 'valid'
              ? 'Custom domain verified and active!'
              : 'Domain saved. Waiting for DNS propagation.'
          );
        }
      } catch (err) {
        console.error('Domain verify error:', err);
        toast.error('Failed to verify domain DNS');
      }
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      try {
        const res = await removeCustomDomain();
        if (res.error) {
          toast.error(res.error);
        } else {
          setDomainConfig(null);
          toast.success('Custom domain removed');
        }
      } catch (err) {
        console.error('Domain remove error:', err);
        toast.error('Failed to remove custom domain');
      }
    });
  };

  const dnsRecord = domainConfig ? getDnsHostRecord(domainConfig.domain) : null;

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary shrink-0">
            <Globe className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display">Storefront Domains</CardTitle>
            <CardDescription className="text-xs text-muted">
              Default system subdomain and custom domain routing for your live storefront.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-6">
        {/* 1. Default System Subdomain Card */}
        <div className="p-4 rounded-xl border border-separator bg-surface space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Default Subdomain</span>
              <Badge variant="success" size="sm" dot>
                Active
              </Badge>
            </div>
            <span className="text-[11px] text-muted font-mono">Zero Configuration</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 rounded-xl border border-separator bg-surface-elevated px-3 py-2 text-xs font-mono text-foreground truncate select-all">
              {defaultUrl}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(defaultUrl)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-separator text-xs font-semibold text-foreground hover:bg-surface-elevated transition cursor-pointer shadow-2xs"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <a
                href={defaultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 transition shadow-2xs"
              >
                <span>Visit</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* 2. Custom Domain (Vercel-Style) */}
        <div className="p-4 rounded-xl border border-separator bg-surface space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-foreground">Custom Domain</h3>
              <p className="text-[11px] text-muted">
                Connect your own branded domain (e.g. <span className="font-mono text-foreground">shop.brand.com</span>)
              </p>
            </div>
            {domainConfig && (
              <Badge
                variant={
                  domainConfig.status === 'valid'
                    ? 'success'
                    : domainConfig.status === 'pending'
                      ? 'warning'
                      : 'destructive'
                }
                size="sm"
                dot
              >
                {domainConfig.status === 'valid'
                  ? 'Valid Configuration'
                  : domainConfig.status === 'pending'
                    ? 'Pending DNS'
                    : 'Invalid Configuration'}
              </Badge>
            )}
          </div>

          {!domainConfig ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value.toLowerCase().trim())}
                placeholder="shop.yourbrand.com"
                disabled={isPending}
                className="flex-1 rounded-xl border border-separator bg-surface px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-50"
              />
              <Button
                type="button"
                variant="primary"
                onClick={() => handleVerify(domainInput)}
                disabled={isPending || !domainInput.trim()}
                className="text-xs shrink-0"
              >
                {isPending && <RefreshCw size={13} className="animate-spin mr-1" />}
                <span>Add Domain</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-3 rounded-lg bg-surface-elevated border border-separator">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe size={14} className="text-brand-primary shrink-0" />
                  <span className="text-xs font-mono font-bold text-foreground truncate">{domainConfig.domain}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleVerify(domainConfig.domain)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface border border-separator text-xs font-semibold text-foreground hover:bg-surface-elevated transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={isPending ? 'animate-spin' : ''} />
                    <span>Check DNS</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={isPending}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {dnsRecord && (
                <div className="overflow-x-auto rounded-lg border border-separator">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-elevated text-[10px] text-muted uppercase font-semibold border-b border-separator">
                      <tr>
                        <th className="px-3 py-1.5">Type</th>
                        <th className="px-3 py-1.5">Host</th>
                        <th className="px-3 py-1.5">Target</th>
                        <th className="px-3 py-1.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-separator font-mono text-[11px]">
                      <tr>
                        <td className="px-3 py-2 font-bold text-brand-primary">{dnsRecord.type}</td>
                        <td className="px-3 py-2 text-foreground">{dnsRecord.host}</td>
                        <td className="px-3 py-2 text-foreground break-all">{dnsRecord.target}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`font-sans font-semibold text-[11px] inline-flex items-center gap-1 ${domainConfig.status === 'valid' ? 'text-emerald-500' : 'text-amber-500'}`}
                          >
                            {domainConfig.status === 'valid' ? <BadgeCheck size={12} /> : <Clock size={12} />}
                            {domainConfig.status === 'valid' ? 'Valid' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {domainConfig.errorReason && domainConfig.status !== 'valid' && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-amber-600 dark:text-amber-400 text-xs">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  <p className="leading-tight text-[11px]">{domainConfig.errorReason}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
