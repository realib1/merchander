export interface Store {
  id: string;
  name: string;
  location: string | null;
}

export interface Category {
  id: string;
  name: string;
}

export interface VariantState {
  id: string;
  sku: string;
  name: string;
  price: number | '';
  costPrice?: number | '';
  inventory: Record<string, number>;
}

export interface InitialProductData {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  availabilityStatus: 'AVAILABLE' | 'PRE_ORDER' | 'OUT_OF_STOCK';
  categoryId: string | null;
  vendor: string | null;
  stockUnit: string | null;
  imageUrls: string[];
  basePrice: number | '';
  baseCostPrice: number | '';
  preorderShippingMode: 'included' | 'tbd';
  variants: VariantState[];
}
