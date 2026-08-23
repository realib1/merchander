import { InventoryToolbar } from './InventoryToolbar';
import { InventoryTable, InventoryRowData } from './InventoryTable';

export function InventoryPageClient({ 
  rows,
  categories,
  statuses,
}: { 
  rows: InventoryRowData[];
  categories: string[];
  statuses: string[];
}) {
  return (
    <div className="bg-surface border border-separator rounded-xl flex-1 flex flex-col overflow-hidden shadow-sm min-h-150">
      <InventoryToolbar categories={categories} statuses={statuses} />
      <InventoryTable rows={rows} />
    </div>
  );
}
