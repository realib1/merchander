import React from 'react';
import { MessageCircle, BadgeCheck, ShoppingBag } from 'lucide-react';
import { getBusinessInitials } from '@/utils/format';

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
  logoUrl: string;
  bannerUrl?: string;
  heroMode?: 'banner' | 'featured_product' | 'default';
  bannerHeadline?: string;
  whatsappPhone: string;
  instagramHandle: string;
  primaryColor?: string;
  isActive: boolean;
}

export function StorefrontLivePreview({
  storeName,
  tagline,
  bio,
  logoUrl,
  bannerUrl,
  heroMode = 'default',
  bannerHeadline,
  whatsappPhone,
  instagramHandle,
  primaryColor = '#3b82f6',
  isActive,
}: StorefrontLivePreviewProps) {
  const displayName = storeName || 'Your Store Name';
  const displayTagline = tagline || 'Curated fashion & beauty products';

  return (
    <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs flex flex-col items-center sticky top-6">
      <div className="flex items-center justify-between w-full mb-4">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Live Mockup Preview</h3>
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
          {/* Hero Banner or Gradient */}
          {bannerUrl && heroMode === 'banner' ? (
            <div className="h-24 w-full relative overflow-hidden bg-surface-elevated">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bannerUrl} alt="Banner preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent flex items-end p-2">
                <span className="text-[10px] font-bold text-white leading-tight line-clamp-1">
                  {bannerHeadline || displayName}
                </span>
              </div>
            </div>
          ) : (
            <div
              className="h-20 w-full relative overflow-hidden transition-colors duration-300"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}40 0%, ${primaryColor}15 50%, transparent 100%)`,
              }}
            />
          )}

          {/* Logo & Store Title */}
          <div className="px-3 -mt-8 flex flex-col items-center text-center">
            <div
              className="w-14 h-14 rounded-2xl border-2 border-background bg-surface-elevated shadow-md flex items-center justify-center overflow-hidden shrink-0 transition-colors duration-300"
              style={{
                borderColor: primaryColor,
                backgroundColor: logoUrl ? undefined : primaryColor,
              }}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold font-display text-white select-none">
                  {getBusinessInitials(displayName)}
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-1">
              <span className="text-xs font-bold text-foreground truncate max-w-45">{displayName}</span>
              <BadgeCheck size={13} style={{ color: primaryColor }} className="shrink-0" />
            </div>

            <p className="text-[10px] text-muted line-clamp-1 mt-0.5">{displayTagline}</p>
            {bio && <p className="text-[9px] text-muted/80 line-clamp-2 mt-1 px-1">{bio}</p>}

            {/* Quick Action Badges */}
            <div className="flex items-center justify-center gap-1.5 mt-2.5 w-full flex-wrap">
              {whatsappPhone && (
                <div className="px-2 py-1 rounded-full bg-success/15 text-success text-[9px] font-bold flex items-center gap-1">
                  <MessageCircle size={10} /> WhatsApp
                </div>
              )}
              {instagramHandle && (
                <div
                  className="px-2 py-1 rounded-full text-[9px] font-bold flex items-center gap-1"
                  style={{
                    backgroundColor: `${primaryColor}18`,
                    color: primaryColor,
                  }}
                >
                  <InstagramIcon size={10} /> @{instagramHandle}
                </div>
              )}
            </div>
          </div>

          {/* E-Commerce Catalog Preview Box */}
          <div className="mt-4 px-3 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-semibold text-muted">
              <span>Live Store Catalog</span>
              <span className="text-[9px] font-bold" style={{ color: primaryColor }}>
                Synced
              </span>
            </div>

            <div className="p-3 rounded-xl border border-dashed border-separator bg-surface-elevated/30 text-center space-y-1">
              <ShoppingBag size={16} className="mx-auto" style={{ color: primaryColor }} />
              <p className="text-[10px] font-bold text-foreground">Catalog Linked</p>
              <p className="text-[9px] text-muted leading-tight">
                Your published inventory products will appear with your brand colors.
              </p>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="py-1.5 px-3 bg-surface-elevated border-t border-separator/40 text-center">
          <span className="text-[9px] font-semibold text-muted">
            {isActive ? '🟢 Storefront is Active' : '🔴 Storefront is Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}
