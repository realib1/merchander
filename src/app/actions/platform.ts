'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import {
  PlatformTenant,
  PlatformOverviewKPIs,
  TenantPlatformStatus,
  PlatformRole,
  PlatformPlan,
  PlatformRevenueMetrics,
  DomainInfrastructureItem,
  PlatformTier,
  CreateMerchanderPayload,
  CreateMerchanderResult,
} from '@/types/platform';
import { SystemIncident, SupportAccessGrant } from '@/types/support';
import { logPlatformAuditAction } from './platform-audit';
import { getPlatformStaffRecord, PLATFORM_RBAC_RULES, PLATFORM_PLAN_READ_ROLES } from '@/lib/auth/platform-staff';
import {
  cleanSlug,
  validateMerchantSlug,
  validateOwnerEmail,
  generateInitialPassword,
} from '@/utils/merchant-provisioning';



/**
 * Verify platform staff role with least-privilege checks
 */
export async function verifyPlatformStaff(allowedRoles?: PlatformRole[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }

  const staff = await getPlatformStaffRecord(createAdminClient(), user.id);

  if (!staff) {
    throw new Error('Forbidden: Platform administration privileges required');
  }

  if (!staff.is_active) {
    throw new Error('Forbidden: Platform staff account is deactivated');
  }

  const userRole: PlatformRole = staff.role;

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole) && userRole !== 'platform_owner') {
      throw new Error(`Forbidden: Role '${userRole}' does not have permission for this action`);
    }
  }

  return { user, role: userRole };
}

type AdminClient = ReturnType<typeof createAdminClient>;
type PlatformAuthUser = Awaited<ReturnType<AdminClient['auth']['admin']['listUsers']>>['data']['users'][number];

/**
 * Page through every auth user for the platform console. `listUsers` caps a
 * single call at its page size, so a bare call silently drops users past the
 * first page (finding F-13).
 */
async function listAllPlatformAuthUsers(admin: AdminClient): Promise<PlatformAuthUser[]> {
  const users: PlatformAuthUser[] = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error('Error listing platform auth users:', error);
      break;
    }
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < 1000) break;
  }
  return users;
}

/**
 * 1. Overview & Merchants: Fetch real platform data from database
 */
