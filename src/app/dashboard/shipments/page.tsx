import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getShipments } from '@/app/actions/shipments';
import { ShipmentsTopMetrics } from './components/ShipmentsTopMetrics';
import { ShipmentsToolbar } from './components/ShipmentsToolbar';
import { ShipmentsTable } from './components/ShipmentsTable';
import type { Shipment } from '@/types/shipments';

export const metadata = {
  title: 'Shipments & Logistics | Merchander',
  description: 'Track inbound sea-freight and air-cargo consignments, customs clearance, and landed costs.',
};

export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const resolvedParams = await searchParams;
  const searchQuery = typeof resolvedParams.q === 'string' ? resolvedParams.q.toLowerCase() : undefined;
  const modeFilter = typeof resolvedParams.mode === 'string' ? resolvedParams.mode : undefined;
  const statusFilter = typeof resolvedParams.status === 'string' ? resolvedParams.status : undefined;

  // 1. Fetch all shipments
  const { data: shipmentsData, error } = await getShipments();
  if (error) {
    console.error('Error loading shipments:', error);
  }

  let shipments = (shipmentsData as Shipment[]) || [];

  // Apply filters
  if (searchQuery) {
    shipments = shipments.filter(
      (s) =>
        s.title.toLowerCase().includes(searchQuery) ||
        (s.tracking_number && s.tracking_number.toLowerCase().includes(searchQuery)) ||
        (s.carrier && s.carrier.toLowerCase().includes(searchQuery)) ||
        (s.origin_port && s.origin_port.toLowerCase().includes(searchQuery))
    );
  }

  if (modeFilter && modeFilter !== 'all') {
    shipments = shipments.filter((s) => s.freight_mode === modeFilter);
  }

  if (statusFilter && statusFilter !== 'all') {
    shipments = shipments.filter((s) => s.status === statusFilter);
  }

  // 2. Fetch suppliers for dropdowns
  const { data: suppliersData } = await supabase.from('suppliers').select('id, name').order('name');

  // 3. Fetch purchase orders for dropdowns
  const { data: purchaseOrdersData } = await supabase
    .from('purchase_orders')
    .select('id, po_number')
    .order('created_at', { ascending: false });

  const suppliers = (suppliersData as { id: string; name: string }[]) || [];
  const purchaseOrders = (purchaseOrdersData as { id: string; po_number: string | null }[]) || [];

  let storeCurrency = 'GHS';
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (tenantUser?.tenant_id) {
    const { data: ts } = await supabase
      .from('tenant_settings')
      .select('store_currency')
      .eq('tenant_id', tenantUser.tenant_id)
      .maybeSingle();
    if (ts?.store_currency) {
      storeCurrency = ts.store_currency;
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full animate-fadeIn">
      <h1 className="sr-only">Shipments & Logistics</h1>

      {/* Top Metrics */}
      <ShipmentsTopMetrics shipments={shipmentsData || []} currency={storeCurrency} />

      {/* Table & Controls */}
      <div className="bg-surface border border-separator rounded-2xl flex-1 flex flex-col overflow-hidden shadow-xs min-h-105">
        <ShipmentsToolbar suppliers={suppliers} purchaseOrders={purchaseOrders} />
        <ShipmentsTable shipments={shipments} suppliers={suppliers} purchaseOrders={purchaseOrders} />
      </div>
    </div>
  );
}
