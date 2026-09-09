import { Suspense } from 'react';
import { getSuppliers } from '@/app/actions/suppliers';
import { getSupplierScorecardsAction } from '@/app/actions/intelligence-demand';
import { SuppliersTable } from './components/SuppliersTable';
import { NewSupplierModal } from './components/NewSupplierModal';
import { SupplierPerformanceScore } from '@/types/intelligence-demand';

export const metadata = {
  title: 'Suppliers | Merchander',
};

export default async function SuppliersPage() {
  const [{ data: suppliers }, scorecardsRes] = await Promise.all([
    getSuppliers(),
    getSupplierScorecardsAction(),
  ]);

  const scorecardsMap: Record<string, SupplierPerformanceScore> = {};
  if (scorecardsRes.data?.scorecards) {
    for (const card of scorecardsRes.data.scorecards) {
      scorecardsMap[card.supplierId] = card;
    }
  }

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full gap-4">
      <h1 className="sr-only">Suppliers</h1>
      <div className="flex items-center justify-end">
        <NewSupplierModal />
      </div>

      <div className="flex-1 min-h-0 bg-surface border border-separator rounded-2xl flex flex-col shadow-sm overflow-hidden">
        <Suspense fallback={<div className="p-12 text-center text-muted">Loading suppliers...</div>}>
          <SuppliersTable suppliers={suppliers || []} scorecards={scorecardsMap} />
        </Suspense>
      </div>
    </div>
  );
}