export async function getPlatformOverviewData(): Promise<{
  tenants: PlatformTenant[];
  kpis: PlatformOverviewKPIs;
  error?: string;
}> {
  try {
    await verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform']);
    const adminSupabase = createAdminClient();

    // Bounded selects (tenants, staff, settings, channels, subscriptions,
    // incidents) plus one aggregate RPC that replaces the old whole-table scans
    // of `orders` and `products` (finding F-13).
    const [
      tenantsRes,
      authUsers,
      tenantUsersRes,
      settingsRes,
      storefrontRes,
      channelConnectionsRes,
      incidentsRes,
      subscriptionsRes,
      snapshotRes,
    ] = await Promise.all([
      adminSupabase
        .from('tenants')
        .select('id, name, created_at, stores(id, name, location, is_primary)')
        .order('created_at', { ascending: false }),
      listAllPlatformAuthUsers(adminSupabase),
      adminSupabase.from('tenant_users').select('tenant_id, user_id, role'),
      adminSupabase
        .from('tenant_settings')
        .select('tenant_id, store_email, business_phone, business_country, settings_data'),
      // store_name / slug / custom_domain live on storefront_settings, not tenant_settings.
      adminSupabase.from('storefront_settings').select('tenant_id, store_name, slug, custom_domain'),
      adminSupabase.from('channel_connections').select('tenant_id, channel, status'),
      adminSupabase.from('platform_incidents').select('*').eq('is_active', true),
      adminSupabase.from('tenant_subscriptions').select('tenant_id, tier, status, billing_cycle, price_monthly, renewal_date, payment_method'),
      adminSupabase.rpc('get_platform_overview_snapshot'),
    ]);

    interface OverviewSnapshot {
      tenant_stats: Array<{ tenant_id: string; order_count: number; gmv: number; product_count: number }>;
      totals: { total_orders: number; total_products: number; total_gmv: number };
    }
    const snapshot: OverviewSnapshot = (snapshotRes.data as OverviewSnapshot | null) ?? {
      tenant_stats: [],
      totals: { total_orders: 0, total_products: 0, total_gmv: 0 },
    };
    if (snapshotRes.error) {
      console.error('Error fetching platform overview snapshot:', snapshotRes.error);
    }

    if (tenantsRes.error) {
      console.error('Error fetching tenants for admin:', tenantsRes.error);
    }
    if (settingsRes.error) {
      console.error('Error fetching tenant settings for admin:', settingsRes.error);
    }
    if (storefrontRes.error) {
      console.error('Error fetching storefront settings for admin:', storefrontRes.error);
    }

    // Storefront identity (name / slug / custom domain) keyed by tenant.
    const storefrontMap = new Map<string, { storeName: string; slug: string; customDomain: string | null }>();
    (storefrontRes.data || []).forEach((sf) => {
      storefrontMap.set(sf.tenant_id, {
        storeName: sf.store_name || '',
        slug: sf.slug || '',
        customDomain: sf.custom_domain || null,
      });
    });

    // Map auth users
    const authUsersMap = new Map<
      string,
      { email: string; name: string; phone: string }
    >();
    authUsers.forEach((u) => {
      const meta = (u.user_metadata as Record<string, unknown>) || {};
      const fullName = (meta.full_name as string) || (meta.name as string) || '';
      const phone = (meta.phone as string) || u.phone || '';
      authUsersMap.set(u.id, {
        email: u.email || '',
        name: fullName,
        phone,
      });
    });

    // Map tenant owners
    const tenantOwnerMap = new Map<
      string,
      { email: string; name: string; phone: string }
    >();
    (tenantUsersRes.data || []).forEach((tu) => {
      if (tu.role === 'owner' || !tenantOwnerMap.has(tu.tenant_id)) {
        const userInfo = authUsersMap.get(tu.user_id);
        if (userInfo) {
          tenantOwnerMap.set(tu.tenant_id, userInfo);
        }
      }
    });

    // Per-tenant product / order / GMV counts come from the aggregate RPC.
    const productCountMap = new Map<string, number>();
    const orderCountMap = new Map<string, number>();
    const gmvMap = new Map<string, number>();
    snapshot.tenant_stats.forEach((s) => {
      productCountMap.set(s.tenant_id, Number(s.product_count) || 0);
      orderCountMap.set(s.tenant_id, Number(s.order_count) || 0);
      gmvMap.set(s.tenant_id, Number(s.gmv) || 0);
    });
    const totalPlatformGMV = Number(snapshot.totals.total_gmv) || 0;

    // Map subscriptions
    interface TenantSubRow {
      tenant_id: string;
      tier: 'free' | 'starter' | 'growth' | 'business' | 'enterprise';
      status: 'active' | 'past_due' | 'canceled' | 'trialing';
      billing_cycle: 'monthly' | 'annual';
      price_monthly: number;
      renewal_date: string;
      payment_method?: { type?: string; identifier?: string; isVerified?: boolean };
    }
    const subscriptionsMap = new Map<string, TenantSubRow>();
    ((subscriptionsRes.data as TenantSubRow[] | null) || []).forEach((s) => {
      subscriptionsMap.set(s.tenant_id, s);
    });

    // Map channel connections
    const channelMap = new Map<string, string[]>();
    (channelConnectionsRes.data || []).forEach((cc) => {
      const list = channelMap.get(cc.tenant_id) || [];
      if (cc.status === 'connected') {
        list.push(cc.channel);
        channelMap.set(cc.tenant_id, list);
      }
    });

    // Map tenant settings & support tickets
    const settingsMap = new Map<
      string,
      {
        email: string;
        phone: string;
        country: string;
        customData: Record<string, unknown>;
      }
    >();

    let openTicketsCount = 0;
    let urgentTicketsCount = 0;

    (settingsRes.data || []).forEach((s) => {
      const customData = (s.settings_data as Record<string, unknown>) || {};
      settingsMap.set(s.tenant_id, {
        email: s.store_email || '',
        phone: s.business_phone || '',
        country: s.business_country || 'GH',
        customData,
      });

      const tickets = (customData.support_tickets as Array<{ status: string; priority: string }>) || [];
      tickets.forEach((t) => {
        if (t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_for_merchant') {
          openTicketsCount++;
        }
        if (t.priority === 'urgent') {
          urgentTicketsCount++;
        }
      });
    });

    let totalMRR = 0;
    let activeTenantsCount = 0;
    let trialTenantsCount = 0;
    let pastDueTenantsCount = 0;
    let suspendedTenantsCount = 0;
    let payingTenantsCount = 0;

    const tierCounts: Record<PlatformTier, number> = {
      none: 0,
      free: 0,
      starter: 0,
      growth: 0,
      business: 0,
      enterprise: 0,
    };

    const tierRevenue: Record<PlatformTier, number> = {
      none: 0,
      free: 0,
      starter: 0,
      growth: 0,
      business: 0,
      enterprise: 0,
    };

    const enrichedTenants: PlatformTenant[] = (tenantsRes.data || []).map((t) => {
      const set = settingsMap.get(t.id);
      const storefront = storefrontMap.get(t.id);
      const owner = tenantOwnerMap.get(t.id);
      const customData = set?.customData || {};
      const provisionedName = (customData.store_name as string) || '';
      const sub = subscriptionsMap.get(t.id);

      // No subscription row is a real state, not a Starter.
      const tier: PlatformTier = sub?.tier ?? 'none';
      const cycle = (sub?.billing_cycle || 'monthly') as 'monthly' | 'annual';
      const subStatus = (sub?.status || 'active') as 'active' | 'past_due' | 'canceled' | 'trialing';
      const platformStatus = ((customData.platform_status as string) || 'active') as TenantPlatformStatus;

      // Real pricing matrix
      const priceMonthly = Number(sub?.price_monthly || 0);

      if (platformStatus === 'active') activeTenantsCount++;
      else if (platformStatus === 'trial') trialTenantsCount++;
      else if (platformStatus === 'past_due') pastDueTenantsCount++;
      else if (platformStatus === 'suspended') suspendedTenantsCount++;

      tierCounts[tier]++;
      tierRevenue[tier] += priceMonthly;

      if (subStatus === 'active' && priceMonthly > 0) {
        totalMRR += priceMonthly;
        payingTenantsCount++;
      }

      const storesList = Array.isArray(t.stores) ? t.stores : [];
      const channels = channelMap.get(t.id) || [];

      return {
        id: t.id,
        name: t.name || storefront?.storeName || provisionedName || 'Merchant Store',
        slug: storefront?.slug || '',
        email: owner?.email || set?.email || '',
        phone: owner?.phone || set?.phone || '',
        country: set?.country || 'GH',
        createdAt: t.created_at,
        status: platformStatus,
        stores: storesList,
        subscription: {
          tier,
          billingCycle: cycle,
          status: subStatus,
          priceMonthly,
          renewalDate: sub?.renewal_date || 'Continuous Access',
          paymentMethod: sub?.payment_method,
        },
        productCount: productCountMap.get(t.id) || 0,
        orderCount: orderCountMap.get(t.id) || 0,
        totalGmv: gmvMap.get(t.id) || 0,
        connectedChannels: channels,
        customDomain: storefront?.customDomain || null,
      };
    });

    const totalStores = enrichedTenants.reduce((acc, curr) => acc + Math.max(curr.stores.length, 1), 0);

    const kpis: PlatformOverviewKPIs = {
      totalTenants: enrichedTenants.length,
      activeTenants: activeTenantsCount,
      trialTenants: trialTenantsCount,
      pastDueTenants: pastDueTenantsCount,
      suspendedTenants: suspendedTenantsCount,
      payingTenants: payingTenantsCount,
      totalStores,
      totalProducts: Number(snapshot.totals.total_products) || 0,
      totalOrders: Number(snapshot.totals.total_orders) || 0,
      totalGMV: totalPlatformGMV,
      platformMRR: totalMRR,
      tierCounts,
      tierRevenue,
      unprovisionedTenants: tierCounts.none,
      activeIntegrationsCount: (channelConnectionsRes.data || []).filter((c) => c.status === 'connected').length,
      integrationFailuresCount: (channelConnectionsRes.data || []).filter((c) => c.status === 'error').length,
      openTicketsCount,
      urgentTicketsCount,
      activeIncidentsCount: (incidentsRes.data || []).length,
      aiTokensProcessedMonthly: 0,
      aiEstimatedCostMonthly: 0,
    };

    return { tenants: enrichedTenants, kpis };
  } catch (err) {
    console.error('Error in getPlatformOverviewData:', err);
    return {
      tenants: [],
      kpis: {
        totalTenants: 0,
        activeTenants: 0,
        trialTenants: 0,
        pastDueTenants: 0,
        suspendedTenants: 0,
        payingTenants: 0,
        totalStores: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalGMV: 0,
        platformMRR: 0,
        tierCounts: { none: 0, free: 0, starter: 0, growth: 0, business: 0, enterprise: 0 },
        tierRevenue: { none: 0, free: 0, starter: 0, growth: 0, business: 0, enterprise: 0 },
        unprovisionedTenants: 0,
        activeIntegrationsCount: 0,
        integrationFailuresCount: 0,
        openTicketsCount: 0,
        urgentTicketsCount: 0,
        activeIncidentsCount: 0,
        aiTokensProcessedMonthly: 0,
        aiEstimatedCostMonthly: 0,
      },
      error: err instanceof Error ? err.message : 'Failed to fetch platform overview',
    };
  }
}

