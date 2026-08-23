import { Suspense } from 'react';
import { getCustomers } from '@/app/actions/customers';
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

  const customers = await getCustomers(query);

  const totalCustomers = customers.length;
  
  // Calculate periods
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const currentNewCustomers = customers.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length;
  const previousNewCustomers = customers.filter(c => new Date(c.created_at) >= sixtyDaysAgo && new Date(c.created_at) < thirtyDaysAgo).length;
  const customersChange = previousNewCustomers === 0 ? 100 : ((currentNewCustomers - previousNewCustomers) / previousNewCustomers) * 100;
  
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const activeCustomers = customers.filter(c => c.lastOrderDate && new Date(c.lastOrderDate) >= ninetyDaysAgo).length;
  const totalOrders = customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
  
  const currentOrders = customers.reduce((sum, c) => sum + (c.currentOrders || 0), 0);
  const previousOrders = customers.reduce((sum, c) => sum + (c.previousOrders || 0), 0);
  const ordersChange = previousOrders === 0 ? 100 : ((currentOrders - previousOrders) / previousOrders) * 100;

  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <CustomersHeader />
      <CustomersTopMetrics 
        totalCustomers={totalCustomers}
        customersChange={customersChange}
        activeCustomers={activeCustomers}
        totalOrders={totalOrders}
        ordersChange={ordersChange}
        totalRevenue={totalRevenue}
      />

      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      }>
        <div className="flex-1 overflow-hidden min-h-0 pb-6 mt-6">
          <CustomersTable initialCustomers={customers} />
        </div>
      </Suspense>
    </div>
  );
}
