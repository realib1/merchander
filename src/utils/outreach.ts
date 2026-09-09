/**
 * Pure logic utility for Merchander proactive customer outreach.
 * Enforces Ghana quiet hours (GMT/UTC), frequency caps, anti-spam safeguards,
 * message copy generators, and action safety classifications.
 */

import { ActionSafetyClassification, ActionType } from '@/types/actions';

export type OutreachTriggerType =
  | 'payment_reminder'
  | 'batch_milestone'
  | 'back_in_stock'
  | 'delivery_update';

export interface FrequencyCapParams {
  lastContactedAt?: string | Date | null;
  messagesSentInLast24h?: number;
  totalRemindersSent?: number;
  maxRemindersPerOrder?: number;
  cooldownHours?: number;
  now?: Date;
}

export interface FrequencyCapResult {
  allowed: boolean;
  reason?: string;
  nextAllowedAt?: Date;
}

export interface PaymentReminderCopyParams {
  customerName: string;
  orderNumber: string;
  totalAmount: number;
  currency?: string;
  itemsSummary?: string;
  paymentInstructions?: string;
  storeName?: string;
}

export interface BatchMilestoneCopyParams {
  customerName: string;
  batchName: string;
  milestone: string;
  expectedArrival?: string;
  trackingUrl?: string;
  storeName?: string;
}

export interface BackInStockCopyParams {
  customerName: string;
  productName: string;
  variantName?: string;
  price?: number;
  currency?: string;
  storeUrl?: string;
  storeName?: string;
}

export interface DeliveryUpdateCopyParams {
  customerName: string;
  orderNumber: string;
  deliveryStatus: string;
  trackingUrl?: string;
  address?: string;
  storeName?: string;
}

export interface ClassifyOutreachSafetyParams {
  triggerType: OutreachTriggerType;
  isBulk?: boolean;
  hasUnresolvedIssue?: boolean;
  confidence?: number;
  totalAmount?: number;
}

/**
 * Checks whether the specified time falls within Ghana quiet hours.
 * Ghana operates on GMT/UTC+0 (no DST).
 * Quiet hours are 21:00 (9:00 PM) to 08:00 (8:00 AM) UTC.
 */
export function isGhanaQuietHours(date: Date = new Date()): boolean {
  const hour = date.getUTCHours();
  return hour >= 21 || hour < 8;
}

/**
 * Evaluates frequency capping and cooldown policies for a customer/order.
 * Default policy:
 * - Minimum 24-hour cooldown between automated reminders
 * - Max 3 reminders per order
 * - Max 5 automated messages per customer in any 24h rolling window
 */
export function evaluateFrequencyCap(params: FrequencyCapParams): FrequencyCapResult {
  const maxReminders = params.maxRemindersPerOrder ?? 3;
  const cooldownHours = params.cooldownHours ?? 24;
  const totalReminders = params.totalRemindersSent ?? 0;
  const messages24h = params.messagesSentInLast24h ?? 0;
  const now = params.now ?? new Date();

  // 1. Order-level reminder limit
  if (totalReminders >= maxReminders) {
    return {
      allowed: false,
      reason: `Maximum reminder limit (${maxReminders}) reached for this order.`,
    };
  }

  // 2. Customer daily volume cap
  if (messages24h >= 5) {
    return {
      allowed: false,
      reason: 'Daily message frequency cap (5) reached for this customer.',
    };
  }

  // 3. Cooldown evaluation
  if (params.lastContactedAt) {
    const lastContactTime =
      typeof params.lastContactedAt === 'string'
        ? new Date(params.lastContactedAt).getTime()
        : params.lastContactedAt.getTime();

    if (!isNaN(lastContactTime)) {
      const elapsedHours = (now.getTime() - lastContactTime) / (1000 * 60 * 60);
      if (elapsedHours < cooldownHours) {
        const nextAllowed = new Date(lastContactTime + cooldownHours * 60 * 60 * 1000);
        const hoursLeft = (cooldownHours - elapsedHours).toFixed(1);
        return {
          allowed: false,
          reason: `Customer in cooldown window (${hoursLeft}h remaining).`,
          nextAllowedAt: nextAllowed,
        };
      }
    }
  }

  return { allowed: true };
}

/**
 * Generates copy for an order payment reminder.
 */
export function formatPaymentReminderMessage(params: PaymentReminderCopyParams): string {
  const store = params.storeName || 'our store';
  const currency = params.currency || 'GHS';
  const amountStr = `${currency} ${params.totalAmount.toFixed(2)}`;
  const itemsStr = params.itemsSummary ? `\nItems: ${params.itemsSummary}` : '';
  const instructionsStr = params.paymentInstructions
    ? `\nPayment options: ${params.paymentInstructions}`
    : '\nYou can complete payment via MTN MoMo, Telecel Cash, or card.';

  return (
    `Hello ${params.customerName}! Friendly reminder from ${store} regarding your order #${params.orderNumber} for ${amountStr}.${itemsStr}` +
    `\nStatus: Pending Payment${instructionsStr}` +
    `\n\nIf you have already sent payment or need any help, please let us know right here!`
  );
}

/**
 * Generates copy for a pre-order batch milestone announcement.
 */