/**
 * 2. Merchants: Fetch single merchant context backed 100% by database records
 */
export async function getMerchantContextAction(
  tenantId: string,
  reason: string,
  ticketId?: string
): Promise<{
  tenant?: PlatformTenant;
  activeGrant?: SupportAccessGrant | null;
  auditTrail?: Array<{ event: string; actor: string; timestamp: string }>;
  error?: string;
}> {
  try {
    const { user, role } = await verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/merchants']);
    const adminSupabase = createAdminClient();

    // 1. Audit this merchant context inspection in immutable audit logs
    await logPlatformAuditAction({
      action: 'INSPECT_MERCHANT_CONTEXT',
      target_type: 'tenant',
      target_id: tenantId,
      reason: reason || 'Merchant Support Diagnosis',
      metadata: { ticketId, staffEmail: user.email, staffRole: role },
    });

    const nowIso = new Date().toISOString();

    const [
      tenantRes,
      settingRes,
      storefrontRes,
      productsRes,
      ordersRes,
      channelsRes,
      logsRes,
      grantRes,
      subRes,
    ] = await Promise.all([
      adminSupabase.from('tenants').select('id, name, created_at, stores(*)').eq('id', tenantId).single(),
      adminSupabase.from('tenant_settings').select('*').eq('tenant_id', tenantId).maybeSingle(),
      adminSupabase
        .from('storefront_settings')
        .select('store_name, slug, custom_domain')
        .eq('tenant_id', tenantId)
        .maybeSingle(),
      adminSupabase.from('products').select('id', { count: 'exact' }).eq('tenant_id', tenantId),
      adminSupabase
        .from('orders')
        .select('id, total_amount, status', { count: 'exact' })
        .eq('tenant_id', tenantId),
      adminSupabase.from('channel_connections').select('channel, status').eq('tenant_id', tenantId),
      adminSupabase
        .from('platform_audit_logs')
        .select('action, actor_email, created_at')
        .eq('target_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10),
      adminSupabase
        .from('platform_support_access_grants')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: false })
        .maybeSingle(),
      adminSupabase.from('tenant_subscriptions').select('*').eq('tenant_id', tenantId).maybeSingle(),
    ]);

    if (!tenantRes.data) {
      return { error: 'Tenant not found' };
    }

    const tenant = tenantRes.data;
    const setting = settingRes.data;
    const storefront = storefrontRes.data;
    const customData = (setting?.settings_data as Record<string, unknown>) || {};
    const provisionedName = (customData.store_name as string) || '';
    const sub = subRes?.data || {};
    const platformStatus = ((customData.platform_status as string) || 'active') as TenantPlatformStatus;

    let totalGmv = 0;
    (ordersRes.data || []).forEach((o) => {
      if (o.status === 'paid' || o.status === 'completed' || o.status === 'delivered') totalGmv += Number(o.total_amount || 0);
    });

    const connectedChannels = (channelsRes.data || [])
      .filter((c) => c.status === 'connected')
      .map((c) => c.channel);

    const formattedTenant: PlatformTenant = {
      id: tenant.id,
      name: tenant.name || storefront?.store_name || provisionedName || 'Store',
      slug: storefront?.slug || '',
      email: setting?.store_email || '',
      phone: setting?.business_phone || '',
      country: setting?.business_country || 'GH',
      createdAt: tenant.created_at,
      status: platformStatus,
      stores: Array.isArray(tenant.stores) ? tenant.stores : [],
      subscription: {
        tier: (sub.tier as PlatformTier) ?? 'none',
        billingCycle: (sub.billing_cycle as 'monthly' | 'annual') || 'monthly',
        status: (sub.status as PlatformTenant['subscription']['status']) || 'active',
        priceMonthly: Number(sub.price_monthly || 0),
        renewalDate: (sub.renewal_date as string) || 'Continuous Access',
        paymentMethod: sub.payment_method as PlatformTenant['subscription']['paymentMethod'],
      },
      productCount: productsRes.count || 0,
      orderCount: ordersRes.count || 0,
      totalGmv,
      customDomain: storefront?.custom_domain || null,
      connectedChannels,
    };

    const auditTrail = (logsRes.data || []).map((l) => ({
      event: l.action,
      actor: l.actor_email,
      timestamp: l.created_at,
    }));

    const grantData = grantRes.data;
    const activeGrant: SupportAccessGrant | null = grantData
      ? {
          id: grantData.id,
          tenant_id: grantData.tenant_id,
          granted_by: grantData.granted_by,
          ticket_id: grantData.ticket_id,
          reason: grantData.reason,
          duration_hours: grantData.duration_hours,
          status: 'active',
          expires_at: grantData.expires_at,
          created_at: grantData.created_at,
        }
      : null;

    return { tenant: formattedTenant, activeGrant, auditTrail };
  } catch (err) {
    console.error('Error fetching merchant context:', err);
    return { error: err instanceof Error ? err.message : 'Failed to fetch merchant context' };
  }
}

