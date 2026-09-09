'use client';

import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { deleteShipment } from '@/app/actions/shipments';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ShipmentDetailsDrawer } from './ShipmentDetailsDrawer';
import { ShipmentFormDrawer } from './ShipmentFormDrawer';
import { ShipmentsTableRow } from './ShipmentsTableRow';
import type { Shipment } from '@/types/shipments';

interface SupplierOption {
  id: string;
  name: string;
}

interface PurchaseOrderOption {
  id: string;
  po_number: string | null;
}

interface ShipmentsTableProps {
  shipments: Shipment[];
  suppliers: SupplierOption[];
  purchaseOrders: PurchaseOrderOption[];
}

export function ShipmentsTable({ shipments, suppliers, purchaseOrders }: ShipmentsTableProps) {
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [shipmentToDelete, setShipmentToDelete] = useState<{ id: string; trackingNumber: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (id: string, trackingNumber: string) => {
    setShipmentToDelete({ id, trackingNumber });
  };

  const confirmDelete = async () => {
    if (!shipmentToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteShipment(shipmentToDelete.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Shipment deleted successfully');
        setShipmentToDelete(null);
      }
    } catch {
      toast.error('Failed to delete shipment');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-surface border border-separator rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-separator bg-surface-elevated/40 text-xs font-semibold text-muted">
                <th className="px-6 py-4">Tracking / Carrier</th>
                <th className="px-6 py-4">Freight Mode</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">ETA</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator/40">
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted">
                    <Package size={28} className="mx-auto mb-2 opacity-20" />
                    <p className="font-medium text-foreground">No shipments recorded</p>
                    <p className="text-xs text-muted mt-1">
                      Log your first shipment to track inbound logistics and customs clearance.
                    </p>
                  </td>
                </tr>
              ) : (
                shipments.map((shipment) => (
                  <ShipmentsTableRow
                    key={shipment.id}
                    shipment={shipment}
                    onViewDetails={(s) => setSelectedShipment(s)}
                    onEdit={(s) => setEditingShipment(s)}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedShipment && (
        <ShipmentDetailsDrawer
          isOpen={selectedShipment !== null}
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onEdit={(s) => {
            setSelectedShipment(null);
            setEditingShipment(s);
          }}
        />
      )}

      {editingShipment && (
        <ShipmentFormDrawer
          isOpen={editingShipment !== null}
          shipment={editingShipment}
          suppliers={suppliers}
          purchaseOrders={purchaseOrders}
          onClose={() => setEditingShipment(null)}
        />
      )}

      <ConfirmDialog
        isOpen={!!shipmentToDelete}
        onClose={() => setShipmentToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Shipment"
        description={`Are you sure you want to delete shipment ${shipmentToDelete?.trackingNumber || ''}? This action cannot be undone.`}
        confirmText="Delete Shipment"
        isDestructive
        isLoading={isDeleting}
      />
    </>
  );
}
