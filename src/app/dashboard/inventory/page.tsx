import { getInventory, getInventoryMetrics } from '@/app/actions/inventory-actions';
import { InventoryPageClient } from './components/InventoryPageClient';
import { InventoryTopMetrics } from './components/InventoryTopMetrics';
import type { InventoryRowData } from './components/InventoryTable';

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
    <div className="flex flex-col gap-6 animate-fadeIn max-w-7xl mx-auto w-full">
      <h1 className="sr-only">Inventory Stock Levels</h1>
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
