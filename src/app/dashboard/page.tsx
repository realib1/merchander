import { createClient } from '@/lib/supabase/server';
import { getDashboardMetrics } from '@/app/actions/dashboard';
import { DashboardTopMetrics } from './components/DashboardTopMetrics';
import { SalesOverviewChart } from './components/SalesOverviewChart';
import { TopProductsList } from './components/TopProductsList';
import { DashboardQuickStatusHeader } from './components/DashboardQuickStatusHeader';
import { DashboardIntelligenceCard } from './components/DashboardIntelligenceCard';
import { DashboardRecentOrders } from './components/DashboardRecentOrders';
import { DashboardAttentionCenter } from './components/DashboardAttentionCenter';
import { DashboardIncomingCard } from './components/DashboardIncomingCard';

export const metadata = {
  title: 'Overview | Merchander',
};

export default async function DashboardOverview({
  searchParams,
}: {
  searchParams: Promise<{ period?: 'today' | '7d' | '30d' | '90d' }>;
}) {
  const params = await searchParams;
  const period = params?.period || 'today';

  const supabase = await createClient();

  // Fetch all real metrics using the selected period
  const metrics = await getDashboardMetrics(period);

  // Keep existing fetch for recent orders table (display 5 most recent)
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(
      `
      id,
      status,
      total_amount,
      created_at,
      customer:customers(name),
      order_items(count)
    `
    )
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-8">
      <h1 className="sr-only">Dashboard Overview</h1>

      {/* Quick Status Bar & Period Filter */}
      <DashboardQuickStatusHeader metrics={metrics} period={period} />

      {/* Top Metrics (Sales, Orders, Customers, Profit) */}
      <DashboardTopMetrics metrics={metrics} period={period} />

      {/* Main Content Grid: 12-column Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ROW 2: Chart & Intelligence */}
        <div className="lg:col-span-8 bg-surface border border-separator rounded-2xl shadow-xs p-6 flex flex-col min-h-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Sales Overview</h2>
              <p className="text-sm text-muted mt-0.5">Gross revenue across all sales channels.</p>
            </div>
          </div>
          <div className="flex-1 min-h-87.5">
            <SalesOverviewChart data={metrics.salesChart} />
          </div>
        </div>

        <DashboardIntelligenceCard intelligence={metrics.intelligence} />

        {/* ROW 3: Orders Stream & Attention Center */}
        <DashboardRecentOrders orders={recentOrders} />
        <DashboardAttentionCenter attention={metrics.attention} />

        {/* ROW 4: Top Products & Incoming Shipments */}
        <div className="lg:col-span-8 bg-surface border border-separator rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-75">
          <div className="px-6 py-4 border-b border-separator bg-surface-elevated flex items-center justify-between">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Top Products</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TopProductsList products={metrics.topProducts} />
          </div>
        </div>

        <DashboardIncomingCard incoming={metrics.incoming} />
      </div>
    </div>
  );
}
