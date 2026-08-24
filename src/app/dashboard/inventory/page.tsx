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

  const [{ data, count, categories }, metrics] = await Promise.all([
    getInventory(query, categoryFilter, statusFilter, page, pageSize),
    getInventoryMetrics()
  ]);

  const rows: InventoryRowData[] = (data || []).map((row: any) => ({
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
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full min-h-full">
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
