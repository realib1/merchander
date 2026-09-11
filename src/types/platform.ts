export type PlatformRole =
  | 'platform_owner'
  | 'platform_admin'
  | 'operations'
  | 'support'
  | 'finance'
  | 'tech_admin'
  | 'compliance';

export interface PlatformStaffUser {
  id: string;
  user_id: string;
  email: string;
  role: PlatformRole;
  is_active: boolean;
  mfa_enabled: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type TenantPlatformStatus =
  | 'trial'
  | 'active'
  | 'past_due'
  | 'restricted'
  | 'suspended'
  | 'closed'
  | 'maintenance';

export interface PlatformTenantStore {
  id: string;
  name: string;
  location?: string | null;
  is_primary?: boolean;
}

/** `none` means the tenant has no `tenant_subscriptions` row at all - an
 *  operational gap to surface, not a tier to silently default. */
export type PlatformTier = 'none' | 'free' | 'starter' | 'growth' | 'business' | 'enterprise';

export interface PlatformTenantSubscription {
  tier: PlatformTier;
  billingCycle: 'monthly' | 'annual';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  priceMonthly: number;
  renewalDate: string;
  paymentMethod?: {
    type?: string;
    identifier?: string;
    isVerified?: boolean;
  };
}

export interface PlatformTenant {
  id: string;
  name: string;
  slug?: string;
  email?: string;
  phone?: string;
  country?: string;
  createdAt: string;
  status: TenantPlatformStatus;
  stores: PlatformTenantStore[];
  subscription: PlatformTenantSubscription;
  productCount: number;
  orderCount: number;
  totalGmv: number;
  connectedChannels?: string[];
  customDomain?: string | null;
  supportTicketCount?: number;
  lastActivityAt?: string;
}

export interface PlatformOverviewKPIs {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  pastDueTenants: number;
  suspendedTenants: number;
  payingTenants: number;
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
  totalGMV: number;
  platformMRR: number;
  tierCounts: Record<PlatformTier, number>;
  tierRevenue: Record<PlatformTier, number>;
  unprovisionedTenants: number;
  activeIntegrationsCount: number;
  integrationFailuresCount: number;
  openTicketsCount: number;
  urgentTicketsCount: number;
  activeIncidentsCount: number;
  aiTokensProcessedMonthly: number;
  aiEstimatedCostMonthly: number;
}


export interface PlatformEntitlements {
  max_products: number;
  max_monthly_orders: number;
  max_staff_seats: number;
  custom_domain_allowed: boolean;
  ai_queries_monthly: number;
  priority_support: boolean;
}

export interface PlatformPlan {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price_ghs: number;
  price_usd: number;
  billing_cycle: 'monthly' | 'annual';
  entitlements: PlatformEntitlements;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Every field here is derived from `tenant_subscriptions` rows. No billing
 * provider is connected, so this is contracted revenue, never collected
 * revenue. Net revenue, churn and historical series need a billing ledger and
 * are deliberately absent rather than estimated.
 */
export interface PlatformRevenueMetrics {
  contractedMRR: number;
  revenueByPlan: Array<{
    planSlug: string;
    planName: string;
    mrr: number;
    subscriberCount: number;
  }>;
}


/**
 * What the merchant has configured. DNS and certificate state are not probed
 * yet, so no status field exists here - see the Domains page notice.
 */
export interface DomainInfrastructureItem {
  id: string;
  tenantId: string;
  tenantName: string;
  domain: string;
  type: 'subdomain' | 'custom';
}


export type BroadcastType = 'info' | 'announcement' | 'maintenance' | 'warning' | 'security';
export type BroadcastTarget = 'all' | 'free' | 'starter' | 'growth' | 'business' | 'enterprise';

export interface PlatformBroadcast {
  id: string;
  title: string;
  message: string;
  type: BroadcastType;
  target: BroadcastTarget;
  target_country?: string;
  action_label?: string;
  action_url?: string;
  is_pinned: boolean;
  is_active: boolean;
  starts_at: string;
  expires_at?: string | null;
  created_by?: string;
  created_at: string;
}

export interface PlatformSupportTicket {
  id: string;
  tenant_id: string;
  tenant_name?: string;
  merchant_email: string;
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_for_merchant' | 'escalated' | 'resolved' | 'closed';
  category: 'billing' | 'whatsapp_connector' | 'payments' | 'domain' | 'inventory' | 'general';
  assigned_to?: string | null;
  internal_notes?: Array<{
    author: string;
    note: string;
    created_at: string;
  }>;
  sla_breached: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id?: string;
  actor_email: string;
  actor_role: PlatformRole | string;
  action: string;
  target_type:
    | 'tenant'
    | 'subscription'
    | 'plan'
    | 'connector'
    | 'domain'
    | 'support_ticket'
    | 'broadcast'
    | 'incident'
    | 'staff_role'
    | 'security_event'
    | 'system_config';
  target_id: string;
  target_name?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface PlatformSettings {
  id: number;
  platform_name: string;
  support_email: string | null;
  default_currency: string;
  maintenance_mode: boolean;
  disable_new_signups: boolean;
  integrations: Record<string, unknown>;
  updated_at: string;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  id: 1,
  platform_name: 'Merchander',
  support_email: 'support@merchander.com',
  default_currency: 'GHS',
  maintenance_mode: false,
  disable_new_signups: false,
  integrations: {},
  updated_at: new Date().toISOString(),
};

export interface CreateMerchanderPayload {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerName?: string;
  ownerPhone?: string;
  password?: string;
  tier: PlatformTier;
  billingCycle?: 'monthly' | 'annual';
  businessType?: 'grocery' | 'importer' | 'boutique' | 'general';
  enabledModules?: Record<string, boolean>;
  branchName?: string;
  city?: string;
}

export interface CreateMerchanderResult {
  success: boolean;
  tenantId?: string;
  credentials?: {
    storeName: string;
    slug: string;
    subdomainUrl: string;
    portalUrl: string;
    ownerEmail: string;
    temporaryPassword: string;
    tier: PlatformTier;
  };
  error?: string;
}

