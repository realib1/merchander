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
  sku?: string | null;
  inventory?: { quantity: number }[] | null;
  order_items?: OrderItem[] | null;
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  category_id?: string | null;
  category?: ProductCategory | null;
  vendor?: string | null;
  image_urls?: string[] | null;
  stock_unit?: string | null;
  variants?: ProductVariant[] | null;
}
