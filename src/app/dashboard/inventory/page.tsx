import { createClient } from '@/lib/supabase/server';
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
  const supabase = await createClient();

  const resolvedParams = await searchParams;
  const query = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;
  const categoryFilter = typeof resolvedParams.category === 'string' ? resolvedParams.category : 'All categories';
  const statusFilter = typeof resolvedParams.status === 'string' ? resolvedParams.status : 'All statuses';

  // We fetch all variants with their inventory and product category.
  // Note: Complex filtering (like status based on sum of inventory) is hard to do purely in Supabase PostgREST
  // without a view or RPC. Since the dashboard usually manages a reasonable number of SKUs,
  // we can fetch the dataset and filter it server-side before passing to the client.
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select(`
      id,
      sku,
      name,
      price,
      product:products(
        name,
        image_urls,
        category:product_categories(name)
      ),
      inventory:inventory_levels(quantity, store:stores(id, name))
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inventory:', error);
  }

  // Flatten variants to rows
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allRows: InventoryRowData[] = ((variants as any[]) || []).flatMap(variant => {
    const hasInventory = variant.inventory && variant.inventory.length > 0;
    if (!hasInventory) {
      return [{
        variantId: variant.id,
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        productName: variant.product?.name || 'Unknown Product',
        imageUrls: variant.product?.image_urls || [],
        categoryName: variant.product?.category?.name || 'Uncategorized',
        quantity: 0,
        storeId: null,
        storeName: 'Unassigned',
      }];
    }
    return variant.inventory!.map((inv: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ => ({
      variantId: variant.id,
      sku: variant.sku,
      name: variant.name,
      price: variant.price,
      productName: variant.product?.name || 'Unknown Product',
      imageUrls: variant.product?.image_urls || [],
      categoryName: variant.product?.category?.name || 'Uncategorized',
      quantity: inv.quantity,
      storeId: inv.store?.id || null,
      storeName: inv.store?.name || 'Unknown Store',
    }));
  });

  // Apply filters server-side
  const filteredRows = allRows.filter(row => {
    if (query) {
      const searchString = `${row.productName} ${row.name} ${row.sku}`.toLowerCase();
      if (!searchString.includes(query.toLowerCase())) return false;
    }
    
    if (categoryFilter !== 'All categories' && row.categoryName !== categoryFilter) {
      return false;
    }
    
    if (statusFilter !== 'All statuses') {
      if (statusFilter === 'In stock' && row.quantity < 10) return false;
      if (statusFilter === 'Low stock' && (row.quantity === 0 || row.quantity >= 10)) return false;
      if (statusFilter === 'Out of stock' && row.quantity > 0) return false;
    }

    return true;
  });

  // Calculate global metrics (can be based on filtered or unfiltered depending on requirement, here we use filtered)
  const totalVariants = new Set(filteredRows.map(r => r.variantId)).size;
  const totalUnits = filteredRows.reduce((acc, row) => acc + row.quantity, 0);
  const totalValue = filteredRows.reduce((acc, row) => acc + (row.quantity * row.price), 0);
  const lowStockCount = filteredRows.filter(row => row.quantity > 0 && row.quantity < 10).length;
  const outOfStockCount = filteredRows.filter(row => row.quantity === 0).length;

  const categories = ['All categories', ...Array.from(new Set(allRows.map(r => r.categoryName))).filter(Boolean)];
  const statuses = ['All statuses', 'In stock', 'Low stock', 'Out of stock'];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full min-h-full">
      <InventoryTopMetrics
        totalUnits={totalUnits}
        totalVariants={totalVariants}
        totalValue={totalValue}
        lowStockCount={lowStockCount}
        outOfStockCount={outOfStockCount}
      />
      <InventoryPageClient 
        rows={filteredRows} 
        categories={categories} 
        statuses={statuses} 
      />
    </div>
  );
}
