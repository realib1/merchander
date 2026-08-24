import type { ProductVariant, OrderItem } from '@/types/product';

/**
 * Calculates the total stock quantity across all variants and their inventory levels.
 */
export function calculateTotalStock(variants?: ProductVariant[]): number {
  if (!variants || variants.length === 0) return 0;

  return variants.reduce((acc, v) => {
    const inv = v.inventory?.reduce((iAcc: number, i: { quantity: number }) => iAcc + (i.quantity || 0), 0) || 0;
    return acc + inv;
  }, 0);
}

/**
 * Calculates total units sold across all variants, excluding draft and cancelled orders.
 */
export function calculateTotalUnitsSold(variants?: ProductVariant[]): number {
  if (!variants || variants.length === 0) return 0;

  return variants.reduce((acc, v) => {
    const sold =
      v.order_items?.reduce((sAcc: number, item: OrderItem) => {
        const status = item.order?.status || item.orders?.status;
        if (status !== 'draft' && status !== 'cancelled') {
          return sAcc + (item.quantity || 0);
        }
        return sAcc;
      }, 0) || 0;
    return acc + sold;
  }, 0);
}

/**
 * Gets the price range from a set of variants.
 * Returns { min, max, hasRange } so callers can format display appropriately.
 */
export function getVariantPriceRange(variants?: ProductVariant[]): { min: number; max: number; hasRange: boolean } {
  const prices = variants?.map((v) => v.price) || [0];
  const uniquePrices = new Set(prices);
  const min = prices.length > 0 ? Math.min(...prices) : 0;
  const max = prices.length > 0 ? Math.max(...prices) : 0;

  return { min, max, hasRange: uniquePrices.size > 1 };
}

/**
 * Generates a short, reusable ID from a database UUID for display purposes.
 */
export function getShortId(id: string, length = 8): string {
  if (!id) return '';
  // Remove dashes and take the first N characters
  return id.replace(/-/g, '').substring(0, length).toUpperCase();
}

/**
 * Generates a unique SKU for a product based on its name and an optional UUID.
 * Format: [INITIALS]-[SHORT_ID or RANDOM_NUMBERS]
 */
export function generateSKU(productName: string, id?: string): string {
  if (!productName) return `PRD-${id ? getShortId(id, 6) : Math.floor(100000 + Math.random() * 900000)}`;

  // Extract initials (up to 3 characters) from the product name
  const words = productName.trim().split(/\s+/);
  let initials = '';

  if (words.length === 1) {
    initials = words[0].substring(0, 3).toUpperCase();
  } else {
    initials = words
      .slice(0, 3)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  // Ensure initials are alphabetic and padded if needed (fallback for weird names)
  initials = initials
    .replace(/[^A-Z0-9]/g, '')
    .padEnd(2, 'X')
    .substring(0, 3);

  if (id) {
    return `${initials}-${getShortId(id, 6)}`;
  } else {
    // Generate 6 random digits
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    return `${initials}-${randomDigits}`;
  }
}
