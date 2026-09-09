/**
 * Shared product domain types — single source of truth.
 */

export interface OrderInfo {
  status: string;
}

export interface OrderItem {
  quantity: number;
  order?: OrderInfo | null;
  orders?: OrderInfo | null;
}

export interface ProductVariant {
  id: string;
  name?: string | null;
  price: number;
  cost_price?: number | null;
  sku?: string | null;
  reorder_point?: number;
  reorder_quantity?: number;
  preferred_supplier_id?: string | null;
  inventory?: { quantity: number }[] | null;
  order_items?: OrderItem[] | null;
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface ProductSpecification {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  is_active: boolean;
  availability_status?: 'AVAILABLE' | 'PRE_ORDER' | 'OUT_OF_STOCK';
  preorder_shipping_mode?: 'included' | 'tbd';
  category_id?: string | null;
  category?: ProductCategory | null;
  vendor?: string | null;
  image_urls?: string[] | null;
  stock_unit?: string | null;
  specifications?: ProductSpecification[] | null;
  variants?: ProductVariant[] | null;
}
