'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BranchData, BulkInterBranchTransferInput } from '@/types/branches';
import { X, Loader2, ArrowLeftRight, Check, Trash2, Search, Plus, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export interface TransferableVariant {
  id: string;
  sku: string;
  name: string;
  productName: string;
  storeInventory: Record<string, number>;
}

interface TransferBatchItem {
  variantId: string;
  quantity: number;
}

interface StockTransferModalProps {
  branches: BranchData[];
  initialSourceBranch?: BranchData | null;
  variants: TransferableVariant[];
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (input: BulkInterBranchTransferInput) => Promise<void>;
  isPending?: boolean;
}

export function StockTransferModal({
  branches,
  initialSourceBranch,
  variants,
  isOpen,
  onClose,
  onTransfer,
  isPending = false,
}: StockTransferModalProps) {
  const [sourceStoreId, setSourceStoreId] = useState<string>(initialSourceBranch?.id || branches[0]?.id || '');
  const otherBranches = branches.filter((b) => b.id !== sourceStoreId);
  const [targetStoreId, setTargetStoreId] = useState<string>(otherBranches[0]?.id || '');
  const [batchItems, setBatchItems] = useState<TransferBatchItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleAddVariant = (variantId: string) => {
    const variant = variants.find((v) => v.id === variantId);
    const available = variant?.storeInventory?.[sourceStoreId] ?? 0;

    if (available <= 0) {
      toast.error('This product has 0 units available at the selected source branch');
      return;
    }

    setBatchItems((prev) => {
      const existing = prev.find((item) => item.variantId === variantId);
      if (existing) {
        return prev.map((item) =>
          item.variantId === variantId ? { ...item, quantity: Math.min(available, item.quantity + 1) } : item
        );
      }
      return [...prev, { variantId, quantity: 1 }];
    });

    // Close dropdown and clear search query immediately
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleUpdateQuantity = (variantId: string, quantity: number) => {
    const variant = variants.find((v) => v.id === variantId);
    const maxQty = variant?.storeInventory?.[sourceStoreId] ?? 1;
    const validatedQty = Math.max(1, Math.min(maxQty, quantity));

    setBatchItems((prev) =>
      prev.map((item) => (item.variantId === variantId ? { ...item, quantity: validatedQty } : item))
    );
  };

  const handleRemoveItem = (variantId: string) => {
    setBatchItems((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const filteredVariants = variants.filter((v) => {
    const matchesSearch =
      v.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalUnits = batchItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceStoreId || !targetStoreId) {
      toast.error('Please select both source and destination branches');
      return;
    }
    if (sourceStoreId === targetStoreId) {
      toast.error('Source and destination cannot be the same');
      return;
    }
    if (batchItems.length === 0) {
      toast.error('Please add at least one product to the transfer batch');
      return;
    }

    await onTransfer({
      sourceStoreId,
      targetStoreId,
      items: batchItems,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface border border-separator rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-separator/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <ArrowLeftRight size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground font-display">Bulk Stock Transfer</h2>
              <p className="text-xs text-muted">Reallocate multiple items between physical branches.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          {/* Branch Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">From (Source)</label>
              <select
                value={sourceStoreId}
                onChange={(e) => {
                  setSourceStoreId(e.target.value);
                  setBatchItems([]); // Reset batch on source branch change
                  const remaining = branches.filter((b) => b.id !== e.target.value);
                  if (remaining.length > 0 && targetStoreId === e.target.value) {
                    setTargetStoreId(remaining[0].id);
                  }
                }}
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-brand-primary font-medium"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.is_primary ? '(HQ)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">To (Destination)</label>
              <select
                value={targetStoreId}
                onChange={(e) => setTargetStoreId(e.target.value)}
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-brand-primary font-medium"
              >
                {branches
                  .filter((b) => b.id !== sourceStoreId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.is_primary ? '(HQ)' : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Product Search & Dropdown Picker */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold text-foreground mb-1">Select &amp; Add Products</label>
            <div
              onClick={() => setIsDropdownOpen(true)}
              className="flex items-center gap-2 bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-xs cursor-pointer focus-within:ring-1 focus-within:ring-brand-primary"
            >
              <Search size={14} className="text-muted shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                placeholder="Search by product name or SKU to add to batch..."
                className="w-full bg-transparent outline-none placeholder:text-muted/60 text-xs"
              />
              <ChevronDown size={14} className="text-muted shrink-0" />
            </div>

            {/* Dropdown Popover */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-separator rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto divide-y divide-separator/50 custom-scrollbar animate-fadeIn">
                {filteredVariants.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted">No matching products found</div>
                ) : (
                  filteredVariants.map((v) => {
                    const available = v.storeInventory?.[sourceStoreId] ?? 0;
                    const isAlreadyAdded = batchItems.some((item) => item.variantId === v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleAddVariant(v.id)}
                        disabled={available <= 0}
                        className={`w-full p-2.5 text-left text-xs flex items-center justify-between cursor-pointer transition ${
                          available <= 0
                            ? 'opacity-40 cursor-not-allowed bg-muted/5'
                            : isAlreadyAdded
                              ? 'bg-brand-primary/10 text-brand-primary font-bold'
                              : 'hover:bg-surface-elevated'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate font-medium text-foreground">
                            {v.productName} {v.name ? `(${v.name})` : ''}
                          </p>
                          <p className="text-[10px] text-muted font-mono">SKU: {v.sku}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-surface border border-separator">
                            {available} in stock
                          </span>
                          <Plus size={14} className="text-muted" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Transfer Batch Items List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-foreground">
                Transfer Manifest ({batchItems.length} items, {totalUnits} units total)
              </label>
            </div>

            {batchItems.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-separator rounded-xl bg-surface-elevated/40 space-y-1">
                <p className="text-xs font-semibold text-muted">No items in transfer batch yet</p>
                <p className="text-[11px] text-muted/80">
                  Search and click products above to add them to this transfer batch.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar border border-separator rounded-xl p-1.5">
                {batchItems.map((item) => {
                  const variant = variants.find((v) => v.id === item.variantId);
                  const available = variant?.storeInventory?.[sourceStoreId] ?? 0;
                  return (
                    <div
                      key={item.variantId}
                      className="flex items-center justify-between gap-3 p-2 rounded-lg bg-surface border border-separator/60 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">
                          {variant?.productName} {variant?.name ? `(${variant.name})` : ''}
                        </p>
                        <p className="text-[10px] text-muted font-mono">
                          SKU: {variant?.sku} | Available: {available}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted">Qty:</span>
                          <input
                            type="number"
                            min={1}
                            max={available}
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item.variantId, parseInt(e.target.value, 10) || 1)}
                            className="w-16 bg-surface-elevated border border-separator rounded-lg px-2 py-1 text-xs font-mono text-center outline-none focus:ring-1 focus:ring-brand-primary"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.variantId)}
                          className="p-1 text-muted hover:text-destructive hover:bg-destructive/10 rounded-md cursor-pointer transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-separator/50">
            <span className="text-xs text-muted font-medium">
              Total: <strong className="text-foreground">{totalUnits} units</strong> ({batchItems.length} SKUs)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-foreground border border-separator hover:bg-surface-elevated cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || batchItems.length === 0}
                className="px-5 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 disabled:opacity-50 cursor-pointer transition flex items-center gap-1.5 shadow-xs"
              >
                {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                <span>{isPending ? 'Transferring...' : `Transfer ${totalUnits} Units`}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
