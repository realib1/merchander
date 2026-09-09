'use client';

import { Ship } from 'lucide-react';
import { EditPurchaseOrderModal } from './EditPurchaseOrderModal';
import { RecordPODeliveryModal } from './RecordPODeliveryModal';

interface Supplier {
  name: string;
  short_id: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  tracking_number: string | null;
  status: string;
  eta: string | null;
  supplier: Supplier | null;
  supplier_cost: number;
  shipping_cost: number;
  import_cost: number;
}

interface Store {
  id: string;
  name: string;
}

export function PurchaseOrdersTable({ purchaseOrders, stores }: { purchaseOrders: PurchaseOrder[]; stores: Store[] }) {

  if (purchaseOrders.length === 0) {
    return (
      <div className="p-12 text-center">
        <Ship size={48} className="mx-auto mb-4 text-muted" />
        <p className="font-medium">No purchase orders found</p>
        <p className="text-sm mt-1 text-muted">Create a purchase order to start tracking incoming inventory.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead>
          <tr className="font-medium text-muted text-body-sm border-b border-separator bg-surface-elevated/20">
            <th className="px-4 py-3 font-medium">PO Number</th>
            <th className="px-4 py-3 font-medium">Supplier</th>
            <th className="px-4 py-3 font-medium">ETA</th>
            <th className="px-4 py-3 font-medium">Landed Cost</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-separator">
          {purchaseOrders.map((po) => {
            const landedCost = (po.supplier_cost || 0) + (po.shipping_cost || 0) + (po.import_cost || 0);
            return (
              <tr key={po.id} className="hover:bg-surface-elevated/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{po.po_number}</div>
                  <div className="text-xs text-muted mt-0.5">{po.tracking_number || 'No tracking info'}</div>
                </td>
                <td className="px-4 py-3 text-muted">{po.supplier?.name || '-'}</td>
                <td className="px-4 py-3 text-muted">{po.eta ? new Date(po.eta).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3 font-medium text-foreground tabular-nums">
                  {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(landedCost)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-caption font-semibold ${
                      po.status === 'received'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : po.status === 'ordered'
                          ? 'bg-blue-500/10 text-blue-600'
                          : 'bg-orange-500/10 text-orange-600'
                    }`}
                  >
                    {po.status.charAt(0).toUpperCase() + po.status.slice(1).replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <EditPurchaseOrderModal po={po} />

                    {po.status !== 'received' && (
                      <RecordPODeliveryModal
                        purchaseOrderId={po.id}
                        poNumber={po.po_number}
                        supplierName={po.supplier?.name}
                        stores={stores}
                      />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