export function formatBatchMilestoneMessage(params: BatchMilestoneCopyParams): string {
  const store = params.storeName || 'our store';
  const milestoneLabel = formatMilestoneLabel(params.milestone);
  const etaStr = params.expectedArrival ? `\nExpected Arrival: ${params.expectedArrival}` : '';
  const trackStr = params.trackingUrl ? `\nTrack your order: ${params.trackingUrl}` : '';

  return (
    `Hello ${params.customerName}! 📦 Milestone update from ${store} for your pre-order in batch "${params.batchName}":` +
    `\nStatus: ${milestoneLabel}${etaStr}${trackStr}` +
    `\n\nWe will keep you updated as your items progress!`
  );
}

/**
 * Generates copy for a back-in-stock notification.
 */
export function formatBackInStockMessage(params: BackInStockCopyParams): string {
  const store = params.storeName || 'our store';
  const variantStr = params.variantName ? ` (${params.variantName})` : '';
  const priceStr =
    params.price !== undefined
      ? `\nPrice: ${params.currency || 'GHS'} ${params.price.toFixed(2)}`
      : '';
  const urlStr = params.storeUrl ? `\nOrder now before stock runs out: ${params.storeUrl}` : '';

  return (
    `Hello ${params.customerName}! 🎉 Great news from ${store}: ${params.productName}${variantStr} is back in stock!${priceStr}${urlStr}` +
    `\n\nAs you signed up on our waitlist, you get early access to secure yours today.`
  );
}

/**
 * Generates copy for a delivery status update.
 */
export function formatDeliveryUpdateMessage(params: DeliveryUpdateCopyParams): string {
  const store = params.storeName || 'our store';
  const statusLabel = formatDeliveryStatusLabel(params.deliveryStatus);
  const addressStr = params.address ? `\nDestination: ${params.address}` : '';
  const trackStr = params.trackingUrl ? `\nTrack delivery: ${params.trackingUrl}` : '';

  return (
    `Hello ${params.customerName}! 🚚 Delivery update from ${store} for order #${params.orderNumber}:` +
    `\nStatus: ${statusLabel}${addressStr}${trackStr}` +
    `\n\nThank you for shopping with us!`
  );
}

/**
 * Classifies proactive outreach into Green, Yellow, or Red action safety tier.
 */
export function classifyOutreachSafety(
  params: ClassifyOutreachSafetyParams
): ActionSafetyClassification {
  const confidence =
    typeof params.confidence === 'number' && !isNaN(params.confidence) ? params.confidence : 1.0;
  const isBulk = Boolean(params.isBulk);
  const hasUnresolvedIssue = Boolean(params.hasUnresolvedIssue);
  const totalAmount = params.totalAmount ?? 0;

  // 1. Red tier: Customer has unresolved disputes, complaints, or very low confidence
  if (hasUnresolvedIssue || confidence < 0.5) {
    return {
      tier: 'red',
      actionType: 'human_handoff',
      autoDispatch: false,
      requiresHumanApproval: true,
      escalationReason: hasUnresolvedIssue
        ? 'Customer has open dispute or human escalation on file'
        : `Low AI confidence (${(confidence * 100).toFixed(0)}%) for proactive outreach`,
    };
  }

  // 2. Yellow tier:
  // - Bulk broadcasts (batch milestone broadcasts to groups of customers)
  // - Back-in-stock alerts to waitlisted users (inventory demand management)
  // - High-value payment reminders (orders >= GHS 5,000)
  // - Medium AI confidence (< 0.85)
  const isHighValue = totalAmount >= 5000;
  const isMediumConfidence = confidence < 0.85;
  const isBatchMilestone = params.triggerType === 'batch_milestone';
  const isBackInStock = params.triggerType === 'back_in_stock';

  if (isBulk || isBatchMilestone || isBackInStock || isHighValue || isMediumConfidence) {
    let escalationReason = 'Proactive outreach requires merchant review';
    if (isBulk || isBatchMilestone) {
      escalationReason = 'Bulk batch broadcast requires merchant confirmation';
    } else if (isBackInStock) {
      escalationReason = 'Waitlist restock notification requires merchant review';
    } else if (isHighValue) {
      escalationReason = `High-value order payment reminder (GHS ${totalAmount.toFixed(2)})`;
    } else if (isMediumConfidence) {
      escalationReason = `Medium AI confidence (${(confidence * 100).toFixed(0)}%)`;
    }

    return {
      tier: 'yellow',
      actionType: 'reply' as ActionType,
      autoDispatch: false,
      requiresHumanApproval: true,
      escalationReason,
    };
  }

  // 3. Green tier: 1-to-1 standard transactional delivery updates or routine payment reminders
  return {
    tier: 'green',
    actionType: 'reply' as ActionType,
    autoDispatch: true,
    requiresHumanApproval: false,
    escalationReason: null,
  };
}

function formatMilestoneLabel(milestone: string): string {
  const map: Record<string, string> = {
    ORDER_SUBMITTED: 'Order Placed with Supplier',
    IN_TRANSIT: 'In Transit / Shipped',
    ARRIVED: 'Arrived at Warehouse',
    FULFILLING: 'Packaging & Fulfilling',
    COMPLETED: 'Batch Completed',
  };
  return map[milestone] || milestone.replace(/_/g, ' ');
}

function formatDeliveryStatusLabel(status: string): string {
  const map: Record<string, string> = {
    shipped: 'Shipped',
    in_transit: 'In Transit',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
  };
  return map[status.toLowerCase()] || status;
}