/**
 * 3. Plans & Billing: Fetch Platform Commercial Plans from database
 */
export async function getPlatformPlansAction(): Promise<{ plans: PlatformPlan[]; error?: string }> {
  try {
    await verifyPlatformStaff(PLATFORM_PLAN_READ_ROLES);
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('platform_plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Platform plans table query error:', error.message);
      return { plans: [] };
    }

    const formatted: PlatformPlan[] = (data || []).map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      price_ghs: Number(p.price_ghs),
      price_usd: Number(p.price_usd),
      billing_cycle: p.billing_cycle,
      entitlements: p.entitlements || {},
      is_active: p.is_active,
      sort_order: p.sort_order,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    return { plans: formatted };
  } catch (err) {
    console.error('Error fetching platform plans:', err);
    return { plans: [], error: err instanceof Error ? err.message : 'Failed to fetch plans' };
  }
}

/**
 * 4. Revenue: Fetch real platform revenue metrics calculated from database subscriptions
 */
export async function getPlatformRevenueMetricsAction(): Promise<{
  metrics: PlatformRevenueMetrics;
  error?: string;
}> {
  try {
    await verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/revenue']);
    const adminSupabase = createAdminClient();

    const [overview, plansRes] = await Promise.all([
      getPlatformOverviewData(),
      adminSupabase.from('platform_plans').select('slug, name, sort_order').order('sort_order', { ascending: false }),
    ]);
    const kpis = overview.kpis;

    // Plan display names come from platform_plans; the console must not carry a
    // second copy of the commercial catalogue.
    const revenueByPlan = (plansRes.data || [])
      .filter((p) => p.slug in kpis.tierRevenue)
      .map((p) => {
        const slug = p.slug as keyof typeof kpis.tierRevenue;
        return {
          planSlug: p.slug,
          planName: p.name,
          mrr: kpis.tierRevenue[slug],
          subscriberCount: kpis.tierCounts[slug],
        };
      });

    return {
      metrics: {
        contractedMRR: kpis.platformMRR,
        revenueByPlan,
      },
    };
  } catch (err) {
    console.error('Error fetching revenue metrics:', err);
    return {
      metrics: {
        contractedMRR: 0,
        revenueByPlan: [],
      },
      error: err instanceof Error ? err.message : 'Failed to fetch revenue metrics',
    };
  }
}

