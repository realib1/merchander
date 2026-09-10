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

export interface OrderNumberingSettings {
  prefix: string;
  format: 'ORD-{{YEAR}}-{{NUMBER}}' | 'ORD-{{NUMBER}}' | 'ORD-{{MONTH}}-{{NUMBER}}';
  nextNumber: number;
}

export interface OrderCreationSettings {
  allowStorefront: boolean;
  allowSocialConversations: boolean;
  allowDashboard: boolean;
  allowManual: boolean;
  aiCreatedOrdersMode: 'require_confirmation' | 'auto_create';
}

export interface OrderConfirmationSettings {
  autoConfirmStorefront: boolean;
  requireApprovalBeforeProcessing: boolean;
  sendCustomerConfirmation: boolean;
}

export interface OrderStatusSettings {
  enabledStatuses: Array<
    'pending' | 'confirmed' | 'processing' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'refunded'
  >;
}

export interface OrderCancellationSettings {
  allowMerchantCancellation: boolean;
  allowCustomerCancellation: boolean;
  customerCancellationWindowMinutes: number;
  requireApprovalAfterProcessing: boolean;
}

export interface OrderReturnsRefundsSettings {
  allowReturnRequests: boolean;
  refundRequiresMerchantApproval: boolean;
  defaultRefundMethod: 'original_payment' | 'store_credit' | 'manual';
}

export interface OrderInventoryBehaviourSettings {
  onConfirmation: 'reserve_stock' | 'deduct_immediately';
  onCancellationReleaseStock: boolean;
}

export interface OrderNotificationEventsSettings {
  newOrder: boolean;
  orderCancelled: boolean;
  paymentReceived: boolean;
  orderReady: boolean;
  orderDelivered: boolean;
  returnRequested: boolean;
}

export interface OrderSettings {
  numbering: OrderNumberingSettings;
  creation: OrderCreationSettings;
  confirmation: OrderConfirmationSettings;
  statuses: OrderStatusSettings;
  cancellation: OrderCancellationSettings;
  returnsRefunds: OrderReturnsRefundsSettings;
  inventory: OrderInventoryBehaviourSettings;
  notifications: OrderNotificationEventsSettings;

  // Backward compatibility fields
  orderConfirmationEmail?: boolean;
  staffOrderNotifications?: boolean;
  orderPrefix?: string;
  orderSuffix?: string;
  abandonedRecoveryEnabled?: boolean;
  abandonedSendAfterHours?: number;
}

export type SkuGenerationStyle = 'initials' | 'prefix' | 'category_initials';

export interface SkuSettings {
  autoGenerate: boolean;
  style: SkuGenerationStyle;
  prefix: string;
  includeVariantName: boolean;
  nextNumber: number;
}

export interface InventorySettings {
  stopSellingWhenOutOfStock: boolean;
  trackInventoryByDefault: boolean;
  enableLowStockAlerts: boolean;
  lowStockThreshold: number;
  autoGenerateSkus: boolean;
  skuSettings?: SkuSettings;
}

export interface PaymentMethodOptions {
  cash: boolean;
  mobileMoney: boolean;
  bankTransfer: boolean;
  card: boolean;
  other: boolean;
}

export interface PaymentMomoDetails {
  mtnNumber?: string;
  mtnAccountName?: string;
  telecelNumber?: string;
  telecelAccountName?: string;
  atNumber?: string;
  atAccountName?: string;
}

export interface PaymentBankDetails {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  branch?: string;
}

export interface PaymentRecordingSettings {
  allowManualRecording: boolean;
  requirePaymentReference: boolean;
  allowPartialPayments: boolean;
  recordSupplierPayments: boolean;
}

export interface SupplierPaymentPreferences {
  enabled: boolean;
  defaultMethods: Array<'momo' | 'bank' | 'cash' | 'card'>;
}

export interface PaymentProviderState {
  connected: boolean;
  publicKey?: string;
  secretKey?: string;
  merchantAccountOrPosId?: string;
  isLive?: boolean;
}

export interface P2PAccount {
  id: string;
  type: 'mtn_momo' | 'telecel_cash' | 'at_money' | 'bank' | 'other';
  providerName: string; // e.g. "MTN Mobile Money", "Stanbic Bank", "OPay"
  accountNumber: string;
  accountName: string;
  bankBranch?: string;
  isPrimary?: boolean;
}

export interface PaymentSettings {
  methods: PaymentMethodOptions;
  p2pAccounts?: P2PAccount[];
  momoDetails?: PaymentMomoDetails;
  bankDetails?: PaymentBankDetails;
  codMaxOrderAmount: number;
  paymentInstructions?: string;
  providers: {
    paystack: PaymentProviderState;
    hubtel: PaymentProviderState;
  };
  defaultOrderGateway?: 'hubtel' | 'paystack';
  currency: string;
  recording: PaymentRecordingSettings;
  supplierPayments: SupplierPaymentPreferences;
  // Backward compatibility fields
  enableMtnMomo?: boolean;
  enableTelecelCash?: boolean;
  enableAtMoney?: boolean;
  enableCards?: boolean;
  enableCod?: boolean;
}

