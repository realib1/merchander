'use client';

import React, { useState } from 'react';
import { Printer, MessageSquare, Copy, Check, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import {
  generateDispatchSlip,
  formatWaybillForWhatsApp,
  buildRiderWhatsAppShareUrl,
  WaybillOrder,
} from '@/utils/waybill';
import { toast } from 'sonner';

interface WaybillSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: WaybillOrder | null;
}

export function WaybillSlipModal({ isOpen, onClose, order }: WaybillSlipModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const slipText = generateDispatchSlip(order);
  const waShareUrl = order.riderPhone ? buildRiderWhatsAppShareUrl(order.riderPhone, order) : null;
  const isPaid = order.paymentStatus.toLowerCase() === 'paid';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatWaybillForWhatsApp(order));
      setCopied(true);
      toast.success('Waybill message copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy waybill text');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-surface border border-separator rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-separator bg-surface-elevated/40">
          <div>
            <h2 className="text-base font-bold text-foreground font-display flex items-center gap-2">
              Dispatch Waybill Slip
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary font-semibold">
                #{order.shortId || order.orderId.slice(0, 8).toUpperCase()}
              </span>
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Ghana Logistics Dispatch Slip • Thermal POS & WhatsApp Ready
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface-elevated transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Security / Payment Collection Banner */}
        <div className="px-6 py-3 border-b border-separator">
          {isPaid ? (
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={18} className="shrink-0" />
              <div className="text-xs">
                <span className="font-bold">PAID ONLINE:</span> Rider must NOT collect cash from the customer.
                {order.transactionRef && (
                  <span className="block text-[11px] opacity-80">Ref: {order.transactionRef}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={18} className="shrink-0" />
              <div className="text-xs">
                <span className="font-bold">CASH ON DELIVERY (COD):</span> Instruct rider to collect payment upon delivery.
              </div>
            </div>
          )}
        </div>

        {/* Thermal Slip Content (Print Area) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/30">
          <div className="p-5 bg-white text-black dark:bg-zinc-900 dark:text-zinc-100 rounded-xl border border-separator font-mono text-xs shadow-inner leading-relaxed select-all">
            <pre className="whitespace-pre-wrap font-mono break-words">{slipText}</pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-separator bg-surface-elevated/40">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-separator bg-surface hover:bg-surface-elevated transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-separator bg-surface hover:bg-surface-elevated transition-colors"
            >
              <Printer size={14} />
              <span>Print Slip</span>
            </button>
          </div>

          {waShareUrl ? (
            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-2xs transition-colors"
            >
              <MessageSquare size={14} />
              <span>Send to Rider on WhatsApp</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={handleCopy}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-2xs transition-colors"
            >
              <MessageSquare size={14} />
              <span>Copy for WhatsApp</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
