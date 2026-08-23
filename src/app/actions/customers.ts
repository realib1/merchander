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

export async function getCustomers(query?: string): Promise<CustomerStats[]> {
  const supabase = await createClient();

  // Dual-layer security: explicit auth check + RLS
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let queryBuilder = supabase
    .from('customers')
    .select('*, orders(id, total_amount, status, created_at)')
    .order('created_at', { ascending: false });

  if (query) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Error fetching customers:', error);
    throw new Error('Failed to fetch customers');
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Calculate stats
  return (data || []).map(customer => {
    const orders = Array.isArray(customer.orders) ? customer.orders : [];
    
    // For stats, we consider orders that are not draft or cancelled
    const validOrders = orders.filter((o: { status: string }) => o.status !== 'cancelled' && o.status !== 'draft');
    
    // Sort valid orders by date descending to find the last order date
    validOrders.sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    const totalSpent = validOrders.reduce((sum: number, order: { total_amount: number | string | null }) => sum + Number(order.total_amount || 0), 0);
    const aov = validOrders.length > 0 ? totalSpent / validOrders.length : 0;
    const lastOrderDate = validOrders.length > 0 ? validOrders[0].created_at : null;
    
    const currentOrders = validOrders.filter((o: { created_at: string }) => new Date(o.created_at) >= thirtyDaysAgo).length;
    const previousOrders = validOrders.filter((o: { created_at: string }) => new Date(o.created_at) >= sixtyDaysAgo && new Date(o.created_at) < thirtyDaysAgo).length;

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      created_at: customer.created_at,
      totalOrders: validOrders.length,
      totalSpent,
      aov,
      lastOrderDate,
      currentOrders,
      previousOrders
    };
  });
}

export async function getCustomerById(id: string) {
  const supabase = await createClient();

  // Auth + tenant scoping (IDOR prevention)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantUser) throw new Error('Tenant not found');

  // Fetch customer details along with all their orders and items
  const { data: customer, error } = await supabase
    .from('customers')
    .select(`
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
    `)
    .eq('id', id)
    .eq('tenant_id', tenantUser.tenant_id)
    .single();

  if (error || !customer) {
    console.error('Error fetching customer by id:', error);
    throw new Error('Customer not found');
  }

  const orders = Array.isArray(customer.orders) ? customer.orders : [];
  
  const validOrders = orders.filter((o: { status: string }) => o.status !== 'cancelled' && o.status !== 'draft');
  const totalSpent = validOrders.reduce((sum: number, order: { total_amount: number | string | null }) => sum + Number(order.total_amount || 0), 0);
  
  return {
    ...customer,
    orders: orders.sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), // sort newest first
    stats: {
      totalOrders: validOrders.length,
      totalSpent,
      aov: validOrders.length > 0 ? (totalSpent / validOrders.length) : 0
    }
  };
}

export async function createCustomer(data: { name: string; phone: string; email: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantUser) throw new Error('Tenant not found');

  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert({
      tenant_id: tenantUser.tenant_id,
      name: data.name || null,
      phone: data.phone,
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