/**
 * 6. Domains: Real domain records from database
 */
export async function getDomainInfrastructureAction(): Promise<{
  domains: DomainInfrastructureItem[];
  error?: string;
}> {
  try {
    await verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/domains']);
    const adminSupabase = createAdminClient();

    const [
      { data: settings },
      { data: tenants },
    ] = await Promise.all([
      adminSupabase.from('storefront_settings').select('tenant_id, store_name, slug, custom_domain'),
      adminSupabase.from('tenants').select('id, name'),
    ]);

    const tenantMap = new Map<string, string>();
    (tenants || []).forEach((t) => tenantMap.set(t.id, t.name));

    const domainList: DomainInfrastructureItem[] = [];

    (settings || []).forEach((s) => {
      const tName = tenantMap.get(s.tenant_id) || s.store_name || 'Merchant';

      if (s.slug) {
        domainList.push({
          id: `sub_${s.tenant_id}`,
          tenantId: s.tenant_id,
          tenantName: tName,
          domain: `${s.slug}.merchander.app`,
          type: 'subdomain',
        });
      }

      if (s.custom_domain) {
        domainList.push({
          id: `cust_${s.tenant_id}`,
          tenantId: s.tenant_id,
          tenantName: tName,
          domain: s.custom_domain,
          type: 'custom',
        });
      }
    });

    return { domains: domainList };
  } catch (err) {
    console.error('Error fetching domain infrastructure:', err);
    return { domains: [], error: err instanceof Error ? err.message : 'Failed to fetch domain records' };
  }
}



/**
 * Admin: Override a tenant's subscription plan tier
 */
export async function updateTenantPlanAction(
  tenantId: string,
  tier: 'free' | 'starter' | 'growth' | 'business' | 'enterprise',
  billingCycle: 'monthly' | 'annual' = 'monthly',
  reason?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user, role } = await verifyPlatformStaff(['platform_owner', 'platform_admin']);
    const adminSupabase = createAdminClient();

    // Price comes from platform_plans, never a second copy of the catalogue.
    const { data: plan } = await adminSupabase
      .from('platform_plans')
      .select('price_ghs')
      .eq('slug', tier)
      .maybeSingle();

    if (!plan) {
      return { error: `No plan configured for tier "${tier}". Add it in Plans & Billing first.` };
    }

    const price = Number(plan.price_ghs);
    const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await adminSupabase.from('tenant_subscriptions').upsert(
      {
        tenant_id: tenantId,
        tier,
        billing_cycle: billingCycle,
        price_monthly: price,
        status: 'active',
        renewal_date: renewalDate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    );

    // Write immutable audit log
    await logPlatformAuditAction({
      action: 'OVERRIDE_TENANT_PLAN',
      target_type: 'subscription',
      target_id: tenantId,
      reason: reason || `Plan tier updated to ${tier} by ${role}`,
      metadata: { newTier: tier, price, actorEmail: user.email },
    });

    revalidatePath('/platform');
    revalidatePath('/platform/plans-billing');
    revalidatePath('/platform/merchants');
    return { success: true };
  } catch (err) {
    console.error('Error updating tenant plan:', err);
    return { error: err instanceof Error ? err.message : 'Failed to update tenant plan' };
  }
}

/**
 * Admin: Update tenant platform status (suspend, reactivate, restrict)
 */
export async function updateTenantStatusAction(
  tenantId: string,
  status: TenantPlatformStatus,
  reason?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user, role } = await verifyPlatformStaff(['platform_owner', 'platform_admin', 'operations']);
    const adminSupabase = createAdminClient();

    const { data: settings } = await adminSupabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const currentData = (settings?.settings_data as Record<string, unknown>) || {};

    await adminSupabase.from('tenant_settings').upsert(
      {
        tenant_id: tenantId,
        settings_data: {
          ...currentData,
          platform_status: status,
          status_modified_at: new Date().toISOString(),
          status_modified_by: user.email,
          status_reason: reason || 'Platform policy enforcement',
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    );

    // Audit log
    await logPlatformAuditAction({
      action: `TENANT_STATUS_${status.toUpperCase()}`,
      target_type: 'tenant',
      target_id: tenantId,
      reason: reason || `Status set to ${status} by ${role}`,
      metadata: { newStatus: status, actorEmail: user.email },
    });

    revalidatePath('/platform');
    revalidatePath('/platform/merchants');
    return { success: true };
  } catch (err) {
    console.error('Error updating tenant status:', err);
    return { error: err instanceof Error ? err.message : 'Failed to update tenant status' };
  }
}

/**
 * Admin: Infrastructure diagnostic probes
 */
