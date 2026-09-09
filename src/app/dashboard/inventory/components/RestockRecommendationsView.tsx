'use client';

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  PackagePlus,
  Banknote,
  TrendingUp,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Boxes,
  FileText,
  X,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  RestockRecommendation,
  DemandForecastSummary,
  StockHealthStatus,
} from '@/types/intelligence-demand';
import { createDraftPOFromRestockAction } from '@/app/actions/intelligence-demand';
import { formatCurrency } from '@/utils/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface SupplierOption {
  id: string;
  name: string;
  default_lead_days?: number | null;
}

interface RestockRecommendationsViewProps {
  initialRecommendations: RestockRecommendation[];
  initialSummary: DemandForecastSummary;
  suppliers: SupplierOption[];
}

export function RestockRecommendationsView({
  initialRecommendations,
  initialSummary,
  suppliers,
}: RestockRecommendationsViewProps) {
  const router = useRouter();
  const [recommendations] = useState<RestockRecommendation[]>(initialRecommendations);
  const [summary] = useState<DemandForecastSummary>(initialSummary);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [healthFilter, setHealthFilter] = useState<'all' | StockHealthStatus>('all');
  const [supplierFilter, setSupplierFilter] = useState<'all' | string>('all');

  // Multi-select & custom quantities
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customQuantities, setCustomQuantities] = useState<Record<string, number>>({});

  // PO creation modal state
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [poNotes, setPoNotes] = useState('');
  const [isCreatingPO, setIsCreatingPO] = useState(false);
  const [createdPO, setCreatedPO] = useState<{ id: string; poNumber?: string } | null>(null);

  // Filtered list
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((rec) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = rec.productName.toLowerCase().includes(q);
        const matchesVariant = rec.variantName.toLowerCase().includes(q);
        const matchesSku = rec.sku?.toLowerCase().includes(q);
        if (!matchesName && !matchesVariant && !matchesSku) return false;
      }

      // Health
      if (healthFilter !== 'all' && rec.healthStatus !== healthFilter) {
        return false;
      }

      // Supplier
      if (supplierFilter !== 'all') {
        if (!rec.preferredSupplier || rec.preferredSupplier.id !== supplierFilter) {
          return false;
        }
      }

      return true;
    });
  }, [recommendations, searchQuery, healthFilter, supplierFilter]);

  // Handle selection toggling
  const toggleSelect = (variantId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(variantId)) {
        next.delete(variantId);
      } else {
        next.add(variantId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecommendations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecommendations.map((r) => r.variantId)));
    }
  };

  const handleQuantityChange = (variantId: string, value: string) => {
    const num = Math.max(1, parseInt(value, 10) || 1);
    setCustomQuantities((prev) => ({ ...prev, [variantId]: num }));
  };

  // Selected items calculations
  const selectedItems = useMemo(() => {
    return recommendations.filter((r) => selectedIds.has(r.variantId));
  }, [recommendations, selectedIds]);

  const selectedTotalCost = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const qty = customQuantities[item.variantId] ?? item.suggestedReorderQuantity;
      return sum + qty * item.estimatedUnitCost;
    }, 0);
  }, [selectedItems, customQuantities]);

  // Open Draft PO confirmation modal
  const handleOpenPOModal = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to generate a purchase order.');
      return;
    }

    // Determine default supplier if all selected items share one
    const suppliersInSelection = Array.from(
      new Set(selectedItems.map((i) => i.preferredSupplier?.id).filter(Boolean))
    ) as string[];

    if (suppliersInSelection.length === 1 && suppliersInSelection[0]) {
      setSelectedSupplierId(suppliersInSelection[0]);
    } else if (suppliers.length > 0) {
      setSelectedSupplierId(suppliers[0].id);
    } else {
      setSelectedSupplierId('');
    }

    setPoNotes('');
    setCreatedPO(null);
    setIsPOModalOpen(true);
  };

  // Submit Draft PO
  const handleConfirmCreatePO = async () => {
    if (!selectedSupplierId) {
      toast.error('Please select a supplier for the purchase order.');
      return;
    }

    setIsCreatingPO(true);

    try {
      const itemsPayload = selectedItems.map((item) => ({
        variantId: item.variantId,
        quantity: customQuantities[item.variantId] ?? item.suggestedReorderQuantity,
        costPrice: item.estimatedUnitCost,
      }));

      const res = await createDraftPOFromRestockAction({
        supplierId: selectedSupplierId,
        items: itemsPayload,
        notes: poNotes.trim() || undefined,
      });

      if (!res.success || !res.data) {
        toast.error(res.error || 'Failed to create draft purchase order');
        setIsCreatingPO(false);
        return;
      }

      toast.success(`Draft Purchase Order ${res.data.poNumber || ''} created successfully!`);
      setCreatedPO({
        id: res.data.purchaseOrderId,
        poNumber: res.data.poNumber,
      });
      setSelectedIds(new Set());
      router.refresh();
    } catch (err: unknown) {
      console.error('Error creating PO:', err);
      toast.error('An unexpected error occurred while creating the purchase order');
    } finally {
      setIsCreatingPO(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Bento Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Stockouts */}
        <div className="bg-surface border border-separator rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted tracking-wider uppercase">Critical Stockouts</p>
              <h3 className="text-2xl font-black text-foreground mt-1 tabular-nums">
                {summary.criticalStockoutsCount}
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-separator/60">
            <p className="text-[11px] text-muted">
              {summary.criticalStockoutsCount > 0 ? (
                <span className="text-destructive font-semibold">Stock running out within supplier lead time</span>
              ) : (
                <span className="text-emerald-600 font-semibold">Zero critical shortages detected</span>
              )}
            </p>
          </div>
        </div>

        {/* Suggested Restock Items */}
        <div className="bg-surface border border-separator rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted tracking-wider uppercase">Suggested Restocks</p>
              <h3 className="text-2xl font-black text-foreground mt-1 tabular-nums">
                {summary.criticalStockoutsCount + summary.warningStockoutsCount}
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
              <PackagePlus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-separator/60">
            <p className="text-[11px] text-muted">
              <span className="font-semibold text-foreground">{summary.warningStockoutsCount}</span> items nearing reorder threshold
            </p>
          </div>
        </div>

        {/* Projected Capital Needed */}
        <div className="bg-surface border border-separator rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted tracking-wider uppercase">Projected Reorder Capital</p>
              <h3 className="text-2xl font-black text-foreground mt-1 tabular-nums">
                {formatCurrency(summary.totalSuggestedCapitalGhs)}
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-separator/60">
            <p className="text-[11px] text-muted">
              Est. landed replenishment budget for active stockouts
            </p>
          </div>
        </div>

        {/* Average Daily Velocity */}
        <div className="bg-surface border border-separator rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted tracking-wider uppercase">Average Daily Velocity</p>
              <h3 className="text-2xl font-black text-foreground mt-1 tabular-nums">
                {summary.averageVelocity} <span className="text-sm font-semibold text-muted">units/day</span>
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-separator/60">
            <p className="text-[11px] text-muted">
              Tracked across <span className="font-semibold text-foreground">{summary.totalVariantsTracked}</span> product variants
            </p>
          </div>
        </div>
      </div>

      {/* Floating Selection Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-20 bg-surface-elevated border border-brand-primary/40 rounded-2xl p-3.5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-brand-primary/15 text-brand-primary flex items-center justify-center font-bold text-xs">
              {selectedIds.size}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected for reorder
              </p>
              <p className="text-[11px] text-muted">
                Estimated Procurement Capital:{' '}
                <span className="font-bold text-foreground">{formatCurrency(selectedTotalCost)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs font-medium"
            >
              Clear Selection
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenPOModal}
              className="text-xs font-bold flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Create Draft PO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Table & Filtering Container */}
      <div className="bg-surface border border-separator rounded-2xl overflow-hidden shadow-xs flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-separator flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-elevated/20">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product, variant, or SKU..."
                className="w-full pl-9 pr-3 py-2 bg-surface border border-separator rounded-xl text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-primary transition"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Health Filter */}
            <select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value as 'all' | StockHealthStatus)}
              className="px-3 py-2 bg-surface border border-separator rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="all">All Health Statuses</option>
              <option value="critical">Critical (&lt; 7 days)</option>
              <option value="warning">Low Stock (At Reorder)</option>
              <option value="healthy">Healthy Stock</option>
              <option value="no_sales">No Sales (30 Days)</option>
              <option value="overstocked">Overstocked (&gt; 90 Days)</option>
            </select>

            {/* Supplier Filter */}
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="px-3 py-2 bg-surface border border-separator rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="all">All Preferred Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        {filteredRecommendations.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-2xl bg-surface-elevated border border-separator flex items-center justify-center text-muted mb-3">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">No restock recommendations found</h3>
            <p className="text-xs text-muted mt-1 max-w-sm">
              {searchQuery || healthFilter !== 'all' || supplierFilter !== 'all'
                ? 'No items match your active search or filter criteria.'
                : 'All your stock levels are optimal based on 30-day sales velocity and lead times.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-separator bg-surface-elevated/40 text-muted font-semibold">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredRecommendations.length > 0 &&
                        selectedIds.size === filteredRecommendations.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-separator text-brand-primary focus:ring-brand-primary/20"
                      aria-label="Select all restock items"
                    />
                  </th>
                  <th className="px-4 py-3">Product &amp; Variant</th>
                  <th className="px-4 py-3">Stock Health</th>
                  <th className="px-4 py-3 text-right">Current Stock</th>
                  <th className="px-4 py-3 text-right">Daily Burn</th>
                  <th className="px-4 py-3">Depletion Forecast</th>
                  <th className="px-4 py-3 text-right">Suggested Reorder</th>
                  <th className="px-4 py-3">Preferred Supplier</th>
                  <th className="px-4 py-3 text-right">Est. Landed Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator/60">
                {filteredRecommendations.map((item) => {
                  const isSelected = selectedIds.has(item.variantId);
                  const activeQty =
                    customQuantities[item.variantId] ?? item.suggestedReorderQuantity;
                  const itemTotalCost = activeQty * item.estimatedUnitCost;

                  return (
                    <tr
                      key={item.variantId}
                      className={`hover:bg-surface-elevated/40 transition-colors ${
                        isSelected ? 'bg-brand-primary/5' : ''
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.variantId)}
                          className="rounded border-separator text-brand-primary focus:ring-brand-primary/20"
                          aria-label={`Select ${item.productName}`}
                        />
                      </td>

                      {/* Product & Variant */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-foreground">{item.productName}</div>
                        <div className="flex items-center gap-1.5 text-muted text-[11px] mt-0.5">
                          <span>{item.variantName}</span>
                          {item.sku && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{item.sku}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Stock Health Badge */}
                      <td className="px-4 py-3.5">
                        {item.healthStatus === 'critical' ? (
                          <Badge variant="destructive" dot size="sm">
                            Critical (&lt; 7d)
                          </Badge>
                        ) : item.healthStatus === 'warning' ? (
                          <Badge variant="warning" dot size="sm">
                            Low Stock
                          </Badge>
                        ) : item.healthStatus === 'healthy' ? (
                          <Badge variant="success" dot size="sm">
                            Healthy
                          </Badge>
                        ) : item.healthStatus === 'overstocked' ? (
                          <Badge variant="info" dot size="sm">
                            Overstocked
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            No Sales (30d)
                          </Badge>
                        )}
                      </td>

                      {/* Current Stock */}
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-foreground">
                        {item.currentStock}
                        <span className="text-[10px] text-muted ml-1">units</span>
                      </td>

                      {/* Daily Velocity */}
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {item.dailyVelocity > 0 ? (
                          <span className="font-semibold text-foreground">
                            {item.dailyVelocity.toFixed(1)}{' '}
                            <span className="text-[10px] text-muted">/ day</span>
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>

                      {/* Depletion Forecast */}
                      <td className="px-4 py-3.5">
                        {item.currentStock === 0 ? (
                          <span className="inline-flex items-center gap-1 text-destructive font-bold text-[11px]">
                            <AlertTriangle className="w-3 h-3" />
                            Out of stock
                          </span>
                        ) : item.daysOfStockRemaining === Infinity ? (
                          <span className="text-muted text-[11px]">Stable (No burn)</span>
                        ) : (
                          <div>
                            <div className="font-semibold text-foreground text-[11px] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-muted" />
                              <span>{Math.round(item.daysOfStockRemaining)} days remaining</span>
                            </div>
                            {item.projectedRunOutDate && (
                              <div className="text-[10px] text-muted mt-0.5">
                                Run-out: {new Date(item.projectedRunOutDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Suggested Reorder Qty (Editable) */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <input
                            type="number"
                            min="1"
                            value={activeQty}
                            onChange={(e) => handleQuantityChange(item.variantId, e.target.value)}
                            className="w-16 px-2 py-1 bg-surface border border-separator rounded-lg text-xs text-right font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-primary"
                          />
                          <span className="text-[10px] text-muted">pcs</span>
                        </div>
                        <div className="text-[10px] text-muted mt-0.5">
                          Point: {item.reorderPoint}
                        </div>
                      </td>

                      {/* Preferred Supplier */}
                      <td className="px-4 py-3.5">
                        {item.preferredSupplier ? (
                          <div>
                            <div className="font-semibold text-foreground">
                              {item.preferredSupplier.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted mt-0.5">
                              <span>{item.preferredSupplier.defaultLeadDays}d lead</span>
                              <span>•</span>
                              <span className="text-emerald-600 font-bold">
                                {Math.round(item.preferredSupplier.reliabilityScore)}% rel.
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted text-[11px] italic">No supplier set</span>
                        )}
                      </td>

                      {/* Est Landed Cost */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="font-bold text-foreground tabular-nums">
                          {formatCurrency(itemTotalCost)}
                        </div>
                        <div className="text-[10px] text-muted mt-0.5">
                          {formatCurrency(item.estimatedUnitCost)} / unit
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Draft PO Confirmation Modal */}
      {isPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface border border-separator rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between p-4 border-b border-separator">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-primary" />
                <h3 className="font-bold text-foreground text-sm">Generate Draft Purchase Order</h3>
              </div>
              <button
                onClick={() => setIsPOModalOpen(false)}
                className="p-1 rounded-lg text-muted hover:bg-surface-elevated hover:text-foreground transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createdPO ? (
              <div className="p-6 text-center flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-foreground">
                  Purchase Order Created
                </h4>
                <p className="text-xs text-muted mt-1 max-w-sm">
                  Draft Purchase Order <span className="font-bold text-foreground">{createdPO.poNumber}</span> has been created with expected delivery lead time automatically calculated.
                </p>

                <div className="flex items-center gap-3 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsPOModalOpen(false);
                      setCreatedPO(null);
                    }}
                  >
                    Close
                  </Button>
                  <Link href="/dashboard/purchasing">
                    <Button variant="primary" size="sm" className="flex items-center gap-1.5">
                      <span>View in Purchasing</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Supplier Picker */}
                <div>
                  <label htmlFor="modal-supplier-select" className="block text-xs font-bold text-foreground mb-1.5">
                    Assign Supplier *
                  </label>
                  <select
                    id="modal-supplier-select"
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-separator rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="">Select a supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.default_lead_days || 14} days lead time)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Items Summary List */}
                <div>
                  <p className="text-xs font-bold text-foreground mb-1.5">
                    Items to Include ({selectedItems.length})
                  </p>
                  <div className="max-h-48 overflow-y-auto border border-separator rounded-xl divide-y divide-separator/60">
                    {selectedItems.map((item) => {
                      const qty =
                        customQuantities[item.variantId] ?? item.suggestedReorderQuantity;
                      const lineCost = qty * item.estimatedUnitCost;
                      return (
                        <div
                          key={item.variantId}
                          className="px-3 py-2 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-foreground">{item.productName}</div>
                            <div className="text-[10px] text-muted">{item.variantName}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold tabular-nums">{qty} pcs</div>
                            <div className="text-[10px] text-muted">{formatCurrency(lineCost)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PO Notes */}
                <div>
                  <label htmlFor="po-notes" className="block text-xs font-bold text-foreground mb-1.5">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    id="po-notes"
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    rows={2}
                    placeholder="E.g., Expedited sea freight replenishment batch..."
                    className="w-full px-3 py-2 bg-surface border border-separator rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>

                {/* Financial Summary */}
                <div className="p-3 bg-surface-elevated/60 border border-separator/80 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted">Estimated Total Cost:</span>
                  <span className="text-sm font-black text-foreground tabular-nums">
                    {formatCurrency(selectedTotalCost)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPOModalOpen(false)}
                    disabled={isCreatingPO}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmCreatePO}
                    disabled={isCreatingPO || !selectedSupplierId}
                    className="flex items-center gap-1.5 font-bold"
                  >
                    {isCreatingPO ? 'Creating PO...' : 'Create Draft Purchase Order'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
