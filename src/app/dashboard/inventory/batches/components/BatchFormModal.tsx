'use client';

import React, { useState } from 'react';
import { PreorderBatch, PreorderBatchFormData, PreorderFreightMode } from '@/types/preorder';
import { createPreorderBatch, updatePreorderBatch } from '@/app/actions/preorder-batches';
import { X, Layers, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BatchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch?: PreorderBatch | null;
  availableProducts: Array<{ id: string; name: string }>;
}

export function BatchFormModal({ isOpen, onClose, batch, availableProducts }: BatchFormModalProps) {
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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-surface border border-separator rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between border-b border-separator/80 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {isEditing ? 'Edit Pre-Order Batch' : 'New Pre-Order Batch'}
              </h2>
              <p className="text-xs text-muted">Configure procurement cycle and milestone dates</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-foreground cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-foreground mb-1">Batch Name *</label>
              <input
                type="text"
                placeholder="e.g. Batch A — August Wave"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl bg-surface-elevated border border-separator px-3 py-2 text-foreground focus:ring-1 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label className="block font-bold text-foreground mb-1">Batch Code</label>
              <input
                type="text"
                placeholder="e.g. BATCH-A"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full font-mono uppercase rounded-xl bg-surface-elevated border border-separator px-3 py-2 text-foreground focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-surface-elevated/60 border border-separator/80">
            <div>
              <label className="block font-semibold text-muted text-[11px] mb-1">Pre-Orders Open *</label>
              <input
                type="date"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
                required
                className="w-full text-xs rounded-lg bg-surface border border-separator px-2.5 py-1.5 text-foreground"
              />
            </div>
            <div>
              <label className="block font-semibold text-muted text-[11px] mb-1">Pre-Orders Close *</label>
              <input
                type="date"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                required
                className="w-full text-xs rounded-lg bg-surface border border-separator px-2.5 py-1.5 text-foreground"
              />
            </div>
            <div>
              <label className="block font-semibold text-muted text-[11px] mb-1">Supplier PO Date</label>
              <input
                type="date"
                value={supplierOrderDate}
                onChange={(e) => setSupplierOrderDate(e.target.value)}
                className="w-full text-xs rounded-lg bg-surface border border-separator px-2.5 py-1.5 text-foreground"
              />
            </div>
            <div>
              <label className="block font-semibold text-muted text-[11px] mb-1">Arrival Window Start *</label>
              <input
                type="date"
                value={expectedArrivalStart}
                onChange={(e) => setExpectedArrivalStart(e.target.value)}
                required
                className="w-full text-xs rounded-lg bg-surface border border-separator px-2.5 py-1.5 text-foreground"
              />
            </div>
            <div>
              <label className="block font-semibold text-muted text-[11px] mb-1">Arrival Window End *</label>
              <input
                type="date"
                value={expectedArrivalEnd}
                onChange={(e) => setExpectedArrivalEnd(e.target.value)}
                required
                className="w-full text-xs rounded-lg bg-surface border border-separator px-2.5 py-1.5 text-foreground"
              />
            </div>
            <div>
              <label className="block font-semibold text-muted text-[11px] mb-1">Freight Mode</label>
              <select
                value={freightMode}
                onChange={(e) => setFreightMode(e.target.value as PreorderFreightMode)}
                className="w-full text-xs rounded-lg bg-surface border border-separator px-2.5 py-1.5 text-foreground"
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
                className="w-full rounded-xl bg-surface-elevated border border-separator px-3 py-2 text-foreground focus:ring-1 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label className="block font-bold text-foreground mb-1">Container / AWB Number</label>
              <input
                type="text"
                placeholder="e.g. MSKU9382910"
                value={cargoTracking}
                onChange={(e) => setCargoTracking(e.target.value)}
                className="w-full rounded-xl bg-surface-elevated border border-separator px-3 py-2 text-foreground focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          </div>

          {/* Assigned Products Selector */}
          {availableProducts.length > 0 && (
            <div className="space-y-1.5">
              <label className="block font-bold text-foreground">
                Assigned Catalog Products ({selectedProductIds.length} selected)
              </label>
              <div className="max-h-28 overflow-y-auto p-2 rounded-xl bg-surface-elevated border border-separator divide-y divide-separator/40 custom-scrollbar">
                {availableProducts.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 py-1 px-1.5 hover:bg-surface cursor-pointer rounded-md text-xs"
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

          <div className="flex justify-end gap-2.5 pt-3 border-t border-separator/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-separator text-foreground font-semibold hover:bg-surface-elevated cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              <span>{isEditing ? 'Save Changes' : 'Create Batch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
