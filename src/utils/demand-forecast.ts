import { StockHealthStatus } from '@/types/intelligence-demand';

export interface SalesHistoryRecord {
  quantity: number;
  orderStatus?: string | null;
}

/**
 * Calculates average daily sales velocity (burn rate) for a variant over a defined time window.
 * Ignores draft and cancelled orders.
 */
export function calculateDailyVelocity(
  sales: SalesHistoryRecord[],
  daysWindow = 30
): number {
  if (!sales || sales.length === 0) return 0;
  const safeDays = Math.max(1, daysWindow);

  const validSales = sales.filter((s) => {
    const st = s.orderStatus?.toLowerCase();
    return st !== 'draft' && st !== 'cancelled';
  });

  const totalQuantity = validSales.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  if (totalQuantity <= 0) return 0;

  const velocity = totalQuantity / safeDays;
  return Math.round(velocity * 100) / 100;
}

/**
 * Estimates remaining days of inventory and the projected stock depletion date.
 * If velocity is 0 or negative, stock will not run out (Infinity, null date).
 */
export function calculateRunOutDate(
  currentStock: number,
  dailyVelocity: number,
  fromDate: Date = new Date()
): { daysOfStockRemaining: number; projectedRunOutDate: string | null } {
  if (dailyVelocity <= 0) {
    return {
      daysOfStockRemaining: Infinity,
      projectedRunOutDate: null,
    };
  }

  if (currentStock <= 0) {
    return {
      daysOfStockRemaining: 0,
      projectedRunOutDate: fromDate.toISOString(),
    };
  }

  const daysRemaining = Math.floor(currentStock / dailyVelocity);
  const runOutMs = fromDate.getTime() + daysRemaining * 24 * 60 * 60 * 1000;
  const projectedRunOutDate = new Date(runOutMs).toISOString();

  return {
    daysOfStockRemaining: daysRemaining,
    projectedRunOutDate,
  };
}

/**
 * Computes a dynamic reorder point based on sales velocity, lead time, and safety buffer.
 * Formula: (velocity * leadTimeDays) + (velocity * safetyBufferDays)
 */
export function calculateDynamicReorderPoint(
  dailyVelocity: number,
  leadTimeDays: number,
  safetyBufferDays = 5
): number {
  if (dailyVelocity <= 0) return 0;
  const safeLeadTime = Math.max(1, leadTimeDays);
  const safeBuffer = Math.max(0, safetyBufferDays);

  const point = (dailyVelocity * safeLeadTime) + (dailyVelocity * safeBuffer);
  return Math.max(1, Math.ceil(point));
}

/**
 * Suggests an order quantity to replenish stock back to target coverage days.
 */
export function calculateSuggestedReorderQty(
  currentStock: number,
  reorderPoint: number,
  targetDaysCover = 30,
  dailyVelocity = 0,
  defaultPackQty = 20
): number {
  if (dailyVelocity <= 0) {
    return currentStock <= 0 ? defaultPackQty : 0;
  }

  const safeCover = Math.max(1, targetDaysCover);
  const targetInventory = Math.ceil(dailyVelocity * safeCover);
  const shortfall = targetInventory - Math.max(0, currentStock);

  if (shortfall <= 0) return 0;

  return Math.max(defaultPackQty, shortfall);
}

/**
 * Classifies inventory health status for prioritizing merchant restock actions.
 */
export function classifyStockHealth(
  currentStock: number,
  reorderPoint: number,
  leadTimeDays: number,
  dailyVelocity: number
): StockHealthStatus {
  if (currentStock <= 0) return 'critical';
  if (dailyVelocity <= 0) return 'no_sales';

  const daysRemaining = currentStock / dailyVelocity;
  const safeLeadTime = Math.max(1, leadTimeDays);

  // If remaining days are less than or equal to lead time, shipment cannot arrive in time
  if (daysRemaining <= safeLeadTime) {
    return 'critical';
  }

  // If inventory has dipped below or equal to reorder threshold
  if (currentStock <= reorderPoint) {
    return 'warning';
  }

  // If more than 90 days of stock are sitting in the warehouse
  if (daysRemaining > 90) {
    return 'overstocked';
  }

  return 'healthy';
}
