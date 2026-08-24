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

  const [{ data: customers, count }, metrics] = await Promise.all([
    getCustomers(query, page, pageSize),
    getCustomerPageMetrics()
  ]);

  const {
    totalCustomers,
    currentNewCustomers,
    previousNewCustomers,
    activeCustomers,
    totalOrders,
    currentOrders,
    previousOrders,
    totalRevenue
  } = metrics;

  const customersChange =
    previousNewCustomers === 0 ? 100 : ((currentNewCustomers - previousNewCustomers) / previousNewCustomers) * 100;
    
  const ordersChange = previousOrders === 0 ? 100 : ((currentOrders - previousOrders) / previousOrders) * 100;
  
  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="min-h-full flex flex-col relative">
      <CustomersHeader />
      <CustomersTopMetrics
        totalCustomers={totalCustomers}
        customersChange={customersChange}
        activeCustomers={activeCustomers}
        totalOrders={totalOrders}
        ordersChange={ordersChange}
        totalRevenue={totalRevenue}
      />

      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          </div>
        }
      >
        <div className="flex-1 pb-6 mt-6">
          <CustomersTable 
            initialCustomers={customers} 
            currentPage={page}
            totalPages={totalPages}
            totalCount={count}
          />
        </div>
      </Suspense>
    </div>
  );
}
