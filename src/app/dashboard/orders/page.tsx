import { createClient } from '@/lib/supabase/server';
import { KanbanBoard } from '@/app/dashboard/components/KanbanBoard';
import { OrdersTable } from './components/OrdersTable';
import { OrdersHeader } from './components/OrdersHeader';
import { OrdersTopMetrics } from './components/OrdersTopMetrics';

export const metadata = {
  title: 'Orders | Merchander',
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const resolvedParams = await searchParams;
  
  const status = typeof resolvedParams?.status === 'string' ? resolvedParams.status : 'all';
  const q = typeof resolvedParams?.q === 'string' ? resolvedParams.q : '';
  const view = typeof resolvedParams?.view === 'string' ? resolvedParams.view : 'table';
  const page = typeof resolvedParams?.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
  const pageSize = 10;

  // Fetch KPI Metrics
  const [
    { count: totalOrders },
    { count: pendingPayment },
    { count: toDispatch },
    { count: cancelled }
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['draft', 'pending_payment']),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
  ]);

  // Base query
  let query = supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*, variant:product_variants(*)),
      customer:customers!left(name, phone)
    `, { count: 'exact' });

  // Filter by status
  if (status && status !== 'all') {
    query = query.eq('status', status);
  } else {
    // Default active statuses
    query = query.in('status', ['draft', 'pending_payment', 'paid', 'dispatched']);
  }

  // Filter by search query (Order ID, Customer Name, or Phone)
  if (q) {
    query = query.or(`id.ilike.%${q}%,name.ilike.%${q}%,phone.ilike.%${q}%`, { foreignTable: 'customer' });
  }

  const { data: orders, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  
  const totalPages = Math.ceil((count || 0) / pageSize);

  if (error) {
    console.error('Error fetching orders:', JSON.stringify(error, null, 2));
  }

  return (
    <div className="h-full flex flex-col">
      <OrdersHeader />
      <div className="mt-6">
        <OrdersTopMetrics 
          metrics={{
            total: totalOrders || 0,
            pendingPayment: pendingPayment || 0,
            toDispatch: toDispatch || 0,
            cancelled: cancelled || 0
          }}
        />
      </div>

      {view === 'kanban' ? (
        <KanbanBoard initialOrders={orders || []} />
      ) : (
        <OrdersTable 
          initialOrders={orders || []} 
          currentPage={page} 
          totalPages={totalPages} 
          totalCount={count || 0} 
        />
      )}
    </div>
  );
}
