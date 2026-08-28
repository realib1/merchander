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
  featured_product_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface StorefrontProductVariant {
  id: string;
  sku: string | null;
  title: string | null;
  price: number;
  cost_price?: number | null;
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
  is_featured: boolean;
  min_price: number;
  max_price: number;
  total_stock: number;
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
}

export interface StoreOrderPayload {
  tenantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  paymentMethod: 'whatsapp' | 'mtn_momo' | 'telecel_cash' | 'cash_on_delivery';
  items: Array<{
    variantId: string;
    quantity: number;
    unitPrice: number;
  }>;
}
