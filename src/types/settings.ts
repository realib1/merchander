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
  settings_data?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface TenantInfo {
  tenantId: string;
  role: string;
}

export interface DayHours {
  id: string;
  name: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface BusinessHoursSettings {
  days: DayHours[];
  timezone: string;
}

export interface NotificationSettings {
  emailNewOrder: boolean;
  emailPaymentReceived: boolean;
  emailLowInventory: boolean;
  inAppOrderAlerts: boolean;
  channelOrderAlerts: boolean;
}

export interface OrderSettings {
  orderConfirmationEmail: boolean;
  staffOrderNotifications: boolean;
  orderPrefix: string;
  orderSuffix: string;
  abandonedRecoveryEnabled: boolean;
  abandonedSendAfterHours: number;
}

export interface InventorySettings {
  stopSellingWhenOutOfStock: boolean;
  trackInventoryByDefault: boolean;
  enableLowStockAlerts: boolean;
  lowStockThreshold: number;
  autoGenerateSkus: boolean;
}

export interface PaymentSettings {
  enableMtnMomo: boolean;
  enableTelecelCash: boolean;
  enableAtMoney: boolean;
  enableCards: boolean;
  enableCod: boolean;
  codMaxOrderAmount: number;
}

export interface SupplierSettings {
  procurementEmail: string;
  enableAutoPos: boolean;
  receivingInstructions: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  eta: string;
  fee: number;
  isActive: boolean;
}

export interface ShipmentSettings {
  allowCustomerTracking: boolean;
  originWarehouse: string;
  zones: DeliveryZone[];
}

export interface FulfillmentSettings {
  autoFulfillDigital: boolean;
  requireScanning: boolean;
  packingSlipShowPrices: boolean;
  packingSlipReturnPolicy: boolean;
  handlingTimeDays: string;
}

export interface ChannelSettings {
  whatsappConnected: boolean;
  whatsappPhone: string;
  instagramConnected: boolean;
  instagramHandle: string;
  messengerConnected: boolean;
  webhookUrl: string;
}

export interface ConversationSettings {
  autoAssignStaff: boolean;
  stickyRouting: boolean;
  enableSlaTracking: boolean;
  targetSlaMinutes: number;
}

export interface KeywordRule {
  id: string;
  name: string;
  keywords: string[];
  replyText: string;
  isActive: boolean;
}

export interface AutomationSettings {
  welcomeMessageEnabled: boolean;
  welcomeGreeting: string;
  awayMessageEnabled: boolean;
  awayMessage: string;
  rules: KeywordRule[];
}

export interface PrivacySettings {
  showCookieBanner: boolean;
  marketingConsentCheckbox: boolean;
  deleteAbandonedAfterDays: number;
}

export interface AuditLogEntry {
  id: string;
  actorName: string;
  actorEmail: string;
  action: string;
  resource: string;
  ipAddress?: string;
  createdAt: string;
}
