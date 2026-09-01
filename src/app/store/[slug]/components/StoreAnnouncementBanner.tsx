'use client';

import React, { useState } from 'react';
import { PreorderBatch } from '@/types/preorder';
import { getBatchBannerInfo } from '@/utils/preorder-batch';
import { Clock, Truck, Package, ChevronRight, ChevronLeft, X, Megaphone } from 'lucide-react';

interface StoreAnnouncementBannerProps {
  batches?: PreorderBatch[];
  announcementHeadline?: string | null;
  announcementText?: string | null;
  primaryColor?: string;
  onShopPreorders?: () => void;
  onTrackOrder?: () => void;
}

export function StoreAnnouncementBanner({
  batches = [],
  announcementHeadline,
  announcementText,
  primaryColor = '#3b82f6',
  onShopPreorders,
  onTrackOrder,
}: StoreAnnouncementBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return sessionStorage.getItem('merchander_announcement_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  // Generate banners list
  const bannerItems = React.useMemo(() => {
    const items: Array<{
      id: string;
      icon: React.ReactNode;
      badge: string;
      headline: string;
      subtext: string;
      actionText: string;
      onAction?: () => void;
      urgency: 'high' | 'medium' | 'normal';
    }> = [];

    // 1. Process active pre-order batches
    batches.forEach((batch) => {
      const info = getBatchBannerInfo(batch);
      let icon = <Clock size={14} className="shrink-0 text-amber-500" />;
      let actionHandler = onShopPreorders;

      if (info.type === 'in_transit') {
        icon = <Truck size={14} className="shrink-0 text-indigo-500" />;
        actionHandler = onTrackOrder;
      } else if (info.type === 'arrived') {
        icon = <Package size={14} className="shrink-0 text-purple-500" />;
        actionHandler = onTrackOrder;
      }

      items.push({
        id: `batch-${batch.id}`,
        icon,
        badge: info.badge,
        headline: info.headline,
        subtext: info.subtext,
        actionText: info.actionText,
        onAction: actionHandler,
        urgency: info.urgency,
      });
    });

    // 2. Add custom merchant announcement if provided
    if (announcementHeadline || announcementText) {
      items.push({
        id: 'merchant-announcement',
        icon: <Megaphone size={14} className="shrink-0 text-brand-primary" />,
        badge: 'Announcement',
        headline: announcementHeadline || 'Store Notice',
        subtext: announcementText || '',
        actionText: 'Learn More',
        onAction: undefined,
        urgency: 'normal',
      });
    }

    return items;
  }, [batches, announcementHeadline, announcementText, onShopPreorders, onTrackOrder]);

  if (isDismissed || bannerItems.length === 0) return null;

  const current = bannerItems[currentIndex] || bannerItems[0];
  const hasMultiple = bannerItems.length > 1;

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('merchander_announcement_dismissed', 'true');
    } catch {
      // Ignore storage errors
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % bannerItems.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + bannerItems.length) % bannerItems.length);
  };

  return (
    <aside
      aria-label="Store Announcement"
      className="relative z-30 w-full border-b border-separator/70 bg-surface-elevated/95 backdrop-blur-md transition-all text-xs"
    >
      <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-2 flex items-center justify-between gap-3">
        {/* Main Content Area */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
          {/* Status Icon & Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {current.icon}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                current.urgency === 'high'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
              }`}
            >
              {current.badge}
            </span>
          </div>

          {/* Headline & Subtext */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 truncate">
            <span className="font-bold text-foreground truncate">{current.headline}</span>
            {current.subtext && (
              <>
                <span className="hidden sm:inline text-muted/60">•</span>
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
              onClick={current.onAction}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-2xs hover:opacity-90 transition cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <span>{current.actionText}</span>
              <ChevronRight size={12} />
            </button>
          )}

          {/* Pagination Controls */}
          {hasMultiple && (
            <div className="flex items-center gap-0.5 border border-separator rounded-lg bg-surface px-1 py-0.5">
              <button
                type="button"
                onClick={handlePrev}
                className="p-0.5 text-muted hover:text-foreground transition cursor-pointer"
                aria-label="Previous announcement"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="text-[10px] font-mono font-semibold px-1 text-muted">
                {currentIndex + 1}/{bannerItems.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="p-0.5 text-muted hover:text-foreground transition cursor-pointer"
                aria-label="Next announcement"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface transition cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
