export interface TenantSettings {
  id?: string;
  tenant_id: string;
  trading_name: string | null;
  industry: string | null;
  tax_id: string | null;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  business_street: string | null;
  business_city: string | null;
  business_state: string | null;
  business_zip: string | null;
  business_country: string | null;
  store_email: string | null;
  store_currency: string | null;
  two_factor_enabled?: boolean | null;
  sms_recovery_enabled?: boolean | null;
  low_stock_threshold?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface TenantInfo {
  tenantId: string;
  role: string;
}