export async function getPlatformInfrastructureStatus(): Promise<{
  incidents: SystemIncident[];
  systemMetrics: {
    queryRoundTripMs: number;
    totalRowsEstimate: number;
    activeTenantsCount: number;
  };
  error?: string;
}> {
  try {
    await verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/system-health']);
    const adminSupabase = createAdminClient();

    const startTime = Date.now();
    const [tenantsRes, productsRes, ordersRes, incidentsRes] = await Promise.all([
      adminSupabase.from('tenants').select('id', { count: 'exact', head: true }),
      adminSupabase.from('products').select('id', { count: 'exact', head: true }),
      adminSupabase.from('orders').select('id', { count: 'exact', head: true }),
      adminSupabase.from('platform_incidents').select('*').order('created_at', { ascending: false }),
    ]);
    // Wall time of the four PostgREST round-trips above, not a direct DB probe.
    const queryRoundTripMs = Date.now() - startTime;

    const totalRowsEstimate =
      (tenantsRes.count || 0) + (productsRes.count || 0) + (ordersRes.count || 0);

    const formattedIncidents: SystemIncident[] = (incidentsRes.data || []).map((i) => ({
      id: i.id,
      service: i.service,
      status: i.status,
      title: i.title,
      message: i.message,
      affected_areas: i.affected_areas || [],
      is_active: i.is_active,
      created_at: i.created_at,
      updated_at: i.updated_at,
    }));

    return {
      incidents: formattedIncidents,
      systemMetrics: {
        queryRoundTripMs,
        totalRowsEstimate,
        activeTenantsCount: tenantsRes.count || 0,
      },
    };
  } catch (err) {
    console.error('Error fetching infrastructure status:', err);
    return {
      incidents: [],
      systemMetrics: {
        queryRoundTripMs: 0,
        totalRowsEstimate: 0,
        activeTenantsCount: 0,
      },
      error: err instanceof Error ? err.message : 'Failed to fetch infrastructure status',
    };
  }
}

/**
 * Admin: Publish or update a system incident
 */
export async function createOrUpdateSystemIncident(
  incident: Omit<SystemIncident, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user } = await verifyPlatformStaff(['platform_owner', 'platform_admin', 'operations', 'tech_admin']);
    const adminSupabase = createAdminClient();

    const now = new Date().toISOString();
    const incidentData = {
      service: incident.service,
      status: incident.status,
      title: incident.title,
      message: incident.message,
      affected_areas: incident.affected_areas || [],
      is_active: incident.is_active !== false,
      created_by: user.id,
      updated_at: now,
    };

    if (incident.id) {
      await adminSupabase.from('platform_incidents').update(incidentData).eq('id', incident.id);
    } else {
      await adminSupabase.from('platform_incidents').insert({ ...incidentData, created_at: now });
    }

    revalidatePath('/platform/system-health');
    revalidatePath('/dashboard/help');
    return { success: true };
  } catch (err) {
    console.error('Error creating system incident:', err);
    return { error: err instanceof Error ? err.message : 'Failed to publish incident' };
  }
}

/**
 * Admin: Delete or resolve a system incident
 */
export async function deleteSystemIncident(incidentId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    await verifyPlatformStaff(['platform_owner', 'platform_admin', 'operations', 'tech_admin']);
    const adminSupabase = createAdminClient();

    await adminSupabase.from('platform_incidents').delete().eq('id', incidentId);

    revalidatePath('/platform/system-health');
    revalidatePath('/dashboard/help');
    return { success: true };
  } catch (err) {
    console.error('Error deleting system incident:', err);
    return { error: err instanceof Error ? err.message : 'Failed to delete incident' };
  }
}

/**
 * Admin: Platform Merchant Provisioning ("Add Merchander")
 * Complete atomic creation of a merchant workspace, owner user, primary store,
 * business settings, public storefront, and subscription tier.
 */
