import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CreateOrderForm } from '../components/CreateOrderForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Create Order | Merchander',
};

export default async function NewOrderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .single();

  if (!tenantUser) redirect('/dashboard/orders');
  const tenantId = tenantUser.tenant_id;
  const userRole = tenantUser.role;

  // Fetch all active product variants with their product names
  const { data: variantsData } = await supabase
    .from('product_variants')
    .select(
      `
      id,
      name,
      price,
      sku,
      product:products!inner(name, is_active)
    `
    )
    .eq('product.tenant_id', tenantId)
    .eq('product.is_active', true);

  // Map the nested product data into a flat structure for the client
  const variants =
    variantsData?.map((v) => {
      // Safely cast product relation due to Supabase type generation quirks
      const prod = v.product as unknown as { name: string } | { name: string }[] | null;
      let prodName = 'Unknown';
      if (Array.isArray(prod) && prod.length > 0) prodName = prod[0].name;
      else if (prod && !Array.isArray(prod)) prodName = prod.name;

      return {
        id: v.id,
        name: v.name || '',
        price: v.price,
        product_name: prodName,
        sku: v.sku,
      };
    }) || [];

  // Fetch stores for fulfillment location
  const { data: stores } = await supabase.from('stores').select('id, name').eq('tenant_id', tenantId);

  // Fetch existing customers and their previous delivery addresses for autocomplete
  const { data: rawCustomersData } = await supabase
    .from('customers')
    .select(
      `
      id, name, phone,
      orders ( delivery_address, created_at )
    `
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  // Map to find the most recent non-null address
  const customersData =
    rawCustomersData?.map((c) => {
      let address = '';
      // Use any as a workaround for complex Supabase nested types
      const orders = c.orders as any[];
      if (orders && Array.isArray(orders)) {
        const sortedOrders = [...orders].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const lastOrderWithAddress = sortedOrders.find((o) => o.delivery_address);
        if (lastOrderWithAddress) {
          address = lastOrderWithAddress.delivery_address;
        }
      }
      return { id: c.id, name: c.name || '', phone: c.phone, address };
    }) || [];

  return (
    <div className="min-h-full flex flex-col max-w-4xl animate-fadeIn">
      <header className="mb-8">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center text-sm font-medium text-muted hover:text-brand-primary transition-colors mb-4"
        >
          <ArrowLeft size={16} className="mr-1.5" />
          Back to Orders
        </Link>
        <h1 className="text-3xl font-bold  tracking-tight">Create Order</h1>
        <p className="mt-1">Manually enter an order taken from WhatsApp, phone, or in-person.</p>
      </header>

      <CreateOrderForm variants={variants} stores={stores || []} customers={customersData || []} userRole={userRole} />
    </div>
  );
}
