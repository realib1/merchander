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

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  variants?: ProductVariant[] | null;
}
