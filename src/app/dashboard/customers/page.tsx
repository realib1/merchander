import { Suspense } from 'react';
import { getCustomers, getCustomerPageMetrics } from '@/app/actions/customers';
import { CustomersHeader } from './components/CustomersHeader';
import { CustomersTopMetrics } from './components/CustomersTopMetrics';
import { CustomersTable } from './components/CustomersTable';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Customers | Merchander',
  description: 'Manage your customer base.',
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const query = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;

  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
  const pageSize = 10;
  const sortBy = typeof resolvedParams.sortBy === 'string' ? resolvedParams.sortBy : 'created_at';
  const sortOrder =
    typeof resolvedParams.sortOrder === 'string' &&
    (resolvedParams.sortOrder === 'asc' || resolvedParams.sortOrder === 'desc')
      ? resolvedParams.sortOrder
      : 'desc';

  const [{ data: customers, count }, metrics] = await Promise.all([
    getCustomers(query, page, pageSize, sortBy, sortOrder),
    getCustomerPageMetrics(),
  ]);

  const {
    totalCustomers,
    currentNewCustomers,
    previousNewCustomers,
    activeCustomers,
    totalOrders,
    currentOrders,
    previousOrders,
    totalRevenue,
  } = metrics;

  const customersChange =
    previousNewCustomers === 0 ? 100 : ((currentNewCustomers - previousNewCustomers) / previousNewCustomers) * 100;

  const ordersChange = previousOrders === 0 ? 100 : ((currentOrders - previousOrders) / previousOrders) * 100;

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full">
      <h1 className="sr-only">Customers CRM</h1>

      {/* 1. Top 4 KPI Metrics */}
      <CustomersTopMetrics
        totalCustomers={totalCustomers}
        customersChange={customersChange}
        activeCustomers={activeCustomers}
        totalOrders={totalOrders}
        ordersChange={ordersChange}
        totalRevenue={totalRevenue}
      />

      {/* 2. Search & Action Toolbar */}
      <CustomersHeader />

      {/* 3. Customer Data Table */}
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          </div>
        }
      >
        <div className="flex-1">
          <CustomersTable initialCustomers={customers} currentPage={page} totalPages={totalPages} totalCount={count} />
        </div>
      </Suspense>
    </div>
  );
}
