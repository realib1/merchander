import { Metadata } from 'next';
import { getPayments, getUnpaidOrdersForPayment } from '@/app/actions/payments';
import { createClient } from '@/lib/supabase/server';
import { PaymentsTopMetrics } from './components/PaymentsTopMetrics';
import { PaymentsToolbar } from './components/PaymentsToolbar';
import { PaymentsTable } from './components/PaymentsTable';

export const metadata: Metadata = {
  title: 'Payments & Cashflow | Merchander',
};

interface PaymentsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const resolvedParams = await searchParams;
  const period = (resolvedParams.period as string) || 'this_month';
  const provider = (resolvedParams.provider as string) || 'all';
  const status = (resolvedParams.status as string) || 'all';
  const search = (resolvedParams.q as string) || '';

  // Calculate Date Bounds based on period
  const now = new Date();
  let startDate: string | undefined;
  let endDate: string | undefined;

  if (period === 'this_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  } else if (period === 'last_month') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
  } else if (period === 'this_quarter') {
    const quarter = Math.floor(now.getMonth() / 3);
    startDate = new Date(now.getFullYear(), quarter * 3, 1).toISOString();
    endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59).toISOString();
  } else if (period === 'this_year') {
    startDate = new Date(now.getFullYear(), 0, 1).toISOString();
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();
  }

  // Fetch payments, unpaid orders, and customers concurrently for maximum performance
  const [{ payments, metrics }, unpaidOrders, customers] = await Promise.all([
    getPayments({
      period: period as 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'all',
      provider,
      status,
      search,
      startDate,
      endDate,
    }),
    getUnpaidOrdersForPayment(),
    (async () => {
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

        const { data: custData } = await supabase
          .from('customers')
          .select('id, name, phone')
          .eq('tenant_id', tenantUser.tenant_id)
          .order('name', { ascending: true })
          .limit(100);

        return custData || [];
      } catch (err) {
        console.error('Error fetching customers for payments toolbar:', err);
        return [];
      }
    })(),
  ]);

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full">
      <h1 className="sr-only">Payments & Cashflow</h1>

      {/* Top Metrics */}
      <PaymentsTopMetrics metrics={metrics} />

      {/* Table & Controls */}
      <div className="bg-surface border border-separator rounded-2xl flex-1 flex flex-col overflow-hidden shadow-xs min-h-105">
        <PaymentsToolbar payments={payments} orders={unpaidOrders} customers={customers} />
        <PaymentsTable payments={payments} />
      </div>
    </div>
  );
}