export interface SupplierSettings {
  procurementEmail: string;
  enableAutoPos: boolean;
  receivingInstructions: string;
  poPrefix?: string;
  defaultCurrency?: string;
  paymentTerms?: 'immediate' | 'net15' | 'net30' | 'net60';
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

export interface WhatsAppChannelConfig {
  connected: boolean;
  phoneNumber: string;
  businessAccountId?: string;
  phoneNumberId?: string;
  apiKeyOrToken?: string;
  webhookVerifyToken?: string;
  enableFloatingStorefrontWidget: boolean;
  widgetGreeting?: string;
  connectionType?: 'cloud_api' | 'direct_link';
}

export interface InstagramChannelConfig {
  connected: boolean;
  handle: string;
  pageId?: string;
  accessToken?: string;
  syncDirectMessages: boolean;
  syncStoryMentions: boolean;
}

export interface MessengerChannelConfig {
  connected: boolean;
  pageId: string;
  pageName?: string;
  accessToken?: string;
  syncMessages: boolean;
}

export interface TelegramChannelConfig {
  connected: boolean;
  botToken?: string;
  botUsername?: string;
  channelChatId?: string;
  orderNotificationAlerts: boolean;
}

export interface ChannelSettings {
  whatsapp: WhatsAppChannelConfig;
  instagram: InstagramChannelConfig;
  messenger: MessengerChannelConfig;
  telegram: TelegramChannelConfig;
  webhookUrl: string;
  // Backward compatibility fields
  whatsappConnected?: boolean;
  whatsappPhone?: string;
  instagramConnected?: boolean;
  instagramHandle?: string;
  messengerConnected?: boolean;
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

export interface AiAgentSettings {
  enabled: boolean;
  mode: 'assisted' | 'autonomous';
  responseTone: 'friendly' | 'professional' | 'concise';
  groundingEnabled: boolean;
  safetyTier?: 'standard' | 'strict';
}

export interface AutomationSettings {
  welcomeMessageEnabled: boolean;
  welcomeGreeting: string;
  awayMessageEnabled: boolean;
  awayMessage: string;
  rules: KeywordRule[];
  aiAgent?: AiAgentSettings;
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

export interface BusinessIdentityData {
  businessName: string;
  tradingName: string;
  handle: string;
  category: string;
  description: string;
  logoUrl: string;
}

export interface BusinessContactData {
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  country: string;
  website: string;
}

export interface BusinessSocialLinks {
  instagram: string;
  tiktok: string;
  twitter: string;
  facebook: string;
  whatsapp: string;
}

export interface BusinessPublicInfoData {
  storefrontUrl: string;
  customDomain?: string;
  socials: BusinessSocialLinks;
  serviceAreas: string;
  businessHoursSummary?: string;
}

export interface BusinessIntelligenceGrounding {
  aboutBusiness: string;
  whatWeSell: string;
  deliveryInfo: string;
  returnPolicy: string;
  customerPolicies: string;
}

export interface BusinessVerificationInfo {
  status: 'unverified' | 'pending' | 'verified';
  taxId: string;
  legalEntityName: string;
  verifiedAt?: string | null;
}

export interface BusinessProfileData {
  identity: BusinessIdentityData;
  contact: BusinessContactData;
  publicInfo: BusinessPublicInfoData;
  intelligence: BusinessIntelligenceGrounding;
  verification: BusinessVerificationInfo;
}

export type SubscriptionTier = 'starter' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';

export interface SubscriptionUsageMeter {
  label: string;
  current: number;
  limit: number; // -1 for unlimited
  unit: string;
}

export interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  planName: string;
  receiptUrl?: string;
}

export interface SubscriptionPaymentMethod {
  type: 'mtn_momo' | 'telecel_cash' | 'card';
  identifier: string; // e.g. "•••• 4567" or "024 123 4567"
  holderName?: string;
  isVerified: boolean;
  authorizationCode?: string;
  brand?: string; // 'visa' | 'mastercard' | 'mtn' | 'telecel'
  last4?: string;
  expMonth?: string;
  expYear?: string;
  provider?: 'paystack' | 'hubtel';
  verifiedAt?: string;
}

export interface SubscriptionSettings {
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled';
  renewalDate: string;
  monthlyPrice: number;
  annualPrice: number;
  paymentMethod?: SubscriptionPaymentMethod | null;
  usage: {
    products: SubscriptionUsageMeter;
    staffSeats: SubscriptionUsageMeter;
    botMessages: SubscriptionUsageMeter;
  };
  invoices: BillingInvoice[];
  isTrial?: boolean;
}
