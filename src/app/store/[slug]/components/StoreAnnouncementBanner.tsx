'use client';

import React, { useState, useMemo } from 'react';
import { PreorderBatch } from '@/types/preorder';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { buildBannerItems } from './announcement/announcement-items';

interface StoreAnnouncementBannerProps {
  batches?: PreorderBatch[];
  announcementHeadline?: string | null;
  announcementText?: string | null;
  primaryColor?: string;
  onShopPreorders?: () => void;
  onTrackOrder?: () => void;
  onAnnouncementClick?: () => void;
}

export function StoreAnnouncementBanner({
  batches = [],
  announcementHeadline,
  announcementText,
  primaryColor = '#3b82f6',
  onShopPreorders,
  onTrackOrder,
  onAnnouncementClick,
}: StoreAnnouncementBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return sessionStorage.getItem('merchander_announcement_dismissed') === 'true'; } catch { return false; }
  });

  const bannerItems = useMemo(() => buildBannerItems({
    batches,
    announcementHeadline,
    announcementText,
    onShopPreorders,
    onTrackOrder,
    onAnnouncementClick: onAnnouncementClick || (() => {
      const el = document.getElementById('store-catalog-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }),
  }), [batches, announcementHeadline, announcementText, onShopPreorders, onTrackOrder, onAnnouncementClick]);

  if (isDismissed || bannerItems.length === 0) return null;

  const current = bannerItems[currentIndex] || bannerItems[0];
  const hasMultiple = bannerItems.length > 1;

  const handleDismiss = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsDismissed(true);
    try { sessionStorage.setItem('merchander_announcement_dismissed', 'true'); } catch { /* ignore */ }
  };
  const handleNext = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % bannerItems.length); };
  const handlePrev = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + bannerItems.length) % bannerItems.length); };

  return (
    <aside
      aria-label="Store Announcement"
      role={current.onAction ? 'button' : undefined}
      tabIndex={current.onAction ? 0 : undefined}
      onClick={current.onAction}
      onKeyDown={current.onAction ? (e) => { if (e.key === 'Enter') current.onAction?.(); } : undefined}
      className={`relative z-30 w-full border-b border-separator/70 bg-surface-elevated/95 backdrop-blur-md transition-all text-xs ${
        current.onAction ? 'cursor-pointer hover:bg-surface' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-2 flex items-center justify-between gap-3">
        {/* Main Content Area */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 shrink-0">
            {current.icon}
            <span
              className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                current.urgency === 'high'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
              }`}
            >
              {current.badge}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 truncate">
            <span className="font-bold text-foreground truncate">{current.headline}</span>
            {current.subtext && (
              <>
                <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-muted/60" />
                <span className="text-muted text-[11px] sm:text-xs truncate">{current.subtext}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Button, Pagination & Dismiss */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {current.onAction && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); current.onAction?.(); }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-2xs hover:opacity-90 transition cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <span>{current.actionText}</span>
              <ChevronRight size={12} />
            </button>
          )}

          {hasMultiple && (
            <div className="flex items-center gap-0.5 border border-separator rounded-lg bg-surface px-1 py-0.5">
              <button type="button" onClick={handlePrev} className="p-0.5 text-muted hover:text-foreground transition cursor-pointer" aria-label="Previous announcement">
                <ChevronLeft size={13} />
              </button>
              <span className="text-[10px] font-mono font-semibold px-1 text-muted">{currentIndex + 1}/{bannerItems.length}</span>
              <button type="button" onClick={handleNext} className="p-0.5 text-muted hover:text-foreground transition cursor-pointer" aria-label="Next announcement">
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          <button type="button" onClick={handleDismiss} className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface transition cursor-pointer" aria-label="Dismiss banner">
            <X size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
