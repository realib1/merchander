'use client';

import React, { useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { PreorderBatch, PreorderBatchFormData, PreorderFreightMode } from '@/types/preorder';
import { createPreorderBatch, updatePreorderBatch } from '@/app/actions/preorder-batches';
import { Layers } from 'lucide-react';
import { toast } from 'sonner';

export interface BatchFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  batch?: PreorderBatch | null;
  availableProducts: Array<{ id: string; name: string }>;
}

function BatchFormContent({
  batch,
  availableProducts,
  onClose,
}: {
  batch?: PreorderBatch | null;
  availableProducts: Array<{ id: string; name: string }>;
  onClose: () => void;
}) {
  const isEditing = Boolean(batch);
  const [isPending, setIsPending] = useState(false);

  const [name, setName] = useState(batch?.name || '');
  const [code, setCode] = useState(batch?.code || '');
  const [opensAt, setOpensAt] = useState(
    batch?.opens_at ? batch.opens_at.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [closesAt, setClosesAt] = useState(batch?.closes_at ? batch.closes_at.slice(0, 10) : '');
  const [supplierOrderDate, setSupplierOrderDate] = useState(batch?.supplier_order_date || '');
  const [expectedArrivalStart, setExpectedArrivalStart] = useState(batch?.expected_arrival_start || '');
  const [expectedArrivalEnd, setExpectedArrivalEnd] = useState(batch?.expected_arrival_end || '');
  const [freightMode, setFreightMode] = useState<PreorderFreightMode>(batch?.freight_mode || 'sea');
  const [originCountry, setOriginCountry] = useState(batch?.origin_country || 'China');
  const [cargoTracking, setCargoTracking] = useState(batch?.cargo_tracking_number || '');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(batch?.assigned_product_ids || []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !closesAt || !expectedArrivalStart || !expectedArrivalEnd) {
      toast.error('Please fill in all required batch dates and name');
      return;
    }

    setIsPending(true);
    const payload: PreorderBatchFormData = {
      name: name.trim(),
      code: (code || name).trim().toUpperCase().replace(/\s+/g, '-'),
      opens_at: new Date(opensAt).toISOString(),
      closes_at: new Date(`${closesAt}T23:59:59Z`).toISOString(),
      supplier_order_date: supplierOrderDate || undefined,
      expected_arrival_start: expectedArrivalStart,
      expected_arrival_end: expectedArrivalEnd,
      freight_mode: freightMode,
      origin_country: originCountry.trim(),
      cargo_tracking_number: cargoTracking.trim() || undefined,
      product_ids: selectedProductIds,
    };

    const res = isEditing && batch ? await updatePreorderBatch(batch.id, payload) : await createPreorderBatch(payload);

    setIsPending(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(isEditing ? 'Batch updated successfully' : 'Pre-order batch created');
      onClose();
    }
  };

  const toggleProduct = (pId: string) => {
    setSelectedProductIds((prev) => (prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]));
  };

  return (
    <form id="batch-drawer-form" onSubmit={handleSubmit} className="space-y-5 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-foreground mb-1">Batch Name *</label>
          <input
            type="text"
            placeholder="e.g. Batch A - August Wave"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl bg-surface border border-separator px-3 py-2 text-foreground focus:ring-1 focus:ring-brand-primary"
          />
        </div>
        <div>
          <label className="block font-bold text-foreground mb-1">Batch Code</label>
          <input
            type="text"
            placeholder="e.g. BATCH-A"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full font-mono uppercase rounded-xl bg-surface border border-separator px-3 py-2 text-foreground focus:ring-1 focus:ring-brand-primary"
          />
        </div>
      </div>

      {/* Dates Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-surface border border-separator">
        <div>
          <label className="block font-semibold text-muted text-[11px] mb-1">Pre-Orders Open *</label>
          <input
            type="date"
            value={opensAt}
            onChange={(e) => setOpensAt(e.target.value)}
            required
            className="w-full text-xs rounded-lg bg-surface-elevated border border-separator px-2.5 py-1.5 text-foreground"
          />
        </div>
        <div>
          <label className="block font-semibold text-muted text-[11px] mb-1">Pre-Orders Close *</label>
          <input
            type="date"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            required
            className="w-full text-xs rounded-lg bg-surface-elevated border border-separator px-2.5 py-1.5 text-foreground"
          />
        </div>
        <div>
          <label className="block font-semibold text-muted text-[11px] mb-1">Supplier PO Date</label>
          <input
            type="date"
            value={supplierOrderDate}
            onChange={(e) => setSupplierOrderDate(e.target.value)}
            className="w-full text-xs rounded-lg bg-surface-elevated border border-separator px-2.5 py-1.5 text-foreground"
          />
        </div>
        <div>
          <label className="block font-semibold text-muted text-[11px] mb-1">Arrival Window Start *</label>
          <input
            type="date"
            value={expectedArrivalStart}
            onChange={(e) => setExpectedArrivalStart(e.target.value)}
            required
            className="w-full text-xs rounded-lg bg-surface-elevated border border-separator px-2.5 py-1.5 text-foreground"
          />
        </div>
        <div>
          <label className="block font-semibold text-muted text-[11px] mb-1">Arrival Window End *</label>
          <input
            type="date"
            value={expectedArrivalEnd}
            onChange={(e) => setExpectedArrivalEnd(e.target.value)}
            required
            className="w-full text-xs rounded-lg bg-surface-elevated border border-separator px-2.5 py-1.5 text-foreground"
          />
        </div>
        <div>
          <label className="block font-semibold text-muted text-[11px] mb-1">Freight Mode</label>
          <select
            value={freightMode}
            onChange={(e) => setFreightMode(e.target.value as PreorderFreightMode)}
            className="w-full text-xs rounded-lg bg-surface-elevated border border-separator px-2.5 py-1.5 text-foreground"
          >
            <option value="sea">Sea Freight (~6-8 wks)</option>
            <option value="air">Air Cargo (~1-2 wks)</option>
            <option value="express">Express Air (~3-5 days)</option>
            <option value="road">Road Cargo</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-foreground mb-1">Origin Country</label>
          <input
            type="text"
            placeholder="e.g. China, Turkey, UK"
            value={originCountry}
            onChange={(e) => setOriginCountry(e.target.value)}
            className="w-full rounded-xl bg-surface border border-separator px-3 py-2 text-foreground focus:ring-1 focus:ring-brand-primary"
          />
        </div>
        <div>
          <label className="block font-bold text-foreground mb-1">Container / AWB Number</label>
          <input
            type="text"
            placeholder="e.g. MSKU9382910"
            value={cargoTracking}
            onChange={(e) => setCargoTracking(e.target.value)}
            className="w-full rounded-xl bg-surface border border-separator px-3 py-2 text-foreground focus:ring-1 focus:ring-brand-primary"
          />
        </div>
      </div>

      {/* Assigned Products Selector */}
      {availableProducts.length > 0 && (
        <div className="space-y-1.5">
          <label className="block font-bold text-foreground">
            Assigned Catalog Products ({selectedProductIds.length} selected)
          </label>
          <div className="max-h-36 overflow-y-auto p-2 rounded-xl bg-surface border border-separator divide-y divide-separator/40 custom-scrollbar">
            {availableProducts.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-2 py-1.5 px-2 hover:bg-surface-elevated cursor-pointer rounded-md text-xs"
              >
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(p.id)}
                  onChange={() => toggleProduct(p.id)}
                  className="rounded border-separator text-brand-primary"
                />
                <span className="text-foreground truncate">{p.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-separator">
        <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={isPending}
          isLoading={isPending}
        >
          {isEditing ? 'Save Changes' : 'Create Batch'}
        </Button>
      </div>
    </form>
  );
}

export function BatchFormDrawer({ isOpen, onClose, batch, availableProducts }: BatchFormDrawerProps) {
  const isEditing = Boolean(batch);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Pre-Order Batch' : 'New Pre-Order Batch'}
      icon={<Layers size={20} className="text-brand-primary" />}
      description="Configure procurement cycle and milestone dates."
      size="lg"
    >
      {isOpen && (
        <BatchFormContent
          key={batch?.id || 'new-batch'}
          batch={batch}
          availableProducts={availableProducts}
          onClose={onClose}
        />
      )}
    </Drawer>
  );
}
