import Link from 'next/link';
import { getInventory, getInventoryMetrics } from '@/app/actions/inventory-actions';
import { InventoryPageClient } from './components/InventoryPageClient';
import { InventoryTopMetrics } from './components/InventoryTopMetrics';
import type { InventoryRowData } from './components/InventoryTable';
import { Boxes, Layers } from 'lucide-react';

export const metadata = {
  title: 'Inventory | Merchander',
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const query = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;
  const categoryFilter = typeof resolvedParams.category === 'string' ? resolvedParams.category : 'All categories';
  const statusFilter = typeof resolvedParams.status === 'string' ? resolvedParams.status : 'All statuses';
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
  const pageSize = 15;

  const sortBy = typeof resolvedParams.sortBy === 'string' ? resolvedParams.sortBy : 'product_name';
  const sortOrder =
    typeof resolvedParams.sortOrder === 'string' &&
    (resolvedParams.sortOrder === 'asc' || resolvedParams.sortOrder === 'desc')
      ? resolvedParams.sortOrder
      : 'asc';

  const [{ data, count, categories }, metrics] = await Promise.all([
    getInventory(query, categoryFilter, statusFilter, page, pageSize, sortBy, sortOrder),
    getInventoryMetrics(),
  ]);

  interface InventoryViewRow {
    variant_id: string;
    sku: string;
    variant_name?: string | null;
    price: number;
    product_name?: string | null;
    image_urls?: string[] | null;
    category_name?: string | null;
    quantity: number;
    store_id: string;
    store_name?: string | null;
  }

  const rows: InventoryRowData[] = ((data as unknown as InventoryViewRow[]) || []).map((row) => ({
    variantId: row.variant_id,
    sku: row.sku,
    name: row.variant_name || '',
    price: row.price,
    productName: row.product_name || 'Unknown Product',
    imageUrls: row.image_urls || [],
    categoryName: row.category_name || 'Uncategorized',
    quantity: row.quantity,
    storeId: row.store_id,
    storeName: row.store_name || 'Unknown',
  }));

  const totalPages = Math.ceil(count / pageSize);

  const statuses = ['All statuses', 'In stock', 'Low stock', 'Out of stock'];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn max-w-7xl mx-auto w-full pb-12">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-separator/80 pb-4">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">Inventory &amp; Stock Levels</h1>
          <p className="text-xs text-muted mt-0.5">
            Monitor real-time warehouse inventory, low stock thresholds, and branch levels.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-elevated border border-separator/80">
          <Link
            href="/dashboard/inventory"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-surface text-foreground shadow-2xs border border-separator/60 flex items-center gap-1.5"
          >
            <Boxes size={14} className="text-brand-primary" />
            <span>Stock Levels</span>
          </Link>
          <Link
            href="/dashboard/inventory/batches"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-muted hover:text-foreground transition flex items-center gap-1.5"
          >
            <Layers size={14} />
            <span>Pre-Order Batches</span>
          </Link>
        </div>
      </div>

      <InventoryTopMetrics
        totalUnits={metrics.totalUnits}
        totalVariants={metrics.totalVariants}
        totalValue={metrics.totalValue}
        lowStockCount={metrics.lowStockCount}
        outOfStockCount={metrics.outOfStockCount}
      />
      <InventoryPageClient
        rows={rows}
        categories={categories}
        statuses={statuses}
        currentPage={page}
        totalPages={totalPages}
        totalCount={count}
      />
    </div>
  );
}
