/**
 * Pure utilities for generating customer-facing payment links,
 * WhatsApp payment requests, payment confirmation receipts, and reminders.
 */
import { getURL } from '@/utils/url';

export interface StorefrontPaymentUrlParams {
  baseUrl?: string;
  storeSlug: string;
  orderShortIdOrId: string;
  token?: string | null;
  autoOpenPayment?: boolean;
}

/**
 * Builds the public storefront order tracking & payment checkout URL.
 */
export function buildStorefrontOrderPaymentUrl(params: StorefrontPaymentUrlParams): string {
  const base = (params.baseUrl || getURL() || '').trim().replace(/\/+$/, '');
  const cleanSlug = encodeURIComponent(params.storeSlug.trim());
  const cleanOrderId = encodeURIComponent(params.orderShortIdOrId.trim());

  let path = `${base}/store/${cleanSlug}/orders/${cleanOrderId}`;
  const queryParams: string[] = [];

  if (params.autoOpenPayment !== false) {
    queryParams.push('pay=true');
  }

  if (params.token) {
    queryParams.push(`token=${encodeURIComponent(params.token.trim())}`);
  }

  if (queryParams.length > 0) {
    path += `?${queryParams.join('&')}`;
  }

  return path;
}

export interface OrderPaymentLinkMessageParams {
  customerName?: string | null;
  orderNumber: string;
  totalAmount: number;
  currency?: string;
  paymentUrl: string;
  itemsSummary?: string | null;
}

/**
 * Formats a WhatsApp message containing the order payment link.
 */
export function formatOrderPaymentLinkMessage(params: OrderPaymentLinkMessageParams): string {
  const name = params.customerName?.trim() || 'Valued Customer';
  const currency = params.currency?.trim() || 'GHS';
  const amount = Number(params.totalAmount) || 0;
  const formattedAmount = `${currency} ${amount.toFixed(2)}`;

  const lines = [
    `Hello ${name}! 🎉`,
    '',
    `Your order #${params.orderNumber} is ready for payment.`,
  ];

  if (params.itemsSummary?.trim()) {
    lines.push(`Items: ${params.itemsSummary.trim()}`);
  }

  lines.push(`Total Amount: ${formattedAmount}`);
  lines.push('');
  lines.push(`👉 Tap here to pay securely:\n${params.paymentUrl}`);
  lines.push('');
  lines.push(`We accept Mobile Money (MTN MoMo, Telecel Cash) and Debit/Credit Cards.`);
  lines.push(`Thank you for shopping with us!`);

  return lines.join('\n');
}

export interface PaymentReceiptMessageParams {
  customerName?: string | null;
  orderNumber: string;
  amountPaid: number;
  currency?: string;
  provider?: string | null;
  transactionRef: string;
  trackingUrl?: string | null;
}

/**
 * Maps payment provider keys to customer-friendly labels.
 */
export function formatProviderLabel(provider?: string | null): string {
  if (!provider) return 'Online Payment';
  const key = provider.toLowerCase().trim();

  switch (key) {
    case 'paystack':
      return 'Paystack (Card / MoMo)';
    case 'hubtel':
      return 'Hubtel Mobile Money';
    case 'mtn_momo':
      return 'MTN Mobile Money';
    case 'telecel_cash':
      return 'Telecel Cash';
    case 'at_money':
      return 'AT Money';
    case 'card':
      return 'Debit/Credit Card';
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'cash_on_delivery':
      return 'Cash on Delivery';
    default:
      return provider.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

/**
 * Formats an automated WhatsApp receipt message when payment is confirmed via webhook.
 */
export function formatPaymentReceiptMessage(params: PaymentReceiptMessageParams): string {
  const name = params.customerName?.trim() || 'Customer';
  const currency = params.currency?.trim() || 'GHS';
  const amount = Number(params.amountPaid) || 0;
  const formattedAmount = `${currency} ${amount.toFixed(2)}`;
  const providerLabel = formatProviderLabel(params.provider);

  const lines = [
    `Payment Confirmed! ✅`,
    '',
    `Hello ${name}, we have received your payment of ${formattedAmount} for Order #${params.orderNumber}.`,
    '',
    `• Reference: ${params.transactionRef}`,
    `• Payment Channel: ${providerLabel}`,
    '',
    `Your order has been updated and is now being prepared for fulfillment.`,
  ];

  if (params.trackingUrl?.trim()) {
    lines.push('');
    lines.push(`Track your live order progress here:\n${params.trackingUrl.trim()}`);
  }

  lines.push('');
  lines.push(`Thank you for your business! 🙏`);

  return lines.join('\n');
}

export interface PaymentReminderMessageParams {
  customerName?: string | null;
  orderNumber: string;
  totalAmount: number;
  currency?: string;
  paymentUrl: string;
  hoursSinceOrder?: number;
}

/**
 * Formats a warm, professional WhatsApp payment reminder for pending/unpaid orders.
 */
export function formatPaymentReminderMessage(params: PaymentReminderMessageParams): string {
  const name = params.customerName?.trim() || 'there';
  const currency = params.currency?.trim() || 'GHS';
  const amount = Number(params.totalAmount) || 0;
  const formattedAmount = `${currency} ${amount.toFixed(2)}`;

  const lines = [
    `Friendly Payment Reminder ⏳`,
    '',
    `Hi ${name}, just checking in regarding your Order #${params.orderNumber} (${formattedAmount}).`,
    '',
    `Your reserved items are currently waiting. To ensure prompt delivery, please complete your payment using the secure link below:`,
    '',
    `👉 ${params.paymentUrl}`,
    '',
    `If you have already paid or need assistance, simply reply to this message. We're happy to help!`,
  ];

  return lines.join('\n');
}
