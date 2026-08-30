'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CustomerStats {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  created_at: string;
  totalOrders: number;
  totalSpent: number;
  aov: number;
  lastOrderDate: string | null;
  currentOrders: number;
  previousOrders: number;
}

export async function getCustomers(
  query?: string,
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{ data: CustomerStats[]; count: number }> {
  const supabase = await createClient();

  // Dual-layer security: explicit auth check + RLS
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();
  if (!tenantUser) throw new Error('Tenant not found');

  let queryBuilder = supabase
    .from('customer_stats_view')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantUser.tenant_id)
    .order(sortBy, { ascending: sortOrder === 'asc' });

  if (query) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`);
  }

  const { data, count, error } = await queryBuilder.range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error('Error fetching customers:', error);
    throw new Error('Failed to fetch customers');
  }

  // Map the view data to match our interface
  const stats = (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    created_at: row.created_at,
    totalOrders: Number(row.total_orders || 0),
    totalSpent: Number(row.total_spent || 0),
    aov: Number(row.aov || 0),
    lastOrderDate: row.last_order_date,
    currentOrders: Number(row.current_orders || 0),
    previousOrders: Number(row.previous_orders || 0),
  }));

  return { data: stats, count: count || 0 };
}

export async function getCustomerPageMetrics() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('get_customer_page_metrics');

  if (error) {
    console.error('Error fetching customer metrics:', error);
    throw new Error('Failed to fetch customer metrics');
  }

  return data as {
    totalCustomers: number;
    currentNewCustomers: number;
    previousNewCustomers: number;
    activeCustomers: number;
    totalOrders: number;
    currentOrders: number;
    previousOrders: number;
    totalRevenue: number;
  };
}

export async function getCustomerById(id: string) {
  const supabase = await createClient();

  // Auth + tenant scoping (IDOR prevention)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) throw new Error('Tenant not found');

  // Fetch customer details along with all their orders and items
  const { data: customer, error } = await supabase
    .from('customers')
    .select(
      `
      *,
      orders (
        *,
        items:order_items (
          *,
          variant:product_variants (
            name,
            sku
          )
        )
      )
    `
    )
    .eq('id', id)
    .eq('tenant_id', tenantUser.tenant_id)
    .single();

  if (error || !customer) {
    console.error('Error fetching customer by id:', error);
    throw new Error('Customer not found');
  }

  const orders = Array.isArray(customer.orders) ? customer.orders : [];

  const validOrders = orders.filter((o: { status: string }) => o.status !== 'cancelled' && o.status !== 'draft');
  const totalSpent = validOrders.reduce(
    (sum: number, order: { total_amount: number | string | null; delivery_fee?: number | string | null }) =>
      sum + (Number(order.total_amount || 0) - Number(order.delivery_fee || 0)),
    0
  );

  return {
    ...customer,
    orders: orders.sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ), // sort newest first
    stats: {
      totalOrders: validOrders.length,
      totalSpent,
      aov: validOrders.length > 0 ? totalSpent / validOrders.length : 0,
    },
  };
}

export async function createCustomer(data: { name: string; phone: string; email: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) throw new Error('Tenant not found');

  const { normalizeGhanaPhone } = await import('@/utils/phone');
  const normalizedPhone = normalizeGhanaPhone(data.phone) || data.phone;

  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert({
      tenant_id: tenantUser.tenant_id,
      name: data.name || null,
      phone: normalizedPhone,
      email: data.email || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating customer:', error);
    if (error.code === '23505') {
      throw new Error('A customer with this phone number already exists.');
    }
    throw new Error('Failed to create customer');
  }

  revalidatePath('/dashboard/customers');
  return newCustomer;
}

export async function bulkDeleteCustomers(customerIds: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) throw new Error('Tenant not found');

  const { error } = await supabase
    .from('customers')
    .delete()
    .in('id', customerIds)
    .eq('tenant_id', tenantUser.tenant_id);

  if (error) {
    console.error('Error deleting customers:', error);
    throw new Error('Failed to delete customers');
  }

  revalidatePath('/dashboard/customers');
  return { success: true };
}

export async function getCustomerIdentities(customerId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();
    if (!tenantUser) return [];

    const { data, error } = await supabase
      .from('customer_identities')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantUser.tenant_id)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        // Table not yet migrated in database environment
        return [];
      }
      console.warn('Notice: Could not fetch customer identities:', error.message || error.code || error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('Notice: Error in getCustomerIdentities:', err instanceof Error ? err.message : err);
    return [];
  }
}

export async function linkCustomerIdentity(
  customerId: string,
  channel: 'whatsapp' | 'instagram' | 'facebook' | 'telegram' | 'storefront',
  identifier: string,
  profileData?: Record<string, unknown>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();
  if (!tenantUser) throw new Error('Tenant not found');

  const { data, error } = await supabase
    .from('customer_identities')
    .upsert(
      {
        tenant_id: tenantUser.tenant_id,
        customer_id: customerId,
        channel,
        identifier: identifier.trim(),
        profile_data: profileData ? JSON.stringify(profileData) : null,
        is_verified: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,channel,identifier' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error linking customer identity:', error);
    throw new Error(`Failed to link identity: ${error.message}`);
  }

  revalidatePath(`/dashboard/customers/${customerId}`);
  return data;
}

export async function removeCustomerIdentity(identityId: string, customerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();
  if (!tenantUser) throw new Error('Tenant not found');

  const { error } = await supabase
    .from('customer_identities')
    .delete()
    .eq('id', identityId)
    .eq('tenant_id', tenantUser.tenant_id);

  if (error) {
    console.error('Error removing customer identity:', error);
    throw new Error(`Failed to remove identity: ${error.message}`);
  }

  revalidatePath(`/dashboard/customers/${customerId}`);
  return { success: true };
}
