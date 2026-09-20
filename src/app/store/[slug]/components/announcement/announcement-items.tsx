import React from 'react';
import { PreorderBatch } from '@/types/preorder';
import { getBatchBannerInfo } from '@/utils/preorder-batch';
import { Clock, Truck, Package, Megaphone } from 'lucide-react';

export interface BannerItem {
  id: string;
  icon: React.ReactNode;
  badge: string;
  headline: string;
  subtext: string;
  actionText: string;
  onAction?: () => void;
  urgency: 'high' | 'medium' | 'normal';
}

export function buildBannerItems({
  batches = [],
  announcementHeadline,
  announcementText,
  onShopPreorders,
  onTrackOrder,
  onAnnouncementClick,
}: {
  batches?: PreorderBatch[];
  announcementHeadline?: string | null;
  announcementText?: string | null;
  onShopPreorders?: () => void;
  onTrackOrder?: () => void;
  onAnnouncementClick?: () => void;
}): BannerItem[] {
  const items: BannerItem[] = [];

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

  if (announcementHeadline || announcementText) {
    items.push({
      id: 'merchant-announcement',
      icon: <Megaphone size={14} className="shrink-0 text-brand-primary" />,
      badge: 'Announcement',
      headline: announcementHeadline || 'Store Notice',
      subtext: announcementText || '',
      actionText: 'Explore',
      onAction: onAnnouncementClick,
      urgency: 'normal',
    });
  }

  return items;
}
