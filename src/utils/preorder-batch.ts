import { PreorderBatch, PreorderBatchStatus, BatchBroadcastRecipient } from '@/types/preorder';
import { format, parseISO, differenceInCalendarDays, differenceInHours, isPast } from 'date-fns';

/**
 * Returns human-readable label for batch status
 */
export function getBatchStatusLabel(status: PreorderBatchStatus): string {
  switch (status) {
    case 'OPEN':
      return 'Pre-Orders Open';
    case 'CLOSING_SOON':
      return 'Closing Soon';
    case 'CLOSED':
      return 'Batch Closed (PO Prep)';
    case 'ORDER_SUBMITTED':
      return 'Supplier Order Submitted';
    case 'IN_TRANSIT':
      return 'In Transit / Cargo Shipped';
    case 'ARRIVED':
      return 'Arrived at Local Hub';
    case 'FULFILLING':
      return 'Packing & Dispatched';
    case 'COMPLETED':
      return 'Completed & Delivered';
    default:
      return status;
  }
}

/**
 * Returns Tailwind color classes for status badges
 */
export function getBatchStatusColor(status: PreorderBatchStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'OPEN':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/20',
      };
    case 'CLOSING_SOON':
      return { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' };
    case 'CLOSED':
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-600 dark:text-zinc-400', border: 'border-zinc-500/20' };
    case 'ORDER_SUBMITTED':
      return { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' };
    case 'IN_TRANSIT':
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20' };
    case 'ARRIVED':
      return { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20' };
    case 'FULFILLING':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20' };
    case 'COMPLETED':
      return { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/20' };
    default:
      return { bg: 'bg-surface-elevated', text: 'text-muted', border: 'border-separator' };
  }
}

/**
 * Calculates remaining countdown to batch closing
 */
export function getBatchCountdown(closesAt: string | Date): {
  isClosed: boolean;
  daysLeft: number;
  hoursLeft: number;
  label: string;
} {
  const closeDate = typeof closesAt === 'string' ? parseISO(closesAt) : closesAt;
  const now = new Date();

  if (isPast(closeDate)) {
    return { isClosed: true, daysLeft: 0, hoursLeft: 0, label: 'Batch Closed' };
  }

  const daysLeft = differenceInCalendarDays(closeDate, now);
  const hoursLeft = differenceInHours(closeDate, now);

  if (daysLeft > 1) {
    return { isClosed: false, daysLeft, hoursLeft, label: `${daysLeft} days left` };
  }
  if (hoursLeft > 1) {
    return { isClosed: false, daysLeft: 0, hoursLeft, label: `${hoursLeft} hours left` };
  }
  return { isClosed: false, daysLeft: 0, hoursLeft: 1, label: 'Closing soon' };
}

/**
 * Formats arrival window cleanly, e.g. "October 15 – October 22" or "Oct 15–22"
 */
export function formatArrivalWindow(start: string, end: string): string {
  try {
    const startDate = parseISO(start);
    const endDate = parseISO(end);

    const startMonth = format(startDate, 'MMM');
    const endMonth = format(endDate, 'MMM');

    if (startMonth === endMonth) {
      return `${startMonth} ${format(startDate, 'd')}–${format(endDate, 'd')}`;
    }
    return `${startMonth} ${format(startDate, 'd')} – ${endMonth} ${format(endDate, 'd')}`;
  } catch {
    return `${start} – ${end}`;
  }
}

export interface BatchBannerInfo {
  type: 'open' | 'in_transit' | 'arrived' | 'closed';
  badge: string;
  headline: string;
  subtext: string;
  actionText: string;
  urgency: 'high' | 'medium' | 'normal';
}

/**
 * Generates storefront announcement banner data from an active pre-order batch
 */
export function getBatchBannerInfo(batch: PreorderBatch): BatchBannerInfo {
  const countdown = getBatchCountdown(batch.closes_at);
  const arrivalWindow = formatArrivalWindow(batch.expected_arrival_start, batch.expected_arrival_end);
  const isFreightAir = batch.freight_mode === 'air' || batch.freight_mode === 'express';
  const freightName = isFreightAir ? 'Air Cargo' : 'Sea Freight';

  const st = (batch.status || '').toLowerCase();

  if (!countdown.isClosed && (st === 'open' || st === 'closing_soon')) {
    return {
      type: 'open',
      badge: countdown.label,
      headline: `${batch.name || `Batch ${batch.code}`} Pre-orders are Open`,
      subtext: `Orders close in ${countdown.daysLeft > 0 ? `${countdown.daysLeft} days` : 'a few hours'}. Expected arrival: ${arrivalWindow}.`,
      actionText: 'Shop Pre-orders',
      urgency: countdown.daysLeft <= 3 ? 'high' : 'medium',
    };
  }

  if (st === 'arrived' || st === 'fulfilling') {
    return {
      type: 'arrived',
      badge: 'Stock Arrived',
      headline: `${batch.name || `Batch ${batch.code}`} Has Arrived in Ghana`,
      subtext: 'Orders are currently being packed and dispatched for delivery.',
      actionText: 'Track Order',
      urgency: 'normal',
    };
  }

  if (st === 'ordered' || st === 'in_transit') {
    return {
      type: 'in_transit',
      badge: 'In Transit',
      headline: `${batch.name || `Batch ${batch.code}`} is En Route (${freightName})`,
      subtext: `Orders are on the way. Expected delivery: ${arrivalWindow}.`,
      actionText: 'View Batch Details',
      urgency: 'normal',
    };
  }

  return {
    type: 'closed',
    badge: 'Batch Closed',
    headline: `${batch.name || `Batch ${batch.code}`} Pre-orders are Closed`,
    subtext: `Supplier processing underway. Expected arrival: ${arrivalWindow}.`,
    actionText: 'Browse Catalog',
    urgency: 'normal',
  };
}

/**
 * Formats personalized WhatsApp milestone notification message
 */
export function formatBatchMilestoneMessage(
  batch: PreorderBatch,
  recipient: BatchBroadcastRecipient,
  milestone: PreorderBatchStatus
): string {
  const greeting = `Hello ${recipient.customerName || 'Valued Customer'},`;
  const orderRef = `Order #${recipient.orderShortId}`;
  const batchName = batch.name || `Batch ${batch.code}`;
  const trackingLink = recipient.trackingUrl;

  switch (milestone) {
    case 'ORDER_SUBMITTED':
      return `${greeting}\n\nGreat news! ${batchName} has officially closed and your order (${orderRef}) has been submitted to the supplier for procurement.\n\nExpected Arrival: ${formatArrivalWindow(
        batch.expected_arrival_start,
        batch.expected_arrival_end
      )}\n\nTrack your order progress here:\n${trackingLink}`;

    case 'IN_TRANSIT':
      return `${greeting}\n\nYour ${batchName} shipment (${orderRef}) is now ON ITS WAY! Cargo transit has officially begun.\n\nEstimated Arrival: ${formatArrivalWindow(
        batch.expected_arrival_start,
        batch.expected_arrival_end
      )}\n\nLive tracking:\n${trackingLink}`;

    case 'ARRIVED':
      return `${greeting}\n\nGood news! ${batchName} goods have LANDED at our hub. We are currently inspecting, sorting, and packing your order (${orderRef}).\n\nLive tracking:\n${trackingLink}`;

    case 'FULFILLING':
      return `${greeting}\n\nYour order (${orderRef}) from ${batchName} is now ready and out for delivery / ready for pickup!\n\nDetails & Waybill:\n${trackingLink}`;

    default:
      return `${greeting}\n\nUpdate regarding your pre-order (${orderRef}) in ${batchName}. Status: ${getBatchStatusLabel(
        milestone
      )}.\n\nTrack progress:\n${trackingLink}`;
  }
}
