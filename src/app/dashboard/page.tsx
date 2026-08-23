import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { 
  ArrowRight, 
  AlertTriangle,
  CheckCircle2,
  Ship,
  ChevronRight,
  Lightbulb
} from 'lucide-react';
import { getDashboardMetrics } from '@/app/actions/dashboard';
import { formatCurrency } from '@/utils/format';
import { DashboardTopMetrics } from './components/DashboardTopMetrics';
import { SalesOverviewChart } from './components/SalesOverviewChart';
import { TopProductsList } from './components/TopProductsList';

export const metadata = {
  title: 'Overview | Merchander',
};

export default async function DashboardOverview({
  searchParams,
}: {
  searchParams: Promise<{ period?: '7d' | '30d' | '90d' }>
}) {
  const params = await searchParams;
  const period = params?.period || '30d';

  const supabase = await createClient();

  // Fetch all real metrics using the selected period
  const metrics = await getDashboardMetrics(period);

  // Keep existing fetch for recent orders table
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      total_amount,
      created_at,
      customer:customers(name)
    `)
    .order('created_at', { ascending: false })
    .limit(3);

  return (
    <div className="h-full flex flex-col space-y-10 pb-10">
      <h1 className="sr-only">Dashboard Overview</h1>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-text-primary mr-2">Quick status:</span>
          
          {metrics.attention.lowStock.length > 0 && (
            <Link href="/dashboard/inventory" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-warning/10 text-warning border border-warning/20 rounded-full text-xs font-medium hover:bg-warning/20 transition-colors">
              <AlertTriangle size={14} /> {metrics.attention.lowStock.length} products running low
            </Link>
          )}

          {metrics.attention.supplierBalances.length > 0 && (
            <Link href="/dashboard/payments" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-warning/10 text-warning border border-warning/20 rounded-full text-xs font-medium hover:bg-warning/20 transition-colors">
              <AlertTriangle size={14} /> {metrics.attention.supplierBalances.length} supplier balances due
            </Link>
          )}

          {metrics.incoming && (
            <Link href="/dashboard/shipments" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated text-text-primary border border-separator rounded-full text-xs font-medium hover:bg-surface transition-colors">
              <Ship size={14} className="text-brand-primary" /> {metrics.incoming.id} arriving soon
            </Link>
          )}
          
          {/* Always show a positive pill if there's no severe attention items or just as a balance */}
          <Link href="/dashboard/payments" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success border border-success/20 rounded-full text-xs font-medium hover:bg-success/20 transition-colors">
            <CheckCircle2 size={14} /> All systems operational
          </Link>
        </div>

        <div className="flex items-center bg-surface-elevated border border-separator rounded-lg overflow-hidden text-[13px] font-medium shrink-0">
          <Link href="?period=7d" className={`px-4 py-2 transition-colors ${period === '7d' ? 'bg-brand-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}>7 days</Link>
          <Link href="?period=30d" className={`px-4 py-2 transition-colors ${period === '30d' ? 'bg-brand-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}>30 days</Link>
          <Link href="?period=90d" className={`px-4 py-2 transition-colors ${period === '90d' ? 'bg-brand-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}>90 days</Link>
        </div>
      </header>

      {/* Top Metrics (Sales, Orders, Customers, Profit) */}
      <DashboardTopMetrics metrics={metrics} period={period} />

      {/* Main Content Grid: 12-column layout matching reference */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ROW 2: Chart & Insight */}
        {/* Sales Chart (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-surface border border-separator rounded-2xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] p-6 flex flex-col min-h-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Sales Overview</h2>
              <p className="text-sm text-text-secondary mt-1">Gross revenue across all sales channels.</p>
            </div>
          </div>
          <div className="flex-1 min-h-87.5">
            <SalesOverviewChart data={metrics.salesChart} />
          </div>
        </div>

        {/* Merchander Intelligence (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-surface border border-separator rounded-2xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] flex flex-col min-h-100">
          <div className="px-6 py-4 border-b border-separator bg-surface-elevated rounded-t-2xl flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Lightbulb size={16} className="text-brand-secondary" /> Merchander Intelligence
            </h2>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="text-sm text-text-primary font-medium mb-3">What Merchander sees:</div>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              {metrics.intelligence.velocityInsight}
            </p>
            
            <div className="bg-surface-elevated rounded-xl p-4 border border-separator mb-6 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></div>
                <div className="text-xs font-semibold text-text-primary uppercase tracking-wider">Analysis Engine</div>
              </div>
              <div className="text-sm text-text-secondary space-y-2">
                {metrics.intelligence.supplyInsight.map((insight, idx) => (
                  <p key={idx}>{insight}</p>
                ))}
              </div>
            </div>

            <div className="text-sm bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-4">
              <span className="font-semibold text-brand-primary block mb-1">Recommendation:</span> 
              <span className="text-text-secondary">{metrics.intelligence.recommendation}</span>
            </div>
          </div>
        </div>


        {/* ROW 3: Orders & Attention Center */}
        {/* Orders Stream (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-surface border border-separator rounded-2xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col min-h-87.5">
          <div className="px-6 py-4 border-b border-separator bg-surface-elevated flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Recent Orders</h2>
            <Link href="/dashboard/orders" className="text-sm font-medium text-brand-primary hover:text-brand-primary-600 flex items-center gap-1">
              View all orders <ArrowRight size={16} />
            </Link>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-muted uppercase bg-surface border-b border-separator">
                <tr>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Items</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator">
                {recentOrders && recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-elevated/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-text-primary">#{order.id.substring(0, 6).toUpperCase()}</td>
                      <td className="px-6 py-3 text-text-secondary">
                        {Array.isArray(order.customer) ? order.customer[0]?.name : (order.customer as { name?: string })?.name || 'Walk-in'}
                      </td>
                      <td className="px-6 py-3 text-text-muted tabular-nums">-</td>
                      <td className="px-6 py-3 font-medium tabular-nums">{formatCurrency(Number(order.total_amount))}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          order.status === 'paid' || order.status === 'dispatched' || order.status === 'delivered' 
                            ? 'bg-success/10 text-success' 
                            : order.status === 'pending_payment' 
                              ? 'bg-warning/10 text-warning'
                              : 'bg-surface-elevated text-text-secondary'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-text-muted">No recent orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attention Center (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-surface border border-separator rounded-2xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col min-h-87.5">
          <div className="px-6 py-4 border-b border-separator bg-surface-elevated">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning" /> Needs your attention
            </h2>
          </div>
          <div className="divide-y divide-separator overflow-y-auto flex-1">
            
            {metrics.attention.shipments.map((shipment) => (
              <div key={shipment.id} className="px-6 py-4 flex items-center justify-between hover:bg-surface-elevated/50 transition-colors">
                <div>
                  <div className="font-semibold text-text-primary">Shipment arriving {shipment.eta}</div>
                  <div className="text-sm text-text-secondary mt-0.5">{shipment.id} — {shipment.supplierName}</div>
                  <div className="text-xs text-text-muted mt-1 flex items-center gap-2">
                    <span className="bg-surface-elevated px-2 py-0.5 rounded text-text-secondary border border-separator">{shipment.units} units</span>
                    <span className="bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">{shipment.preOrders} pre-orders</span>
                  </div>
                </div>
                <Link href="/dashboard/shipments" className="text-sm font-medium text-brand-primary hover:text-brand-primary-600 flex items-center gap-1">
                  View <ChevronRight size={16} />
                </Link>
              </div>
            ))}

            {metrics.attention.lowStock.map((stock) => (
              <div key={stock.id} className="px-6 py-4 flex items-center justify-between hover:bg-surface-elevated/50 transition-colors">
                <div>
                  <div className="font-semibold text-text-primary flex items-center gap-2">
                    Low stock <span className="w-2 h-2 rounded-full bg-destructive animate-pulse"></span>
                  </div>
                  <div className="text-sm text-text-secondary mt-0.5">{stock.name} — {stock.size}</div>
                  <div className="text-xs text-text-muted mt-1 flex items-center gap-2">
                    <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded">{stock.remaining} units remaining</span>
                  </div>
                </div>
                <Link href="/dashboard/inventory" className="text-sm font-medium text-brand-primary hover:text-brand-primary-600 flex items-center gap-1">
                  Restock <ChevronRight size={16} />
                </Link>
              </div>
            ))}

            {metrics.attention.supplierBalances.map((bal) => (
              <div key={bal.id} className="px-6 py-4 flex items-center justify-between hover:bg-surface-elevated/50 transition-colors">
                <div>
                  <div className="font-semibold text-text-primary">Supplier balance</div>
                  <div className="text-sm text-text-secondary mt-0.5">{bal.supplierName}</div>
                  <div className="text-xs text-warning mt-1 font-medium">
                    {formatCurrency(bal.balance, 'USD', 'en-US')} outstanding
                  </div>
                </div>
                <Link href="/dashboard/suppliers" className="text-sm font-medium text-brand-primary hover:text-brand-primary-600 flex items-center gap-1">
                  View <ChevronRight size={16} />
                </Link>
              </div>
            ))}

            {metrics.attention.shipments.length === 0 && metrics.attention.lowStock.length === 0 && metrics.attention.supplierBalances.length === 0 && (
              <div className="px-6 py-8 text-center">
                <CheckCircle2 size={32} className="text-success mx-auto mb-2 opacity-50" />
                <p className="text-text-secondary text-sm">You&apos;re all caught up!</p>
              </div>
            )}
          </div>
        </div>


        {/* ROW 4: Products & Incoming */}
        {/* Top Products (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-surface border border-separator rounded-2xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col min-h-75">
          <div className="px-6 py-4 border-b border-separator bg-surface-elevated">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Top Products</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TopProductsList products={metrics.topProducts} />
          </div>
        </div>

        {/* Incoming Shipments (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-surface border border-separator rounded-2xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] p-6 flex flex-col min-h-75">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <Ship size={16} /> Incoming
          </h2>
          
          {metrics.incoming ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-surface-elevated rounded-xl border border-separator text-center">
              <div className="text-lg font-display font-semibold text-text-primary mb-1">🇨🇳 {metrics.incoming.origin}</div>
              <div className="text-text-muted mb-1">↓</div>
              <div className="font-medium text-brand-primary mb-1">{metrics.incoming.id}</div>
              <div className="text-text-muted mb-1">↓</div>
              <div className="font-medium text-text-primary mb-1 tabular-nums">{metrics.incoming.units} units</div>
              <div className="text-text-muted mb-3">↓</div>
              <div className="text-sm font-medium text-text-secondary">ETA: {metrics.incoming.eta}</div>
              
              <div className="w-full h-px bg-separator my-4"></div>
              
              <div className="text-sm font-medium text-text-primary">
                {metrics.incoming.preOrders} customers are already waiting for these products.
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-surface-elevated rounded-xl border border-separator text-center">
              <div className="text-text-muted mb-3"><Ship size={32} className="opacity-20 mx-auto" /></div>
              <div className="text-sm text-text-secondary">No active shipments in transit.</div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
