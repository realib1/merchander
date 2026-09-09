'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { PreorderBatch, BatchProcurementSummary } from '@/types/preorder';
import { getBatchConsolidatedProcurement } from '@/app/actions/preorder-batches';
import { formatCurrency } from '@/utils/format';
import { X, Download, Copy, Check, FileText, Loader2, Layers } from 'lucide-react';
import { toast } from 'sonner';

interface SupplierPOExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: PreorderBatch;
  currency?: string;
}

export function SupplierPOExportModal({ isOpen, onClose, batch, currency = 'GHS' }: SupplierPOExportModalProps) {
  const [summary, setSummary] = useState<BatchProcurementSummary | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && batch) {
      startTransition(async () => {
        const res = await getBatchConsolidatedProcurement(batch.id);
        setSummary(res);
      });
    }
  }, [isOpen, batch]);

  if (!isOpen) return null;

  const handleCopyText = () => {
    if (!summary) return;
    const lines = [
      `SUPPLIER PURCHASE ORDER: ${batch.name} (${batch.code})`,
      `Total Pieces: ${summary.totalUnits} | Total Customer Orders: ${summary.totalOrders}`,
      `Cutoff: ${batch.closes_at.slice(0, 10)} | Expected Arrival: ${batch.expected_arrival_start} to ${batch.expected_arrival_end}`,
      `------------------------------------------`,
      ...summary.items.map(
        (i, idx) =>
          `${idx + 1}. ${i.productName} [${i.variantTitle}] - QTY: ${i.totalQuantity}${i.sku ? ` (SKU: ${i.sku})` : ''}`
      ),
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    toast.success('Supplier PO copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    if (!summary || summary.items.length === 0) return;
    const headers = ['Product Name', 'Variant', 'SKU', 'Total Quantity', 'Unit Customer Price'];
    const rows = summary.items.map((i) => [
      `"${i.productName.replace(/"/g, '""')}"`,
      `"${i.variantTitle.replace(/"/g, '""')}"`,
      `"${(i.sku || '').replace(/"/g, '""')}"`,
      i.totalQuantity,
      i.unitPrice,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Supplier_PO_${batch.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-surface border border-separator rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between border-b border-separator/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Supplier Purchase Order (PO)</h2>
              <p className="text-xs text-muted">{batch.name} • Consolidated Packing Manifest</p>
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

        {isPending ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted">
            <Loader2 size={24} className="animate-spin text-brand-primary" />
            <p className="text-xs">Calculating consolidated quantities...</p>
          </div>
        ) : !summary || summary.items.length === 0 ? (
          <div className="py-12 text-center text-muted space-y-1">
            <Layers size={32} className="mx-auto opacity-30" />
            <p className="text-xs font-bold text-foreground">No orders recorded in this batch yet</p>
            <p className="text-[11px]">When customers place pre-orders, their items will appear here consolidated.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-surface-elevated border border-separator">
                <p className="text-[10px] font-bold text-muted uppercase">Total Units to Order</p>
                <p className="text-lg font-black text-foreground tabular-nums mt-0.5">{summary.totalUnits} pcs</p>
              </div>
              <div className="p-3 rounded-2xl bg-surface-elevated border border-separator">
                <p className="text-[10px] font-bold text-muted uppercase">Customer Orders</p>
                <p className="text-lg font-black text-foreground tabular-nums mt-0.5">{summary.totalOrders}</p>
              </div>
              <div className="p-3 rounded-2xl bg-surface-elevated border border-separator">
                <p className="text-[10px] font-bold text-muted uppercase">Estimated Gross Value</p>
                <p className="text-lg font-black text-foreground tabular-nums mt-0.5">
                  {formatCurrency(summary.totalEstimatedRevenue, currency)}
                </p>
              </div>
            </div>

            {/* Manifest Table */}
            <div className="rounded-2xl border border-separator overflow-hidden bg-surface">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-elevated text-muted uppercase text-[10px] font-bold border-b border-separator">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Variant / Option</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3 text-right">Qty to Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator/60">
                  {summary.items.map((item) => (
                    <tr key={item.variantId} className="hover:bg-surface-elevated/40">
                      <td className="p-3 font-semibold text-foreground">{item.productName}</td>
                      <td className="p-3 text-muted">{item.variantTitle}</td>
                      <td className="p-3 font-mono text-[11px] text-muted">{item.sku || 'N/A'}</td>
                      <td className="p-3 text-right font-black text-foreground tabular-nums">
                        {item.totalQuantity} pcs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-separator/80">
              <button
                type="button"
                onClick={handleCopyText}
                className="px-3.5 py-2 rounded-xl bg-surface border border-separator text-foreground text-xs font-semibold hover:bg-surface-elevated flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy for WeChat / WhatsApp'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCsv}
                className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download size={14} />
                <span>Download CSV</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
