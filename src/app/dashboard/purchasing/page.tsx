import { Suspense } from 'react';
import { getPurchaseOrders } from '@/app/actions/purchasing';
import { PurchaseOrdersTable } from './components/PurchaseOrdersTable';
import { NewPurchaseOrderModal } from './components/NewPurchaseOrderModal';
import { getSuppliers } from '@/app/actions/suppliers';

import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Purchasing | Merchander',
};

export default async function PurchasingPage() {
  const supabase = await createClient();
  const [{ data: purchaseOrders }, { data: suppliers }, { data: stores }] = await Promise.all([
    getPurchaseOrders(),
    getSuppliers(),
    supabase.from('stores').select('id, name').order('name')
  ]);

  return (
    <div className="flex flex-col h-full animate-fadeIn max-w-7xl mx-auto w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted mt-1">Manage incoming stock from suppliers and receive inventory.</p>
        </div>
        <div className="flex items-center gap-3">
          <NewPurchaseOrderModal suppliers={suppliers || []} />
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-surface border border-separator rounded-2xl flex flex-col shadow-sm overflow-hidden">
        <Suspense fallback={<div className="p-12 text-center text-muted">Loading purchase orders...</div>}>
          <PurchaseOrdersTable purchaseOrders={purchaseOrders || []} stores={stores || []} />
        </Suspense>
      </div>
    </div>
  );
}
