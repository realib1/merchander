'use client';

import React from 'react';
import { StorefrontConfig } from '@/types/storefront';
import { MessageCircle, ShieldCheck, Truck, ShoppingBag, ExternalLink } from 'lucide-react';

function InstagramIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface StoreHeaderProps {
  config: StorefrontConfig;
}

export function StoreHeader({ config }: StoreHeaderProps) {
  const whatsappLink = config.whatsapp_phone
    ? `https://wa.me/${config.whatsapp_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        `Hello ${config.store_name}, I am browsing your online storefront!`
      )}`
    : null;

  return (
    <header className="w-full bg-surface border-b border-separator/80 overflow-hidden shadow-xs">
      {/* Banner */}
      <div className="h-36 sm:h-48 w-full bg-linear-to-r from-brand-primary/25 via-brand-secondary/25 to-info/25 relative overflow-hidden">
        {config.banner_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={config.banner_url} alt={`${config.store_name} Banner`} className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
          {/* Logo & Store Names */}
          <div className="flex items-end gap-3.5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-surface bg-surface-elevated shadow-md flex items-center justify-center overflow-hidden shrink-0">
              {config.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.logo_url} alt={`${config.store_name} Logo`} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag size={32} className="text-brand-primary" />
              )}
            </div>

            <div className="pb-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{config.store_name}</h1>
                <span title="Verified Merchant" className="inline-flex">
                  <ShieldCheck size={18} className="text-brand-primary shrink-0" />
                </span>
              </div>
              {config.tagline && <p className="text-xs sm:text-sm text-muted font-medium mt-0.5">{config.tagline}</p>}
            </div>
          </div>

          {/* Social Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-success text-white text-xs font-semibold hover:bg-success/90 cursor-pointer transition flex items-center gap-1.5 shadow-xs"
              >
                <MessageCircle size={14} />
                <span>Chat on WhatsApp</span>
              </a>
            )}

            {config.instagram_handle && (
              <a
                href={`https://instagram.com/${config.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-surface-elevated border border-separator text-xs font-semibold text-foreground hover:bg-surface-elevated/80 cursor-pointer transition flex items-center gap-1.5"
              >
                <InstagramIcon size={14} className="text-brand-primary" />
                <span>@{config.instagram_handle}</span>
                <ExternalLink size={11} className="text-muted" />
              </a>
            )}
          </div>
        </div>

        {/* Bio & Delivery Info */}
        {config.bio && (
          <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed max-w-2xl mt-2">{config.bio}</p>
        )}

        {config.delivery_policy && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-elevated border border-separator/60 text-xs text-muted">
            <Truck size={13} className="text-info shrink-0" />
            <span>{config.delivery_policy}</span>
          </div>
        )}
      </div>
    </header>
  );
}
