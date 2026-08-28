'use server';

import { createClient } from '@/lib/supabase/server';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'product' | 'order' | 'customer';
  href: string;
}

export async function globalSearch(query: string) {
  if (!query || query.length < 2) {
    return { data: [], error: null };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: 'Unauthorized' };
  }

  // Get tenant ID
  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser?.tenant_id) {
    return { data: [], error: 'Tenant not found' };
  }

  const tenantId = tenantUser.tenant_id;
  const searchPattern = `%${query}%`;

  try {
    // Run all 3 queries in parallel
    const [productsRes, ordersRes, customersRes] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, sku')
        .eq('tenant_id', tenantId)
        .or(`name.ilike.${searchPattern},sku.ilike.${searchPattern}`)
        .limit(3),
      supabase
        .from('orders')
        .select('id, short_id, customer_name')
        .eq('tenant_id', tenantId)
        .ilike('short_id', searchPattern)
        .limit(3),
      supabase
        .from('customers')
        .select('id, first_name, last_name, email')
        .eq('tenant_id', tenantId)
        .or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},email.ilike.${searchPattern}`)
        .limit(3),
    ]);

    const results: SearchResult[] = [];

    // Map Products
    if (productsRes.data) {
      productsRes.data.forEach((p) => {
        results.push({
          id: p.id,
          title: p.name,
          subtitle: p.sku ? `SKU: ${p.sku}` : 'Product',
          type: 'product',
          href: `/dashboard/products/${p.id}`,
        });
      });
    }

    // Map Orders
    if (ordersRes.data) {
      ordersRes.data.forEach((o) => {
        results.push({
          id: o.id,
          title: `Order #${o.short_id}`,
          subtitle: o.customer_name || 'Customer',
          type: 'order',
          href: `/dashboard/orders/${o.id}`,
        });
      });
    }

    // Map Customers
    if (customersRes.data) {
      customersRes.data.forEach((c) => {
        results.push({
          id: c.id,
          title: `${c.first_name} ${c.last_name}`.trim(),
          subtitle: c.email || 'Customer',
          type: 'customer',
          href: `/dashboard/customers/${c.id}`,
        });
      });
    }

    return { data: results, error: null };
  } catch (error: unknown) {
    console.error('Global search error:', error);
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
