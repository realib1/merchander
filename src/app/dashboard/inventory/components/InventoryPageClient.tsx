import { InventoryToolbar } from './InventoryToolbar';
import { InventoryTable, InventoryRowData } from './InventoryTable';

export function InventoryPageClient({
  rows,
  categories,
  statuses,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0
}: {
  rows: InventoryRowData[];
  categories: string[];
  statuses: string[];
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
}) {
  return (
    <div className="bg-surface border border-separator rounded-xl flex-1 flex flex-col overflow-hidden shadow-sm min-h-150">
      <InventoryToolbar categories={categories} statuses={statuses} />
      <InventoryTable 
        rows={rows} 
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </div>
  );
}