export async function createMerchanderAction(
  payload: CreateMerchanderPayload
): Promise<CreateMerchanderResult> {
  try {
    const { user, role } = await verifyPlatformStaff(['platform_owner', 'platform_admin', 'operations']);
    const adminSupabase = createAdminClient();

    const cleanName = payload.name?.trim();
    if (!cleanName) {
      return { success: false, error: 'Store name is required.' };
    }

    const cleanEmail = payload.ownerEmail?.trim().toLowerCase();
    const emailValidation = validateOwnerEmail(cleanEmail);
    if (!emailValidation.isValid) {
      return { success: false, error: emailValidation.error || 'Invalid owner email.' };
    }

    // Role separation invariant: Reject platform staff emails to prevent privilege confusion
    const { data: staffMatch } = await adminSupabase
      .from('platform_staff_users')
      .select('id, email, is_active')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (staffMatch) {
      return {
        success: false,
        error: 'Cannot provision a merchant using an active platform staff email.',
      };
    }

    // Slug validation and normalization
    const normalizedSlug = cleanSlug(payload.slug || cleanName);
    const slugValidation = validateMerchantSlug(normalizedSlug);
    if (!slugValidation.isValid) {
      return { success: false, error: slugValidation.error || 'Invalid subdomain slug.' };
    }

    // Subdomain uniqueness guard
    const { data: existingStorefront } = await adminSupabase
      .from('storefront_settings')
      .select('id')
      .eq('slug', normalizedSlug)
      .maybeSingle();

    if (existingStorefront) {
      return {
        success: false,
        error: `Subdomain slug '${normalizedSlug}' is already taken.`,
      };
    }

    const tempPassword = payload.password?.trim() || generateInitialPassword();

    // 1. Create or fetch Auth User
    type ProvisionAuthUser = Awaited<ReturnType<typeof adminSupabase.auth.admin.createUser>>['data']['user'];
    let authUser: ProvisionAuthUser = null;

    const { data: created, error: createErr } = await adminSupabase.auth.admin.createUser({
      email: cleanEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: payload.ownerName?.trim() || cleanName,
        role: 'merchant',
        phone: payload.ownerPhone?.trim(),
      },
    });

    if (createErr) {
      if (createErr.message?.toLowerCase().includes('already') || (createErr as { status?: number }).status === 422) {
        for (let page = 1; page <= 20; page++) {
          const { data: userList } = await adminSupabase.auth.admin.listUsers({ page, perPage: 1000 });
          const match = (userList?.users ?? []).find((u) => u.email?.toLowerCase() === cleanEmail);
          if (match) {
            authUser = match;
            break;
          }
          if ((userList?.users?.length ?? 0) < 1000) break;
        }
      }
      if (!authUser) {
        throw new Error(`Failed to create merchant auth user: ${createErr.message}`);
      }
    } else {
      authUser = created.user;
    }

    if (!authUser) {
      throw new Error('Could not establish merchant auth user identity');
    }

    // 2. Create Tenant record
    const { data: tenant, error: tenantErr } = await adminSupabase
      .from('tenants')
      .insert({ name: cleanName })
      .select('id')
      .single();

    if (tenantErr || !tenant) {
      throw new Error(`Failed to create tenant: ${tenantErr?.message || 'Unknown error'}`);
    }

    // 3. Link Owner Account in tenant_users
    const { error: linkErr } = await adminSupabase.from('tenant_users').insert({
      tenant_id: tenant.id,
      user_id: authUser.id,
      role: 'owner',
    });

    if (linkErr) {
      throw new Error(`Failed to link owner account: ${linkErr.message}`);
    }

    // 4. Create Primary Branch Store
    const branchName = payload.branchName?.trim() || `${cleanName} - Main Branch`;
    const { error: storeErr } = await adminSupabase.from('stores').insert({
      tenant_id: tenant.id,
      name: branchName,
      city: payload.city?.trim() || 'Accra',
      is_primary: true,
      pickup_enabled: true,
    });

    if (storeErr) {
      throw new Error(`Failed to create primary store branch: ${storeErr.message}`);
    }

    // 5. Create Tenant Settings with business archetype and module configuration
    const { error: settingsErr } = await adminSupabase.from('tenant_settings').insert({
      tenant_id: tenant.id,
      store_email: cleanEmail,
      business_phone: payload.ownerPhone?.trim() || null,
      business_country: 'GH',
      store_currency: 'GHS',
      settings_data: {
        store_name: cleanName,
        trading_name: cleanName,
        business_type: payload.businessType || 'general',
        enabled_modules: payload.enabledModules || {
          inventory: true,
          orders: true,
          pos: true,
          storefront: true,
        },
        platform_status: 'active',
        provisioned_by: user.email,
        provisioned_at: new Date().toISOString(),
      },
    });

    if (settingsErr) {
      throw new Error(`Failed to create tenant settings: ${settingsErr.message}`);
    }

    // 6. Create Storefront Settings (Public link-in-bio & web store)
    const { error: storefrontErr } = await adminSupabase.from('storefront_settings').insert({
      tenant_id: tenant.id,
      store_name: cleanName,
      slug: normalizedSlug,
      is_active: true,
      currency: 'GHS',
      whatsapp_phone: payload.ownerPhone?.trim() || null,
    });

    if (storefrontErr) {
      throw new Error(`Failed to create storefront settings: ${storefrontErr.message}`);
    }

    // 7. Create Subscription (Pricing linked to platform_plans or fallback matrix)
    const provisionTier: PlatformTier = payload.tier || 'growth';
    const { data: provisionPlan } = await adminSupabase
      .from('platform_plans')
      .select('price_ghs')
      .eq('slug', provisionTier)
      .maybeSingle();

    const billingCycle = payload.billingCycle || 'monthly';
    const priceMonthly = Number(
      provisionPlan?.price_ghs ?? (
        provisionTier === 'enterprise' ? 1800 :
        provisionTier === 'business' ? 750 :
        provisionTier === 'growth' ? 350 :
        provisionTier === 'starter' ? 150 : 0
      )
    );

    const { error: subErr } = await adminSupabase.from('tenant_subscriptions').insert({
      tenant_id: tenant.id,
      tier: provisionTier === 'none' ? 'starter' : provisionTier,
      billing_cycle: billingCycle,
      status: 'active',
      price_monthly: priceMonthly,
      renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (subErr) {
      throw new Error(`Failed to provision subscription: ${subErr.message}`);
    }

    // 8. Log Immutable Platform Audit Action
    await logPlatformAuditAction({
      action: 'PROVISION_MERCHANT',
      target_type: 'tenant',
      target_id: tenant.id,
      target_name: cleanName,
      reason: `Platform operator ${user.email} (${role}) provisioned merchant workspace '${cleanName}' (slug: ${normalizedSlug}, tier: ${provisionTier})`,
      metadata: {
        owner_email: cleanEmail,
        slug: normalizedSlug,
        tier: provisionTier,
        billing_cycle: billingCycle,
        business_type: payload.businessType || 'general',
        city: payload.city || 'Accra',
      },
    });

    revalidatePath('/platform');
    revalidatePath('/platform/merchants');

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://merchander.app';
    const portalUrl = `${appBaseUrl}/login`;
    const subdomainUrl = `https://${normalizedSlug}.merchander.app`;

    return {
      success: true,
      tenantId: tenant.id,
      credentials: {
        storeName: cleanName,
        slug: normalizedSlug,
        subdomainUrl,
        portalUrl,
        ownerEmail: cleanEmail,
        temporaryPassword: tempPassword,
        tier: provisionTier,
      },
    };
  } catch (err) {
    console.error('Error provisioning merchant workspace:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to provision merchant workspace',
    };
  }
}

/**
 * Admin: Assisted Merchant Onboarding / Provisioning
 */
export async function provisionMerchantTenantAction(params: {
  businessName: string;
  ownerEmail: string;
  initialPassword?: string;
  phone?: string;
  tier?: 'free' | 'starter' | 'growth' | 'business' | 'enterprise';
}): Promise<{ success: boolean; tenantId?: string; error?: string }> {
  try {
    const { user, role } = await verifyPlatformStaff(['platform_owner', 'platform_admin', 'operations']);
    const adminSupabase = createAdminClient();

    const cleanEmail = params.ownerEmail.trim().toLowerCase();
    const cleanName = params.businessName.trim();
    const tempPassword = params.initialPassword || 'Merchant@' + Math.floor(100000 + Math.random() * 900000);

    // 1. Create or fetch Auth User. listUsers() has no email filter, so page
    // through it (bounded) rather than scanning only the default first 50 rows.
    type ProvisionAuthUser = Awaited<ReturnType<typeof adminSupabase.auth.admin.createUser>>['data']['user'];
    let authUser: ProvisionAuthUser = null;
    for (let page = 1; page <= 20; page++) {
      const { data: userList } = await adminSupabase.auth.admin.listUsers({ page, perPage: 1000 });
      const users = userList?.users ?? [];
      const match = users.find((u) => u.email === cleanEmail);
      if (match) {
        authUser = match;
        break;
      }
      if (users.length < 1000) break;
    }

    if (!authUser) {
      const { data: created, error: createErr } = await adminSupabase.auth.admin.createUser({
        email: cleanEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name: cleanName, role: 'merchant' },
      });

      if (createErr || !created.user) {
        throw new Error(`Failed to create merchant auth user: ${createErr?.message || 'Unknown error'}`);
      }
      authUser = created.user;
    }

    // 2. Create Tenant
    const { data: tenant, error: tenantErr } = await adminSupabase
      .from('tenants')
      .insert({ name: cleanName })
      .select('id')
      .single();

    if (tenantErr || !tenant) {
      throw new Error(`Failed to create tenant: ${tenantErr?.message || 'Unknown error'}`);
    }

    // 3. Create Store
    await adminSupabase.from('stores').insert({
      tenant_id: tenant.id,
      name: `${cleanName} - Main Branch`,
      is_primary: true,
    });

    // 4. Link Tenant User
    await adminSupabase.from('tenant_users').insert({
      tenant_id: tenant.id,
      user_id: authUser.id,
      role: 'owner',
    });

    // 5. Create Tenant Settings
    await adminSupabase.from('tenant_settings').insert({
      tenant_id: tenant.id,
      store_email: cleanEmail,
      business_phone: params.phone || null,
      business_country: 'Ghana',
      store_currency: 'GHS',
      settings_data: {
        store_name: cleanName,
        provisioned_by: user.email,
      },
    });

    // 6. Create Subscription — price from platform_plans, not a local matrix.
    const provisionTier = params.tier || 'free';
    const { data: provisionPlan } = await adminSupabase
      .from('platform_plans')
      .select('price_ghs')
      .eq('slug', provisionTier)
      .maybeSingle();

    await adminSupabase.from('tenant_subscriptions').insert({
      tenant_id: tenant.id,
      tier: provisionTier,
      billing_cycle: 'monthly',
      status: 'active',
      price_monthly: Number(provisionPlan?.price_ghs ?? 0),
      renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // 7. Log Audit Action
    await logPlatformAuditAction({
      action: 'tenant.provision_assisted',
      target_type: 'tenant',
      target_id: tenant.id,
      target_name: cleanName,
      reason: `Assisted onboarding created by ${user.email} (${role}) for merchant ${cleanEmail}`,
    });

    revalidatePath('/platform/merchants');
    return { success: true, tenantId: tenant.id };
  } catch (err) {
    console.error('Error provisioning merchant:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to provision merchant' };
  }
}

/**
 * Admin: Trigger Merchant Password Reset or Diagnostic Email
 */
export async function triggerMerchantPasswordResetAction(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, role } = await verifyPlatformStaff(['platform_owner', 'platform_admin', 'support']);
    const adminSupabase = createAdminClient();

    const { error: resetErr } = await adminSupabase.auth.resetPasswordForEmail(email.trim().toLowerCase());

    if (resetErr) {
      throw new Error(`Failed to send password reset: ${resetErr.message}`);
    }

    await logPlatformAuditAction({
      action: 'auth.password_reset_triggered',
      target_type: 'security_event',
      target_id: email,
      target_name: email,
      reason: `Platform staff ${user.email} (${role}) triggered password reset for merchant ${email}`,
    });

    return { success: true };
  } catch (err) {
    console.error('Error triggering password reset:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to trigger password reset' };
  }
}

