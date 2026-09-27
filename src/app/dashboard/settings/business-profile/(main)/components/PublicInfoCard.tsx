'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Share2, Copy, Check, ExternalLink, Clock } from 'lucide-react';
import { BusinessPublicInfoData, BusinessSocialLinks } from '@/types/settings';
import { toast } from 'sonner';
import { CustomDomainSection } from './CustomDomainSection';

interface PublicInfoCardProps {
  data: BusinessPublicInfoData;
  onChangeSocial: (field: keyof BusinessSocialLinks, value: string) => void;
  onChangeServiceAreas: (value: string) => void;
  onChangeCustomDomain: (value: string) => void;
  disabled?: boolean;
}

export function PublicInfoCard({
  data,
  onChangeSocial,
  onChangeServiceAreas,
  onChangeCustomDomain,
  disabled = false,
}: PublicInfoCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!data.storefrontUrl) return;
    try {
      await navigator.clipboard.writeText(data.storefrontUrl);
      setCopied(true);
      toast.success('Storefront link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary shrink-0">
            <Share2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display">Public Information</CardTitle>
            <CardDescription className="text-xs text-muted">
              Storefront URL, social profiles, business hours, and delivery coverage.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        {/* Storefront URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground block">Storefront URL</label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 rounded-xl border border-separator bg-surface px-3 py-2 text-xs font-mono text-foreground truncate select-all">
              {data.storefrontUrl || 'https://yourstore.merchander.app'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-separator text-xs font-semibold text-foreground hover:bg-surface-elevated active:scale-95 transition-all cursor-pointer shadow-2xs"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
              {data.storefrontUrl && (
                <a
                  href={data.storefrontUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 active:scale-95 transition-all shadow-2xs"
                >
                  <span>Open</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Custom Domain Section */}
        <CustomDomainSection
          customDomain={data.customDomain || ''}
          onChange={onChangeCustomDomain}
          disabled={disabled}
        />

        {/* Social Links */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground block">Social Links</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(['instagram', 'tiktok', 'twitter', 'facebook'] as const).map((platform) => (
              <div key={platform} className="space-y-1">
                <span className="text-[11px] font-medium text-muted capitalize">
                  {platform === 'twitter' ? 'X / Twitter' : platform}
                </span>
                <input
                  id={platform}
                  type="text"
                  value={data.socials[platform]}
                  onChange={(e) => onChangeSocial(platform, e.target.value)}
                  disabled={disabled}
                  placeholder={platform === 'facebook' ? 'facebook.com/yourbrand' : '@yourbrand'}
                  className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs font-mono transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-50"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-separator/50" />

        {/* Service Areas & Business Hours */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="serviceAreas" className="text-xs font-semibold text-foreground block">
              Service / Delivery Areas
            </label>
            <input
              id="serviceAreas"
              type="text"
              value={data.serviceAreas}
              onChange={(e) => onChangeServiceAreas(e.target.value)}
              disabled={disabled}
              placeholder="e.g. Greater Accra, Kumasi, Nationwide"
              className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">Business Hours</label>
            <div className="flex flex-col md:flex-row gap-1.5 md:gap-0 md:items-center justify-between p-2.5 rounded-xl border border-separator bg-surface text-xs">
              <div className="flex items-center gap-2 text-muted">
                <Clock size={14} className="text-brand-primary" />
                <span>{data.businessHoursSummary || 'Operating Schedule'}</span>
              </div>
              <Link
                href="/dashboard/settings/hours"
                className="text-xs font-semibold text-brand-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Edit Hours</span>
                <ExternalLink size={11} />
              </Link>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
