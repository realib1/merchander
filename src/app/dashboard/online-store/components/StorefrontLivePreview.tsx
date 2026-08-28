'use client';

import React from 'react';
import { MessageCircle, ShieldCheck, ShoppingBag } from 'lucide-react';

function InstagramIcon({ size = 12, className }: { size?: number; className?: string }) {
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

interface StorefrontLivePreviewProps {
  storeName: string;
  tagline: string;
  bio: string;
  bannerUrl: string;
  logoUrl: string;
  whatsappPhone: string;
  instagramHandle: string;
  isActive: boolean;
}

export function StorefrontLivePreview({
  storeName,
  tagline,
  bio,
  bannerUrl,
  logoUrl,
  whatsappPhone,
  instagramHandle,
  isActive,
}: StorefrontLivePreviewProps) {
  const displayName = storeName || 'Your Store Name';
  const displayTagline = tagline || 'Curated fashion & beauty products';

  return (
    <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-4">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Mobile Live Preview</h3>
        <span className="text-[11px] text-muted">Updates in real-time</span>
      </div>

      {/* Mobile Mockup Frame */}
      <div className="w-full max-w-70 bg-background border-4 border-separator/80 rounded-4xl overflow-hidden shadow-xl flex flex-col select-none relative">
        {/* Notch / Speaker */}
        <div className="w-full bg-surface-elevated pt-2.5 pb-1 flex justify-center items-center border-b border-separator/40">
          <div className="w-16 h-2.5 bg-separator rounded-full" />
        </div>

        {/* Scrollable Store Content */}
        <div className="flex-1 overflow-y-auto max-h-105 custom-scrollbar pb-6 bg-background">
          {/* Banner */}
          <div className="h-20 w-full bg-linear-to-r from-brand-primary/20 via-brand-secondary/20 to-info/20 relative overflow-hidden">
            {bannerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerUrl} alt="Banner preview" className="w-full h-full object-cover" />
            )}
          </div>

          {/* Logo & Store Title */}
          <div className="px-3 -mt-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full border-2 border-background bg-surface-elevated shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag size={18} className="text-brand-primary" />
              )}
            </div>

            <div className="mt-1.5 flex items-center gap-1">
              <span className="text-xs font-bold text-foreground truncate max-w-45">{displayName}</span>
              <ShieldCheck size={12} className="text-brand-primary shrink-0" />
            </div>

            <p className="text-[10px] text-muted line-clamp-1 mt-0.5">{displayTagline}</p>
            {bio && <p className="text-[9px] text-muted/80 line-clamp-2 mt-1 px-1">{bio}</p>}

            {/* Quick Action Badges */}
            <div className="flex items-center justify-center gap-1.5 mt-2.5 w-full">
              {whatsappPhone && (
                <div className="px-2 py-1 rounded-full bg-success/15 text-success text-[9px] font-bold flex items-center gap-1">
                  <MessageCircle size={10} /> WhatsApp
                </div>
              )}
              {instagramHandle && (
                <div className="px-2 py-1 rounded-full bg-brand-primary/15 text-brand-primary text-[9px] font-bold flex items-center gap-1">
                  <InstagramIcon size={10} /> @{instagramHandle}
                </div>
              )}
            </div>
          </div>

          {/* Catalog Mock Grid */}
          <div className="mt-4 px-2.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-muted mb-2">
              <span>Catalog</span>
              <span>All Items</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-surface border border-separator/60 p-1.5 space-y-1">
                <div className="h-14 bg-surface-elevated rounded-md flex items-center justify-center text-muted text-[9px]">
                  Product Image
                </div>
                <div className="text-[10px] font-semibold text-foreground truncate">Sample Product</div>
                <div className="text-[9px] font-bold text-brand-primary">₵ 120.00</div>
              </div>
              <div className="rounded-lg bg-surface border border-separator/60 p-1.5 space-y-1">
                <div className="h-14 bg-surface-elevated rounded-md flex items-center justify-center text-muted text-[9px]">
                  Product Image
                </div>
                <div className="text-[10px] font-semibold text-foreground truncate">Best Seller</div>
                <div className="text-[9px] font-bold text-brand-primary">₵ 250.00</div>
              </div>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="py-1 px-3 bg-surface-elevated border-t border-separator/40 text-center">
          <span className="text-[9px] font-medium text-muted">
            {isActive ? '🟢 Storefront is Active' : '🔴 Storefront is Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}
