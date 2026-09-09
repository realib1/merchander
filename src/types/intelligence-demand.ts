export type StockHealthStatus = 'critical' | 'warning' | 'healthy' | 'no_sales' | 'overstocked';

export type SupplierGrade = 'A' | 'B' | 'C' | 'Needs Attention' | 'Unrated';

export interface PreferredSupplierInfo {
  id: string;
  name: string;
  defaultLeadDays: number;
  seaLeadDays: number;
  airLeadDays: number;
  reliabilityScore: number;
}

export interface RestockRecommendation {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string | null;
  currentStock: number;
  dailyVelocity: number;
  daysOfStockRemaining: number;
  projectedRunOutDate: string | null;
  reorderPoint: number;
  suggestedReorderQuantity: number;
  healthStatus: StockHealthStatus;
  preferredSupplier: PreferredSupplierInfo | null;
  estimatedUnitCost: number;
  totalEstimatedCost: number;
}

export interface DemandForecastSummary {
  totalVariantsTracked: number;
  criticalStockoutsCount: number;
  warningStockoutsCount: number;
  healthyStockCount: number;
  totalSuggestedCapitalGhs: number;
  averageVelocity: number;
}

export interface SupplierPerformanceScore {
  supplierId: string;
  supplierName: string;
  country: string | null;
  totalPOs: number;
  completedPOs: number;
  onTimeDeliveryRate: number;
  averageLeadTimeDays: number;
  fulfillmentAccuracy: number;
  defectCount: number;
  averageQualityRating: number | null;
  compositeScore: number;
  grade: SupplierGrade;
  outstandingBalance: number;
}

export interface SupplierScorecardSummary {
  totalSuppliers: number;
  averageOnTimeRate: number;
  gradeACount: number;
  needsAttentionCount: number;
}

export interface CreateDraftPOFromRestockPayload {
  supplierId: string;
  items: Array<{
    variantId: string;
    quantity: number;
    costPrice: number;
  }>;
  notes?: string;
}

export interface RecordPODeliveryPayload {
  purchaseOrderId: string;
  actualDeliveryDate: string;
  qualityRating: number;
  defectCount: number;
  notes?: string;
}
