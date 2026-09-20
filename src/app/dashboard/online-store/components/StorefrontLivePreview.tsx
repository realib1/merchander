import React from 'react';
import { StorefrontMockupBody } from './StorefrontMockupBody';

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
    <div className="bg-surface border border-separator rounded-2xl p-4 shadow-xs flex flex-col items-center sticky top-6">
      <div className="flex items-center justify-between w-full mb-3">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Live Mockup Preview</h3>
        <span className="text-[10px] text-muted">Real-time</span>
      </div>

      {/* Reduced, Compact Phone Mockup Frame */}
      <div className="w-full max-w-[240px] bg-background border-[3px] border-separator/80 rounded-3xl overflow-hidden shadow-lg flex flex-col select-none relative">
        {/* Notch / Speaker */}
        <div className="w-full bg-surface-elevated pt-2 pb-1 flex justify-center items-center border-b border-separator/40">
          <div className="w-12 h-2 bg-separator rounded-full" />
        </div>

        {/* Scrollable Store Content */}
        <StorefrontMockupBody
          displayName={displayName}
          displayTagline={displayTagline}
          bio={bio}
          logoUrl={logoUrl}
          bannerUrl={bannerUrl}
          heroMode={heroMode}
          bannerHeadline={bannerHeadline}
          whatsappPhone={whatsappPhone}
          instagramHandle={instagramHandle}
          primaryColor={primaryColor}
        />

        {/* Status bar */}
        <div className="py-1 px-2.5 bg-surface-elevated border-t border-separator/40 text-center flex items-center justify-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-success' : 'bg-danger'}`} />
          <span className="text-[9.5px] font-semibold text-muted">
            {isActive ? 'Storefront is Active' : 'Storefront is Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}
