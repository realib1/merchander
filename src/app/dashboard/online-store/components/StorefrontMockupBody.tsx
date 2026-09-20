import React from 'react';
import { MessageCircle, BadgeCheck, ShoppingBag } from 'lucide-react';
import { getBusinessInitials } from '@/utils/format';

function InstagramIcon({ size = 11, className }: { size?: number; className?: string }) {
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

export interface StorefrontMockupBodyProps {
  displayName: string;
  displayTagline: string;
  bio: string;
  logoUrl: string;
  bannerUrl?: string;
  heroMode?: 'banner' | 'featured_product' | 'default';
  bannerHeadline?: string;
  whatsappPhone: string;
  instagramHandle: string;
  primaryColor: string;
}

export function StorefrontMockupBody({
  displayName,
  displayTagline,
  bio,
  logoUrl,
  bannerUrl,
  heroMode = 'default',
  bannerHeadline,
  whatsappPhone,
  instagramHandle,
  primaryColor,
}: StorefrontMockupBodyProps) {
  return (
    <div className="flex-1 overflow-y-auto max-h-[350px] custom-scrollbar pb-4 bg-background text-[11px]">
      {bannerUrl && heroMode === 'banner' ? (
        <div className="h-20 w-full relative overflow-hidden bg-surface-elevated">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bannerUrl} alt="Banner preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-1.5">
            <span className="text-[9px] font-bold text-white leading-tight line-clamp-1">
              {bannerHeadline || displayName}
            </span>
          </div>
        </div>
      ) : (
        <div
          className="h-16 w-full relative overflow-hidden transition-colors duration-300"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}40 0%, ${primaryColor}15 50%, transparent 100%)`,
          }}
        />
      )}

      <div className="px-2.5 -mt-6 flex flex-col items-center text-center">
        <div
          className="w-12 h-12 rounded-xl border-2 border-background bg-surface-elevated shadow-sm flex items-center justify-center overflow-hidden shrink-0 transition-colors duration-300"
          style={{ borderColor: primaryColor, backgroundColor: logoUrl ? undefined : primaryColor }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-base font-bold font-display text-white select-none">
              {getBusinessInitials(displayName)}
            </span>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-1">
          <span className="text-[11px] font-bold text-foreground truncate max-w-36">{displayName}</span>
          <BadgeCheck size={12} style={{ color: primaryColor }} className="shrink-0" />
        </div>

        <p className="text-[9px] text-muted line-clamp-1 mt-0.5">{displayTagline}</p>
        {bio && <p className="text-[8.5px] text-muted/80 line-clamp-2 mt-0.5 px-1">{bio}</p>}

        <div className="flex items-center justify-center gap-1 mt-2 w-full flex-wrap">
          {whatsappPhone && (
            <div className="px-1.5 py-0.5 rounded-full bg-success/15 text-success text-[8.5px] font-bold flex items-center gap-0.5">
              <MessageCircle size={9} /> WhatsApp
            </div>
          )}
          {instagramHandle && (
            <div
              className="px-1.5 py-0.5 rounded-full text-[8.5px] font-bold flex items-center gap-0.5"
              style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
            >
              <InstagramIcon size={9} /> @{instagramHandle}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 px-2.5 space-y-1.5">
        <div className="flex items-center justify-between text-[9px] font-semibold text-muted">
          <span>Live Catalog</span>
          <span className="text-[8.5px] font-bold" style={{ color: primaryColor }}>Synced</span>
        </div>
        <div className="p-2 rounded-lg border border-dashed border-separator bg-surface-elevated/30 text-center space-y-0.5">
          <ShoppingBag size={13} className="mx-auto" style={{ color: primaryColor }} />
          <p className="text-[9px] font-bold text-foreground">Catalog Linked</p>
          <p className="text-[8px] text-muted leading-tight">Published products sync automatically.</p>
        </div>
      </div>
    </div>
  );
}
