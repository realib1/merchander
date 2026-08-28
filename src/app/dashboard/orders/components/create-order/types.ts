export interface Variant {
  id: string;
  name: string;
  price: number;
  product_name: string;
  sku: string;
}

export interface Store {
  id: string;
  name: string;
}

export interface LineItem {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
}
