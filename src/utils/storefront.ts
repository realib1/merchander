import { StorefrontCartItem, StorefrontConfig } from '@/types/storefront';
import { formatCurrency } from '@/utils/format';

/**
 * Generate a clean, URL-safe slug from a store name
 */
export function generateStoreSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Calculates cart subtotal and total item count
 */
export function calculateCartTotals(cart: StorefrontCartItem[]): { subtotal: number; itemCount: number } {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, itemCount };
}

/**
 * Formats a structured WhatsApp message for 1-click cart checkout
 */
export function formatWhatsAppOrderMessage(
  config: StorefrontConfig,
  cart: StorefrontCartItem[],
  customer: { name: string; phone: string; address?: string; notes?: string; fulfillmentMode?: 'delivery' | 'pickup' }
): string {
  const { subtotal } = calculateCartTotals(cart);
  const currency = config.currency || 'GHS';

  const lines: string[] = [
    `🛍️ *NEW ORDER - ${config.store_name.toUpperCase()}*`,
    `--------------------------------`,
    `👤 *Customer:* ${customer.name}`,
    `📞 *Phone:* ${customer.phone}`,
  ];

  if (customer.fulfillmentMode) {
    lines.push(`🚚 *Fulfillment:* ${customer.fulfillmentMode === 'pickup' ? 'Store Pickup' : 'Doorstep Delivery'}`);
  }

  if (customer.address) {
    lines.push(`📍 *Address / Branch:* ${customer.address}`);
  }

  if (customer.notes) {
    lines.push(`📝 *Note:* ${customer.notes}`);
  }

  lines.push(`--------------------------------`);
  lines.push(`📦 *ITEMS:*`);

  cart.forEach((item, index) => {
    const itemTotal = formatCurrency(item.price * item.quantity, currency);
    const variantDesc = item.variantTitle && item.variantTitle !== 'Default' ? ` (${item.variantTitle})` : '';
    lines.push(`${index + 1}. ${item.productName}${variantDesc} x${item.quantity} = ${itemTotal}`);
  });

  lines.push(`--------------------------------`);
  lines.push(`💰 *TOTAL:* ${formatCurrency(subtotal, currency)}`);
  lines.push(`--------------------------------`);
  lines.push(`Order created via Merchander Storefront`);

  return lines.join('\n');
}

/**
 * Generates direct WhatsApp click-to-chat URL with pre-filled message
 */
export function createWhatsAppOrderLink(phone: string, message: string): string {
  // Normalize phone number (strip +, spaces, dashes)
  const cleanedPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanedPhone}?text=${encodedText}`;
}
