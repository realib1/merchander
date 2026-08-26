import { Suspense } from 'react';
import { getSuppliers } from '@/app/actions/suppliers';
import { SuppliersTable } from './components/SuppliersTable';
import { NewSupplierModal } from './components/NewSupplierModal';

export const metadata = {
  title: 'Suppliers | Merchander',
};

export default async function SuppliersPage() {
  const { data: suppliers } = await getSuppliers();

  return (
    <div className="flex flex-col h-full animate-fadeIn max-w-7xl mx-auto w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted mt-1">Manage your vendors and sourcing partners.</p>
        </div>
        <div className="flex items-center gap-3">
          <NewSupplierModal />
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-surface border border-separator rounded-2xl flex flex-col shadow-sm overflow-hidden">
        <Suspense fallback={<div className="p-12 text-center text-muted">Loading suppliers...</div>}>
          <SuppliersTable suppliers={suppliers || []} />
        </Suspense>
      </div>
    </div>
  );
}
