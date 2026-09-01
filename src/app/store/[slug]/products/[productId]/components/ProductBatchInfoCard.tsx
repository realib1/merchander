import React from 'react';
import { PreorderBatch } from '@/types/preorder';
import { getBatchCountdown, formatArrivalWindow } from '@/utils/preorder-batch';
import { Clock, Calendar, Truck, ShieldCheck, Ship, Plane } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ProductBatchInfoCardProps {
  batch: PreorderBatch;
  primaryColor?: string;
}

export function ProductBatchInfoCard({ batch, primaryColor = '#3b82f6' }: ProductBatchInfoCardProps) {
  const countdown = getBatchCountdown(batch.closes_at);
  const isFreightAir = batch.freight_mode === 'air' || batch.freight_mode === 'express';

  const closeDateFormatted = (() => {
    try {
      return format(parseISO(batch.closes_at), 'MMMM d, yyyy');
    } catch {
      return batch.closes_at;
    }
  })();

  const supplierOrderDateFormatted = (() => {
    if (!batch.supplier_order_date) return null;
    try {
      return format(parseISO(batch.supplier_order_date), 'MMMM d, yyyy');
    } catch {
      return batch.supplier_order_date;
    }
  })();

  const arrivalWindowText = formatArrivalWindow(batch.expected_arrival_start, batch.expected_arrival_end);

  return (
    <div className="rounded-2xl border border-separator/80 bg-surface-elevated/60 p-4 space-y-3.5 shadow-xs">
      {/* Header Banner */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-2xs"
            style={{ backgroundColor: primaryColor }}
          >
            PRE-ORDER
          </span>
          <span className="text-xs font-bold text-foreground">{batch.name || `Batch ${batch.code}`}</span>
        </div>

        {/* Closing Countdown Badge */}
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
            countdown.isClosed
              ? 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
          }`}
        >
          {countdown.label}
        </span>
      </div>

      {/* Procurement Milestones Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {/* Milestone 1: Cutoff Date */}
        <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface border border-separator/60 text-xs">
          <Clock size={15} className="text-muted shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Orders Close</p>
            <p className="font-semibold text-foreground truncate">{closeDateFormatted}</p>
          </div>
        </div>

        {/* Milestone 2: Supplier Order Placed */}
        {supplierOrderDateFormatted && (
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface border border-separator/60 text-xs">
            <Calendar size={15} className="text-muted shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Supplier PO Placed</p>
              <p className="font-semibold text-foreground truncate">{supplierOrderDateFormatted}</p>
            </div>
          </div>
        )}

        {/* Milestone 3: Expected Arrival Window */}
        <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface border border-separator/60 text-xs sm:col-span-2">
          <Truck size={15} className="text-brand-primary shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Estimated Arrival in Ghana</p>
              <span className="text-[10px] font-medium text-muted flex items-center gap-1">
                {isFreightAir ? <Plane size={11} /> : <Ship size={11} />}
                {isFreightAir ? 'Air Freight' : 'Sea Cargo'}
                {batch.origin_country ? ` from ${batch.origin_country}` : ''}
              </span>
            </div>
            <p className="font-bold text-foreground text-sm mt-0.5">{arrivalWindowText}</p>
          </div>
        </div>
      </div>

      {/* Lock-in Safeguard Notice */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted pt-0.5">
        <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
        <span>Pre-order guaranteed. Doorstep delivery or branch pickup upon arrival.</span>
      </div>
    </div>
  );
}
