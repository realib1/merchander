'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Clock, Plane, Ship } from 'lucide-react';
import { PreorderBatch, PreorderBatchStatus } from '@/types/preorder';
import { formatArrivalWindow, getBatchCountdown } from '@/utils/preorder-batch';

interface TrackingTimelineProps {
  status?: string;
  batch?: PreorderBatch | null;
  primaryColor?: string;
}

const standardSteps = [
  { id: 'placed', label: 'Order Placed', desc: 'Received by store' },
  { id: 'confirmed', label: 'Confirmed', desc: 'Payment / order approved' },
  { id: 'dispatched', label: 'Dispatched', desc: 'With delivery rider' },
  { id: 'delivered', label: 'Delivered', desc: 'Delivered to you' },
];

const batchSteps: Array<{ id: PreorderBatchStatus | 'JOINED'; label: string; desc: string }> = [
  { id: 'JOINED', label: 'Joined Batch', desc: 'Pre-order slot confirmed' },
  { id: 'CLOSED', label: 'Batch Closed', desc: 'Consolidating supplier PO' },
  { id: 'ORDER_SUBMITTED', label: 'Supplier Order Placed', desc: 'Order placed with factory' },
  { id: 'IN_TRANSIT', label: 'Cargo in Transit', desc: 'Freight en route to Ghana' },
  { id: 'ARRIVED', label: 'Arrived at Hub', desc: 'Customs cleared & sorting' },
  { id: 'FULFILLING', label: 'Dispatched', desc: 'Out for local delivery / pickup' },
  { id: 'COMPLETED', label: 'Delivered', desc: 'Order fulfilled' },
];

export function TrackingTimeline({ status, batch, primaryColor = '#3b82f6' }: TrackingTimelineProps) {
  if (status === 'cancelled') {
    return (
      <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-xs font-bold flex items-center gap-2">
        <AlertCircle size={16} />
        <span>This order was cancelled. Please contact the store on WhatsApp for assistance.</span>
      </div>
    );
  }

  // Pre-Order Batch Lifecycle Timeline
  if (batch) {
    const getBatchActiveIndex = (bStatus: PreorderBatchStatus): number => {
      switch (bStatus) {
        case 'OPEN':
        case 'CLOSING_SOON':
          return 0; // Joined Batch
        case 'CLOSED':
          return 1;
        case 'ORDER_SUBMITTED':
          return 2;
        case 'IN_TRANSIT':
          return 3;
        case 'ARRIVED':
          return 4;
        case 'FULFILLING':
          return 5;
        case 'COMPLETED':
          return 6;
        default:
          return 0;
      }
    };

    const activeBatchIndex = getBatchActiveIndex(batch.status);
    const arrivalWindow = formatArrivalWindow(batch.expected_arrival_start, batch.expected_arrival_end);
    const countdown = getBatchCountdown(batch.closes_at);
    const isAir = batch.freight_mode === 'air' || batch.freight_mode === 'express';

    return (
      <div className="p-5 md:p-7 rounded-3xl bg-surface-elevated border border-separator shadow-xs space-y-6">
        {/* Header Notice */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-separator/60">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded-md text-white text-[10px] font-black uppercase tracking-wider"
                style={{ backgroundColor: primaryColor }}
              >
                Pre-Order Batch
              </span>
              <h3 className="text-sm font-bold text-foreground">{batch.name || `Batch ${batch.code}`}</h3>
            </div>
            <p className="text-xs text-muted mt-1 flex items-center gap-1.5">
              {isAir ? <Plane size={13} /> : <Ship size={13} />}
              <span>
                Estimated Ghana Arrival: <strong className="text-foreground">{arrivalWindow}</strong>
              </span>
            </p>
          </div>

          {!countdown.isClosed && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <Clock size={12} />
              <span>{countdown.label}</span>
            </span>
          )}
        </div>

        {/* Vertical Connected Stepper */}
        <div className="flex flex-col space-y-5">
          {batchSteps.map((step, idx) => {
            const isDone = activeBatchIndex >= idx;
            const isCurrent = activeBatchIndex === idx;
            const isLast = idx === batchSteps.length - 1;

            return (
              <div key={step.id} className="relative flex items-start gap-4">
                {!isLast && (
                  <div
                    className={`absolute left-3.5 top-7 -bottom-5 w-0.5 -ml-px ${
                      activeBatchIndex > idx ? 'bg-success' : 'bg-separator'
                    }`}
                  />
                )}
                <div
                  className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold transition z-10 ${
                    isDone ? 'bg-success text-white shadow-xs' : 'bg-surface border border-separator text-muted'
                  }`}
                >
                  {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                </div>
                <div className="pt-0.5 min-w-0">
                  <h4
                    className={`text-xs font-bold ${
                      isCurrent ? 'text-foreground font-black' : isDone ? 'text-foreground' : 'text-muted'
                    }`}
                  >
                    {step.label}
                  </h4>
                  <p className="text-[11px] text-muted mt-0.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Standard Order Timeline
  const getActiveStepIndex = (st?: string): number => {
    switch (st) {
      case 'draft':
      case 'pending_payment':
        return 0;
      case 'paid':
      case 'processing':
        return 1;
      case 'dispatched':
        return 2;
      case 'delivered':
        return 3;
      default:
        return 0;
    }
  };

  const activeIndex = getActiveStepIndex(status);

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-surface-elevated border border-separator shadow-xs">
      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-6">Delivery Progress</h3>

      {/* Mobile: 1-Column Vertical Stepper */}
      <div className="flex flex-col space-y-6 md:hidden">
        {standardSteps.map((step, idx) => {
          const isDone = activeIndex >= idx;
          const isCurrent = activeIndex === idx;
          const isLast = idx === standardSteps.length - 1;

          return (
            <div key={step.id} className="relative flex items-start gap-4">
              {!isLast && (
                <div
                  className={`absolute left-4 top-8 -bottom-6 w-0.5 -ml-px ${
                    activeIndex > idx ? 'bg-success' : 'bg-separator'
                  }`}
                />
              )}
              <div
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold transition z-10 ${
                  isDone ? 'bg-success text-white shadow-xs' : 'bg-surface border border-separator text-muted'
                }`}
              >
                {isDone ? <CheckCircle2 size={18} /> : idx + 1}
              </div>
              <div className="pt-0.5">
                <h4
                  className={`text-sm font-bold ${
                    isCurrent ? 'text-foreground font-black' : isDone ? 'text-foreground' : 'text-muted'
                  }`}
                >
                  {step.label}
                </h4>
                <p className="text-xs text-muted mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: 4-Column Horizontal Stepper */}
      <div className="hidden md:grid md:grid-cols-4 gap-4">
        {standardSteps.map((step, idx) => {
          const isDone = activeIndex >= idx;
          const isCurrent = activeIndex === idx;

          return (
            <div key={step.id} className="relative flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isDone ? 'bg-success text-white shadow-xs' : 'bg-surface border border-separator text-muted'
                  }`}
                >
                  {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                </div>
                {idx < standardSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full ${activeIndex > idx ? 'bg-success' : 'bg-separator'}`} />
                )}
              </div>
              <div>
                <h4
                  className={`text-xs font-bold ${
                    isCurrent ? 'text-foreground font-black' : isDone ? 'text-foreground' : 'text-muted'
                  }`}
                >
                  {step.label}
                </h4>
                <p className="text-[11px] text-muted mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
