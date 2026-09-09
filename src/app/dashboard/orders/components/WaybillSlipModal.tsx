'use client';

import React, { useState } from 'react';
import { Printer, MessageSquare, Copy, Check, ShieldCheck, AlertTriangle } from 'lucide-react';
import {
  generateDispatchSlip,
  formatWaybillForWhatsApp,
  buildRiderWhatsAppShareUrl,
  WaybillOrder,
} from '@/utils/waybill';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';

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
  const isPaid = order.paymentStatus === 'paid';

  const handleCopy = async () => {
    try {
      const text = formatWaybillForWhatsApp(order);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Waybill text copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy waybill text');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen && !!order}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <span>Dispatch Waybill Slip</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary font-semibold">
            #{order.shortId || order.orderId.slice(0, 8).toUpperCase()}
          </span>
        </div>
      }
      description="Ghana Logistics Dispatch Slip • Thermal POS & WhatsApp Ready"
    >
      <div className="space-y-4">
        {/* Security / Payment Collection Banner */}
        <div>
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
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
              <AlertTriangle size={18} className="shrink-0" />
              <div className="text-xs">
                <span className="font-bold">COLLECT CASH ON DELIVERY (COD):</span> Collect GH₵
                {order.totalAmount.toFixed(2)} before releasing goods.
              </div>
            </div>
          )}
        </div>

        {/* Monospace Thermal Slip Preview */}
        <div className="p-4 bg-muted/20 border border-separator rounded-xl overflow-x-auto">
          <pre className="text-[11px] font-mono whitespace-pre text-foreground leading-relaxed">
            {slipText}
          </pre>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-separator">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-separator hover:bg-surface-elevated text-foreground transition-colors cursor-pointer"
          >
            <Printer size={14} />
            <span>Print Slip (58mm/80mm)</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-separator hover:bg-surface-elevated text-foreground transition-colors cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>

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
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-2xs transition-colors cursor-pointer"
            >
              <MessageSquare size={14} />
              <span>Copy for WhatsApp</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
