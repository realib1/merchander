export type PreorderBatchStatus =
  'OPEN' | 'CLOSING_SOON' | 'CLOSED' | 'ORDER_SUBMITTED' | 'IN_TRANSIT' | 'ARRIVED' | 'FULFILLING' | 'COMPLETED';

export type PreorderFreightMode = 'sea' | 'air' | 'express' | 'road';

export interface PreorderBatch {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  status: PreorderBatchStatus;
  opens_at: string;
  closes_at: string;
  supplier_order_date?: string | null;
  expected_arrival_start: string;
  expected_arrival_end: string;
  actual_arrival_date?: string | null;
  freight_mode?: PreorderFreightMode;
  origin_country?: string | null;
  cargo_tracking_number?: string | null;
  max_capacity?: number | null;
  min_moq_target?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  // Computed / Joined fields
  product_count?: number;
  order_count?: number;
  total_units_reserved?: number;
  assigned_product_ids?: string[];
}

export interface PreorderBatchFormData {
  name: string;
  code: string;
  opens_at: string;
  closes_at: string;
  supplier_order_date?: string;
  expected_arrival_start: string;
  expected_arrival_end: string;
  freight_mode?: PreorderFreightMode;
  origin_country?: string;
  cargo_tracking_number?: string;
  max_capacity?: number;
  min_moq_target?: number;
  notes?: string;
  product_ids?: string[];
}

export interface BatchConsolidatedItem {
  productId: string;
  productName: string;
  variantId: string;
  variantTitle: string;
  sku: string | null;
  totalQuantity: number;
  costPrice?: number | null;
  unitPrice: number;
  totalCustomerAmount: number;
}

export interface BatchProcurementSummary {
  batch: PreorderBatch;
  items: BatchConsolidatedItem[];
  totalOrders: number;
  totalUnits: number;
  totalEstimatedRevenue: number;
}

export interface BatchBroadcastRecipient {
  orderId: string;
  orderShortId: string;
  customerName: string;
  customerPhone: string;
  itemsSummary: string;
  trackingUrl: string;
}

export interface BatchMilestoneBroadcast {
  id: string;
  tenant_id: string;
  batch_id: string;
  milestone: PreorderBatchStatus;
  channel: 'whatsapp' | 'sms' | 'email';
  recipient_count: number;
  message_template: string;
  status: 'queued' | 'sent' | 'failed';
  created_at: string;
}
