import type { ProductVariant, OrderItem } from '@/types/product';

/**
 * Calculates the total stock quantity across all variants and their inventory levels.
 */
export function calculateTotalStock(
  variants?: ProductVariant[]
): number {
  if (!variants || variants.length === 0) return 0;

  return variants.reduce((acc, v) => {
    const inv = v.inventory?.reduce(
      (iAcc: number, i: { quantity: number }) => iAcc + (i.quantity || 0),
      0
    ) || 0;
    return acc + inv;
  }, 0);
}

/**
 * Calculates total units sold across all variants, excluding draft and cancelled orders.
 */
export function calculateTotalUnitsSold(
  variants?: ProductVariant[]
): number {
  if (!variants || variants.length === 0) return 0;

  return variants.reduce((acc, v) => {
    const sold = v.order_items?.reduce((sAcc: number, item: OrderItem) => {
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
export function getVariantPriceRange(
  variants?: ProductVariant[]
): { min: number; max: number; hasRange: boolean } {
  const prices = variants?.map((v) => v.price) || [0];
  const uniquePrices = new Set(prices);
  const min = prices.length > 0 ? Math.min(...prices) : 0;
  const max = prices.length > 0 ? Math.max(...prices) : 0;

  return { min, max, hasRange: uniquePrices.size > 1 };
}
