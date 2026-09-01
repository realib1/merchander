'use client';

import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface TrackingTimelineProps {
  status?: string;
  primaryColor?: string;
}

export function TrackingTimeline({ status }: TrackingTimelineProps) {
  const steps = [
    { id: 'placed', label: 'Order Placed', desc: 'Received by store' },
    { id: 'confirmed', label: 'Confirmed', desc: 'Payment / order approved' },
    { id: 'dispatched', label: 'Dispatched', desc: 'With delivery rider' },
    { id: 'delivered', label: 'Delivered', desc: 'Delivered to you' },
  ];

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
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const activeIndex = getActiveStepIndex(status);

  if (status === 'cancelled') {
    return (
      <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-xs font-bold flex items-center gap-2">
        <AlertCircle size={16} />
        <span>This order was cancelled. Please contact the store on WhatsApp for assistance.</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-surface-elevated border border-separator shadow-xs">
      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-6">Delivery Progress</h3>

      {/* Mobile: 1-Column Vertical Connected Stepper */}
      <div className="flex flex-col space-y-6 md:hidden">
        {steps.map((step, idx) => {
          const isDone = activeIndex >= idx;
          const isCurrent = activeIndex === idx;
          const isLast = idx === steps.length - 1;

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
        {steps.map((step, idx) => {
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
                {idx < steps.length - 1 && (
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
                <p className="text-[10px] text-muted">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
