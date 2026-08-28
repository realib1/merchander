'use client';

interface SupplierOption {
  id: string;
  name: string;
}

interface PurchaseOrderOption {
  id: string;
  po_number: string | null;
}

interface ShipmentCargoSectionProps {
  cbm: string;
  weightKg: string;
  shippingCost: string;
  customsDuty: string;
  supplierId: string;
  purchaseOrderId: string;
  notes: string;
  suppliers: SupplierOption[];
  purchaseOrders: PurchaseOrderOption[];
  onCbmChange: (val: string) => void;
  onWeightKgChange: (val: string) => void;
  onShippingCostChange: (val: string) => void;
  onCustomsDutyChange: (val: string) => void;
  onSupplierIdChange: (val: string) => void;
  onPurchaseOrderIdChange: (val: string) => void;
  onNotesChange: (val: string) => void;
}

export function ShipmentCargoSection({
  cbm,
  weightKg,
  shippingCost,
  customsDuty,
  supplierId,
  purchaseOrderId,
  notes,
  suppliers,
  purchaseOrders,
  onCbmChange,
  onWeightKgChange,
  onShippingCostChange,
  onCustomsDutyChange,
  onSupplierIdChange,
  onPurchaseOrderIdChange,
  onNotesChange,
}: ShipmentCargoSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Volume (CBM)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={cbm}
            onChange={(e) => onCbmChange(e.target.value)}
            className="w-full text-sm rounded-xl bg-surface-elevated border border-separator px-3.5 py-2 text-foreground focus:ring-1 focus:ring-brand-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Weight (KG)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={weightKg}
            onChange={(e) => onWeightKgChange(e.target.value)}
            className="w-full text-sm rounded-xl bg-surface-elevated border border-separator px-3.5 py-2 text-foreground focus:ring-1 focus:ring-brand-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Freight Cost (GHS)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={shippingCost}
            onChange={(e) => onShippingCostChange(e.target.value)}
            className="w-full text-sm rounded-xl bg-surface-elevated border border-separator px-3.5 py-2 text-foreground focus:ring-1 focus:ring-brand-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Customs & Duty (GHS)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={customsDuty}
            onChange={(e) => onCustomsDutyChange(e.target.value)}
            className="w-full text-sm rounded-xl bg-surface-elevated border border-separator px-3.5 py-2 text-foreground focus:ring-1 focus:ring-brand-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Link to Supplier (Optional)</label>
          <select
            value={supplierId}
            onChange={(e) => onSupplierIdChange(e.target.value)}
            className="w-full text-sm rounded-xl bg-surface-elevated border border-separator px-3.5 py-2 text-foreground focus:ring-1 focus:ring-brand-primary focus:outline-none"
          >
            <option value="">No Supplier Selected</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Link to Purchase Order (Optional)</label>
          <select
            value={purchaseOrderId}
            onChange={(e) => onPurchaseOrderIdChange(e.target.value)}
            className="w-full text-sm rounded-xl bg-surface-elevated border border-separator px-3.5 py-2 text-foreground focus:ring-1 focus:ring-brand-primary focus:outline-none"
          >
            <option value="">No PO Selected</option>
            {purchaseOrders.map((po) => (
              <option key={po.id} value={po.id}>
                {po.po_number || `PO-${po.id.slice(0, 6)}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted mb-1">Notes & Instructions (Optional)</label>
        <textarea
          rows={2}
          placeholder="Container number, clearing agent notes, cargo breakdown..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full text-sm rounded-xl bg-surface-elevated border border-separator px-3.5 py-2 text-foreground focus:ring-1 focus:ring-brand-primary focus:outline-none resize-none"
        />
      </div>
    </div>
  );
}
