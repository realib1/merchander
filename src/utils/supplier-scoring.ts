import { SupplierGrade } from '@/types/intelligence-demand';

export interface PurchaseOrderRecord {
  id?: string;
  expectedDeliveryDate?: string | null;
  actualDeliveryDate?: string | null;
  status?: string | null;
  orderedQty?: number;
  receivedQty?: number;
  defectCount?: number;
  qualityRating?: number | null;
}

/**
 * Calculates percentage of purchase orders delivered on or before the expected date.
 * If no completed purchase orders exist with delivery dates, returns 100.0 (unrated baseline).
 */
export function calculatePunctualityRate(purchaseOrders: PurchaseOrderRecord[]): number {
  const completed = purchaseOrders.filter(
    (po) => po.actualDeliveryDate && po.expectedDeliveryDate
  );

  if (completed.length === 0) return 100.0;

  const onTimeCount = completed.filter((po) => {
    const expected = new Date(po.expectedDeliveryDate!).getTime();
    const actual = new Date(po.actualDeliveryDate!).getTime();
    // Same day grace period (within 24 hours of expected deadline)
    return actual <= expected + (24 * 60 * 60 * 1000);
  }).length;

  const rate = (onTimeCount / completed.length) * 100;
  return Math.round(rate * 10) / 10;
}

/**
 * Calculates average lead time variance (in days).
 * Positive = late by X days, Negative = early by X days.
 */
export function calculateLeadTimeVariance(purchaseOrders: PurchaseOrderRecord[]): number {
  const completed = purchaseOrders.filter(
    (po) => po.actualDeliveryDate && po.expectedDeliveryDate
  );

  if (completed.length === 0) return 0;

  const totalVarianceDays = completed.reduce((acc, po) => {
    const expected = new Date(po.expectedDeliveryDate!).getTime();
    const actual = new Date(po.actualDeliveryDate!).getTime();
    const diffDays = (actual - expected) / (1000 * 60 * 60 * 24);
    return acc + diffDays;
  }, 0);

  const avg = totalVarianceDays / completed.length;
  return Math.round(avg * 10) / 10;
}

/**
 * Calculates fulfillment accuracy (ratio of total received units to ordered units).
 */
export function calculateFulfillmentAccuracy(purchaseOrders: PurchaseOrderRecord[]): number {
  const ordersWithQtys = purchaseOrders.filter(
    (po) => (po.orderedQty ?? 0) > 0 && po.receivedQty !== undefined
  );

  if (ordersWithQtys.length === 0) return 100.0;

  const totalOrdered = ordersWithQtys.reduce((acc, po) => acc + (po.orderedQty || 0), 0);
  const totalReceived = ordersWithQtys.reduce((acc, po) => acc + (po.receivedQty || 0), 0);

  if (totalOrdered <= 0) return 100.0;

  const accuracy = Math.min(100, (totalReceived / totalOrdered) * 100);
  return Math.round(accuracy * 10) / 10;
}

/**
 * Computes average quality rating (1-5) and defect rate (%).
 */
export function calculateQualityMetrics(purchaseOrders: PurchaseOrderRecord[]): {
  averageQualityRating: number | null;
  defectRate: number;
} {
  const rated = purchaseOrders.filter((po) => po.qualityRating != null && po.qualityRating > 0);
  const averageQualityRating =
    rated.length > 0
      ? Math.round((rated.reduce((acc, po) => acc + (po.qualityRating || 0), 0) / rated.length) * 10) / 10
      : null;

  const totalOrdered = purchaseOrders.reduce((acc, po) => acc + (po.orderedQty || 0), 0);
  const totalDefects = purchaseOrders.reduce((acc, po) => acc + (po.defectCount || 0), 0);

  const defectRate =
    totalOrdered > 0 ? Math.min(100, Math.round((totalDefects / totalOrdered) * 1000) / 10) : 0;

  return { averageQualityRating, defectRate };
}

/**
 * Calculates composite supplier score (0 - 100) and letter grade.
 * Weighting:
 * - 40% Punctuality
 * - 30% Fulfillment accuracy
 * - 20% Quality (defect-free rate or star rating)
 * - 10% Reliability baseline
 */
export function calculateCompositeSupplierScore(params: {
  hasHistory: boolean;
  punctualityRate: number;
  fulfillmentAccuracy: number;
  defectRate: number;
  qualityRating?: number | null;
}): { compositeScore: number; grade: SupplierGrade } {
  if (!params.hasHistory) {
    return {
      compositeScore: 100.0,
      grade: 'Unrated',
    };
  }

  // Quality score: if qualityRating is available, convert 1-5 stars to 20-100%, otherwise 100 - defectRate
  const qualityScore =
    params.qualityRating != null
      ? (params.qualityRating / 5) * 100
      : Math.max(0, 100 - params.defectRate * 2);

  const weighted =
    (params.punctualityRate * 0.40) +
    (params.fulfillmentAccuracy * 0.30) +
    (qualityScore * 0.20) +
    (100 * 0.10); // 10% baseline relationship reliability

  const compositeScore = Math.round(Math.min(100, Math.max(0, weighted)) * 10) / 10;

  let grade: SupplierGrade = 'Needs Attention';
  if (compositeScore >= 90) {
    grade = 'A';
  } else if (compositeScore >= 80) {
    grade = 'B';
  } else if (compositeScore >= 70) {
    grade = 'C';
  }

  return { compositeScore, grade };
}
