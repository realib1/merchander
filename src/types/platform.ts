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

export interface PlatformTenantSubscription {
  tier: 'free' | 'starter' | 'growth' | 'business' | 'enterprise';
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
  connectedProviders?: string[];
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
  projectedARR: number;
  tierCounts: {
    free: number;
    starter: number;
    growth: number;
    business: number;
    enterprise: number;
  };
  tierRevenue: {
    free: number;
    starter: number;
    growth: number;
    business: number;
    enterprise: number;
  };
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

export interface PlatformRevenueMetrics {
  grossPlatformRevenue: number;
  subscriptionMRR: number;
  projectedARR: number;
  netRevenueGHS: number;
  churnRatePercent: number;
  arpuGHS: number;
  failedBillingCount: number;
  revenueByPlan: Array<{
    planSlug: string;
    planName: string;
    mrr: number;
    subscriberCount: number;
  }>;
  revenueByPeriod: Array<{
    period: string;
    revenue: number;
    subscribers: number;
  }>;
}


export interface DomainInfrastructureItem {
  id: string;
  tenantId: string;
  tenantName: string;
  domain: string;
  type: 'subdomain' | 'custom';
  dnsStatus: 'verified' | 'pending' | 'failed';
  sslStatus: 'active' | 'provisioning' | 'expired';
  targetHost: string;
  sslExpiresAt?: string;
  lastVerifiedAt: string;
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
