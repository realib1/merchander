'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createShipment, updateShipment } from '@/app/actions/shipments';
import { toast } from 'sonner';
import type { Shipment, FreightMode, ShipmentStatus } from '@/types/shipments';
import { ShipmentRouteSection } from './ShipmentRouteSection';
import { ShipmentCargoSection } from './ShipmentCargoSection';

interface SupplierOption {
  id: string;
  name: string;
}

interface PurchaseOrderOption {
  id: string;
  po_number: string | null;
}

interface ShipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment?: Shipment | null;
  suppliers: SupplierOption[];
  purchaseOrders: PurchaseOrderOption[];
}

function ShipmentFormContent({
  shipment,
  suppliers,
  purchaseOrders,
  onClose,
}: {
  shipment?: Shipment | null;
  suppliers: SupplierOption[];
  purchaseOrders: PurchaseOrderOption[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState(shipment?.title || '');
  const [trackingNumber, setTrackingNumber] = useState(shipment?.tracking_number || '');
  const [carrier, setCarrier] = useState(shipment?.carrier || '');
  const [freightMode, setFreightMode] = useState<FreightMode>(shipment?.freight_mode || 'sea');
  const [originPort, setOriginPort] = useState(shipment?.origin_port || 'Guangzhou, China');
  const [destinationPort, setDestinationPort] = useState(shipment?.destination_port || 'Tema Port, Ghana');
  const [departureDate, setDepartureDate] = useState(
    shipment?.departure_date ? shipment.departure_date.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [eta, setEta] = useState(shipment?.eta ? shipment.eta.split('T')[0] : '');
  const [status, setStatus] = useState<ShipmentStatus>(shipment?.status || 'booked');
  const [cbm, setCbm] = useState(shipment?.cbm?.toString() || '0');
  const [weightKg, setWeightKg] = useState(shipment?.weight_kg?.toString() || '0');
  const [shippingCost, setShippingCost] = useState(shipment?.shipping_cost?.toString() || '0');
  const [customsDuty, setCustomsDuty] = useState(shipment?.customs_duty?.toString() || '0');
  const [supplierId, setSupplierId] = useState(shipment?.supplier_id || '');
  const [purchaseOrderId, setPurchaseOrderId] = useState(shipment?.purchase_order_id || '');
  const [notes, setNotes] = useState(shipment?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a shipment name or title');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title: title.trim(),
      tracking_number: trackingNumber.trim() || null,
      carrier: carrier.trim() || null,
      freight_mode: freightMode,
      origin_port: originPort.trim() || null,
      destination_port: destinationPort.trim() || null,
      departure_date: departureDate || null,
      eta: eta || null,
      status,
      cbm: parseFloat(cbm) || 0,
      weight_kg: parseFloat(weightKg) || 0,
      shipping_cost: parseFloat(shippingCost) || 0,
      customs_duty: parseFloat(customsDuty) || 0,
      currency: shipment?.currency || 'GHS',
      supplier_id: supplierId || null,
      purchase_order_id: purchaseOrderId || null,
      notes: notes.trim() || null,
    };

    try {
      if (shipment) {
        const res = await updateShipment(shipment.id, payload);
        if (res.error) throw new Error(res.error);
        toast.success('Shipment updated successfully');
      } else {
        const res = await createShipment(payload);
        if (res.error) throw new Error(res.error);
        toast.success('Shipment created successfully');
      }
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save shipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="shipment-form" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-muted mb-1">Shipment Name / Identifier *</label>
        <input
          type="text"
          required
          placeholder="e.g. August Restock - Guangzhou to Tema (20ft Container)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-sm rounded-xl bg-surface-elevated border border-separator px-3.5 py-2 text-foreground focus:ring-1 focus:ring-brand-primary focus:outline-none"
        />
      </div>

      <ShipmentRouteSection
        trackingNumber={trackingNumber}
        carrier={carrier}
        freightMode={freightMode}
        originPort={originPort}
        destinationPort={destinationPort}
        departureDate={departureDate}
        eta={eta}
        status={status}
        onTrackingNumberChange={setTrackingNumber}
        onCarrierChange={setCarrier}
        onFreightModeChange={setFreightMode}
        onOriginPortChange={setOriginPort}
        onDestinationPortChange={setDestinationPort}
        onDepartureDateChange={setDepartureDate}
        onEtaChange={setEta}
        onStatusChange={setStatus}
      />

      <ShipmentCargoSection
        cbm={cbm}
        weightKg={weightKg}
        shippingCost={shippingCost}
        customsDuty={customsDuty}
        supplierId={supplierId}
        purchaseOrderId={purchaseOrderId}
        notes={notes}
        suppliers={suppliers}
        purchaseOrders={purchaseOrders}
        onCbmChange={setCbm}
        onWeightKgChange={setWeightKg}
        onShippingCostChange={setShippingCost}
        onCustomsDutyChange={setCustomsDuty}
        onSupplierIdChange={setSupplierId}
        onPurchaseOrderIdChange={setPurchaseOrderId}
        onNotesChange={setNotes}
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-separator">
        <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : shipment ? 'Save Changes' : 'Record Shipment'}
        </Button>
      </div>
    </form>
  );
}

export function ShipmentFormModal({ isOpen, onClose, shipment, suppliers, purchaseOrders }: ShipmentFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={shipment ? 'Edit Freight Shipment' : 'Record New Shipment'}
      description={
        shipment
          ? 'Update logistics tracking, customs clearance, and landed cost breakdown.'
          : 'Track cross-border freight from suppliers into Ghana with landed cost tracking.'
      }
      size="lg"
    >
      {isOpen && (
        <ShipmentFormContent
          key={shipment?.id || 'new-shipment'}
          shipment={shipment}
          suppliers={suppliers}
          purchaseOrders={purchaseOrders}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
