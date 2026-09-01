export interface BranchOperatingHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface BranchData {
  id: string;
  tenant_id: string;
  name: string;
  location?: string | null;
  is_primary: boolean;
  phone?: string | null;
  whatsapp_phone?: string | null;
  street_address?: string | null;
  city?: string | null;
  region?: string | null;
  landmark?: string | null;
  digital_address?: string | null;
  operating_hours: BranchOperatingHours[];
  pickup_enabled: boolean;
  created_at: string;
  updated_at: string;
  totalProductsCount?: number;
  totalUnitsCount?: number;
  totalOrdersCount?: number;
}

export interface BranchInput {
  name: string;
  is_primary?: boolean;
  phone?: string | null;
  whatsapp_phone?: string | null;
  street_address?: string | null;
  city?: string | null;
  region?: string | null;
  landmark?: string | null;
  digital_address?: string | null;
  operating_hours?: BranchOperatingHours[];
  pickup_enabled?: boolean;
}

export interface InterBranchTransferInput {
  sourceStoreId: string;
  targetStoreId: string;
  variantId: string;
  quantity: number;
}

export interface BulkTransferItem {
  variantId: string;
  quantity: number;
}

export interface BulkInterBranchTransferInput {
  sourceStoreId: string;
  targetStoreId: string;
  items: BulkTransferItem[];
}
