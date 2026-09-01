import { createClient } from '@/lib/supabase/server';
import { KanbanBoard } from '@/app/dashboard/components/KanbanBoard';
import { OrdersTable } from './components/OrdersTable';
import { OrdersHeader } from './components/OrdersHeader';
import { OrdersTopMetrics } from './components/OrdersTopMetrics';
import { getActiveBranchId } from '@/app/actions/branch';

export const metadata = {
  title: 'Orders | Merchander',
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const resolvedParams = await searchParams;
  const activeBranchId = await getActiveBranchId();
  const isBranchFiltered = Boolean(activeBranchId && activeBranchId !== 'all');

  const status = typeof resolvedParams?.status === 'string' ? resolvedParams.status : 'all';
  const q = typeof resolvedParams?.q === 'string' ? resolvedParams.q : '';
  const view = typeof resolvedParams?.view === 'string' ? resolvedParams.view : 'table';
  const page = typeof resolvedParams?.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
  const pageSize = 10;

  const sortBy = typeof resolvedParams?.sortBy === 'string' ? resolvedParams.sortBy : 'created_at';
  const sortOrder =
    typeof resolvedParams?.sortOrder === 'string' &&
    (resolvedParams.sortOrder === 'asc' || resolvedParams.sortOrder === 'desc')
      ? resolvedParams.sortOrder
      : 'desc';

  // Fetch KPI Metrics
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  let totalQ = supabase.from('orders').select('*', { count: 'exact', head: true });
  let pendingQ = supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .in('status', ['draft', 'pending_payment']);
  let dispatchQ = supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'paid');
  let cancelledQ = supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'cancelled');
  let current30Q = supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());
  let previous30Q = supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString());

  if (isBranchFiltered && activeBranchId) {
    totalQ = totalQ.eq('store_id', activeBranchId);
    pendingQ = pendingQ.eq('store_id', activeBranchId);
    dispatchQ = dispatchQ.eq('store_id', activeBranchId);
    cancelledQ = cancelledQ.eq('store_id', activeBranchId);
    current30Q = current30Q.eq('store_id', activeBranchId);
    previous30Q = previous30Q.eq('store_id', activeBranchId);
  }

  const [
    { count: totalOrders },
    { count: pendingPayment },
    { count: toDispatch },
    { count: cancelled },
    { count: current30DaysOrders },
    { count: previous30DaysOrders },
  ] = await Promise.all([totalQ, pendingQ, dispatchQ, cancelledQ, current30Q, previous30Q]);

  const currentCount = current30DaysOrders || 0;
  const previousCount = previous30DaysOrders || 0;
  const ordersChange = previousCount === 0 ? 100 : ((currentCount - previousCount) / previousCount) * 100;

  // Base query
  let query = supabase.from('orders').select(
    `
      *,
      items:order_items(*, variant:product_variants(*, product:products(name))),
      customer:customers!left(name, phone)
    `,
    { count: 'exact' }
  );

  if (isBranchFiltered && activeBranchId) {
    query = query.eq('store_id', activeBranchId);
  }

  // Filter by status
  if (status && status !== 'all') {
    query = query.eq('status', status);
  } else {
    // Default active statuses
    query = query.in('status', ['draft', 'pending_payment', 'paid', 'dispatched']);
  }

  // Filter by search query (Order ID, Short ID, Customer Name, or Phone)
  if (q) {
    const cleanQ = q.replace(/^#+/, '').trim();
    if (cleanQ) {
      // 1. Find matching customers first
      const { data: matchingCustomers } = await supabase
        .from('customers')
        .select('id')
        .or(`name.ilike.%${cleanQ}%,phone.ilike.%${cleanQ}%`);

      const customerIds = matchingCustomers?.map((c) => c.id) || [];
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQ);

      const filterClauses: string[] = [`short_id.ilike.%${cleanQ}%`];
      if (isUuid) {
        filterClauses.push(`id.eq.${cleanQ}`);
      }
      if (customerIds.length > 0) {
        filterClauses.push(`customer_id.in.(${customerIds.join(',')})`);
      }

      query = query.or(filterClauses.join(','));
    }
  }

  const {
    data: orders,
    error,
    count,
  } = await query.order(sortBy, { ascending: sortOrder === 'asc' }).range((page - 1) * pageSize, page * pageSize - 1);

  const totalPages = Math.ceil((count || 0) / pageSize);

  if (error) {
    console.error('Error fetching orders:', JSON.stringify(error, null, 2));
  }

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full">
      <h1 className="sr-only">Orders</h1>

      {/* 1. Top 4 Executive KPI Metrics */}
      <OrdersTopMetrics
        metrics={{
          total: totalOrders || 0,
          pendingPayment: pendingPayment || 0,
          toDispatch: toDispatch || 0,
          cancelled: cancelled || 0,
          ordersChange,
        }}
      />

      {/* 2. Unified Search, Filter Tabs & Action Toolbar */}
      <OrdersHeader />

      {/* 3. Data View: Table or Kanban */}
      {view === 'kanban' ? (
        <KanbanBoard initialOrders={orders || []} searchQuery={q} />
      ) : (
        <OrdersTable initialOrders={orders || []} currentPage={page} totalPages={totalPages} totalCount={count || 0} />
      )}
    </div>
  );
}
