import { PreorderBatch } from './preorder';

export type DomainVerificationStatus = 'valid' | 'pending' | 'invalid';

export interface CustomDomainConfig {
  domain: string;
  status: DomainVerificationStatus;
  cnameTarget: string;
  lastCheckedAt: string | null;
  errorReason?: string | null;
}

export interface StorefrontConfig {
  id?: string;
  tenant_id: string;
  store_name: string;
  slug: string;
  tagline: string | null;
  bio: string | null;
  logo_url: string | null;
  banner_url: string | null;
  whatsapp_phone: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  delivery_policy: string | null;
  is_active: boolean;
  currency: string;
  primary_color?: string | null;
  secondary_color?: string | null;
  custom_domain?: string | null;
  custom_domain_config?: CustomDomainConfig | null;
  featured_product_ids?: string[];
  hero_mode?: 'banner' | 'featured_product' | 'default';
  banner_headline?: string | null;
  banner_tagline?: string | null;
  banner_cta_text?: string | null;
  accepted_payment_methods?: AcceptedPaymentMethod[];
  created_at?: string;
  updated_at?: string;
}

export interface AcceptedPaymentMethod {
  id: string;
  name: string;
  type: string;
  dotColor?: string;
}

export interface StorefrontProductVariant {
  id: string;
  sku: string | null;
  title: string | null;
  price: number;
  cost_price?: number | null;
  compare_at_price?: number | null;
  stock_quantity: number;
  is_available: boolean;
}

export interface StorefrontProduct {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  category_name: string;
  image_url: string | null;
  image_urls: string[];
  is_featured: boolean;
  min_price: number;
  max_price: number;
  total_stock: number;
  availability_status?: 'AVAILABLE' | 'PRE_ORDER' | 'OUT_OF_STOCK' | string;
  preorder_shipping_mode?: 'included' | 'tbd' | string | null;
  specifications?: Array<{ key: string; value: string }>;
  active_batch?: PreorderBatch | null;
  variants: StorefrontProductVariant[];
}

export interface StorefrontCategory {
  id: string;
  name: string;
  product_count: number;
}

export interface StorefrontPublicData {
  config: StorefrontConfig;
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
  activeBatches?: PreorderBatch[];
}

export interface StorefrontCartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantTitle: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  sku?: string | null;
  batchId?: string | null;
  batchName?: string | null;
}

export interface StoreOrderPayload {
  tenantSlug: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  fulfillmentMode?: 'delivery' | 'pickup';
  pickupStoreId?: string;
  paymentMethod: 'whatsapp' | 'mtn_momo' | 'telecel_cash' | 'cash_on_delivery' | 'card';
  batchId?: string | null;
  items: Array<{
    variantId: string;
    quantity: number;
    batchId?: string | null;
  }>;
}

export interface StoreOrderResponse {
  success: boolean;
  orderId?: string;
  orderShortId?: string;
  trackingToken?: string;
  trackingUrl?: string;
  error?: string;
}

export type OrderProgressStatus =
  'draft' | 'pending_payment' | 'paid' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';

export interface StorefrontTrackingItem {
  id: string;
  variantId: string;
  productName: string;
  variantTitle: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string | null;
}

export interface StorefrontTrackingOrder {
  id: string;
  shortId: string;
  status: OrderProgressStatus;
  totalAmount: number;
  currency: string;
  deliveryAddress: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerPhone: string;
  batch?: PreorderBatch | null;
  items: StorefrontTrackingItem[];
  waybill?: {
    courierName: string;
    trackingNumber: string;
    estimatedDelivery?: string;
  } | null;
}
