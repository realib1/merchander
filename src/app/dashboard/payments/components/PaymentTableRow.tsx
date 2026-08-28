'use client';

import React from 'react';
import { Payment } from '@/types/payments';
import { PAYMENT_PROVIDERS, PAYMENT_STATUS_CONFIG } from '../constants';
import { formatCurrency, formatDate } from '@/utils/format';
import { Eye, RotateCcw, Trash2, Copy, Smartphone, Truck, CreditCard, Building2, Banknote, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentTableRowProps {
  payment: Payment;
  onViewDetails: (payment: Payment) => void;
  onRefund: (payment: Payment) => void;
  onDelete: (paymentId: string, ref: string | null) => void;
}

export function PaymentTableRow({ payment: p, onViewDetails, onRefund, onDelete }: PaymentTableRowProps) {
  const providerConfig = PAYMENT_PROVIDERS[p.provider] || {
    label: p.provider,
    badgeClass: 'bg-surface-elevated text-foreground',
  };

  const statusConfig = PAYMENT_STATUS_CONFIG[p.status] || {
    label: p.status,
    badgeClass: 'bg-surface-elevated text-foreground',
    dotClass: 'bg-muted',
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'mtn_momo':
      case 'telecel_cash':
      case 'at_money':
        return <Smartphone size={13} />;
      case 'cash_on_delivery':
        return <Truck size={13} />;
      case 'cash':
        return <Banknote size={13} />;
      case 'card':
        return <CreditCard size={13} />;
      case 'bank_transfer':
        return <Building2 size={13} />;
      default:
        return <Zap size={13} />;
    }
  };

  const customerName = p.customer?.name || p.order?.customer?.name || p.sender_name || 'Walk-in / Direct';
  const customerPhone = p.customer?.phone || p.order?.customer?.phone || p.sender_phone;

  return (
    <tr className="hover:bg-surface-elevated/40 transition-colors group">
      {/* Transaction Ref */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-semibold text-foreground">{p.transaction_ref || '#' + p.id.slice(0, 8)}</span>
          {p.transaction_ref && (
            <button
              onClick={() => copyToClipboard(p.transaction_ref!, 'Ref')}
              className="opacity-0 group-hover:opacity-100 text-muted hover:text-brand-primary transition-opacity cursor-pointer"
              title="Copy reference"
              aria-label="Copy reference"
            >
              <Copy size={11} />
            </button>
          )}
        </div>
        {p.order && <div className="text-[10px] text-muted font-mono mt-0.5">Order #{p.order.id.slice(0, 8)}</div>}
      </td>

      {/* Payment Date */}
      <td className="py-3 px-4 text-muted whitespace-nowrap">{formatDate(p.payment_date)}</td>

      {/* Customer / Sender */}
      <td className="py-3 px-4">
        <div className="font-semibold text-foreground truncate max-w-37.5">{customerName}</div>
        {customerPhone && <div className="text-[10px] text-muted font-mono">{customerPhone}</div>}
      </td>

      {/* Method Pill */}
      <td className="py-3 px-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${providerConfig.badgeClass}`}
        >
          {getProviderIcon(p.provider)}
          {providerConfig.label}
        </span>
      </td>

      {/* Gross Amount */}
      <td className="py-3 px-4 text-right font-semibold text-foreground whitespace-nowrap">
        {formatCurrency(p.amount, 'GHS')}
      </td>

      {/* Fee */}
      <td className="py-3 px-4 text-right text-muted whitespace-nowrap">
        {p.fee > 0 ? (
          <span className="text-destructive font-mono">- {formatCurrency(p.fee, 'GHS')}</span>
        ) : (
          <span className="text-muted/60">GHS 0.00</span>
        )}
      </td>

      {/* Net Amount */}
      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
        {formatCurrency(p.net_amount, 'GHS')}
      </td>

      {/* Status Badge */}
      <td className="py-3 px-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusConfig.badgeClass}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
          {statusConfig.label}
        </span>
      </td>

      {/* Row Actions */}
      <td className="py-3 px-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          {/* View Details */}
          <button
            onClick={() => onViewDetails(p)}
            className="p-1.5 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors cursor-pointer"
            title="View Details"
            aria-label="View Details"
          >
            <Eye size={15} />
          </button>

          {/* Refund Action (if completed) */}
          {p.status === 'completed' && (
            <button
              onClick={() => onRefund(p)}
              className="p-1.5 hover:text-warning hover:bg-warning/10 rounded-lg transition-colors cursor-pointer"
              title="Record Refund"
              aria-label="Record Refund"
            >
              <RotateCcw size={15} />
            </button>
          )}

          {/* Delete Action */}
          <button
            onClick={() => onDelete(p.id, p.transaction_ref)}
            className="p-1.5 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
            title="Delete Payment Record"
            aria-label="Delete Payment Record"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}
