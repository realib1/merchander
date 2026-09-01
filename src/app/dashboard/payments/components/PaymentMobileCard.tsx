'use client';

import React from 'react';
import { Payment } from '@/types/payments';
import { PAYMENT_PROVIDERS, PAYMENT_STATUS_CONFIG } from '../constants';
import { formatCurrency, formatDate } from '@/utils/format';
import { Eye, RotateCcw, Trash2, Smartphone, Truck, CreditCard, Building2, Banknote, Zap } from 'lucide-react';

interface PaymentMobileCardProps {
  payment: Payment;
  onViewDetails: (payment: Payment) => void;
  onRefund: (payment: Payment) => void;
  onDelete: (paymentId: string, ref: string | null) => void;
}

export function PaymentMobileCard({ payment: p, onViewDetails, onRefund, onDelete }: PaymentMobileCardProps) {
  const providerConfig = PAYMENT_PROVIDERS[p.provider] || {
    label: p.provider,
    badgeClass: 'bg-surface-elevated text-foreground',
  };

  const statusConfig = PAYMENT_STATUS_CONFIG[p.status] || {
    label: p.status,
    badgeClass: 'bg-surface-elevated text-foreground',
    dotClass: 'bg-muted',
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'mtn_momo':
      case 'telecel_cash':
      case 'at_money':
        return <Smartphone size={12} />;
      case 'cash_on_delivery':
        return <Truck size={12} />;
      case 'cash':
        return <Banknote size={12} />;
      case 'card':
        return <CreditCard size={12} />;
      case 'bank_transfer':
        return <Building2 size={12} />;
      default:
        return <Zap size={12} />;
    }
  };

  const customerName = p.customer?.name || p.order?.customer?.name || p.sender_name || 'Walk-in / Direct';
  const customerPhone = p.customer?.phone || p.order?.customer?.phone || p.sender_phone;

  return (
    <div className="p-3.5 border-b border-separator bg-surface hover:bg-surface-elevated/40 transition-colors space-y-2.5">
      {/* Top row: Ref + Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono font-bold text-xs text-foreground truncate">
            {p.transaction_ref || '#' + p.id.slice(0, 8)}
          </span>
          {p.order && <span className="text-[10px] text-muted font-mono shrink-0">#ORD-{p.order.id.slice(0, 6)}</span>}
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${statusConfig.badgeClass}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
          {statusConfig.label}
        </span>
      </div>

      {/* Customer + Date */}
      <div className="flex items-center justify-between text-xs">
        <div className="min-w-0 pr-2">
          <p className="font-semibold text-foreground truncate">{customerName}</p>
          {customerPhone && <p className="text-[11px] text-muted font-mono">{customerPhone}</p>}
        </div>
        <p className="text-[11px] text-muted shrink-0">{formatDate(p.payment_date)}</p>
      </div>

      {/* Method + Amount + Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-separator/50">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${providerConfig.badgeClass}`}
        >
          {getProviderIcon(p.provider)}
          {providerConfig.label}
        </span>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(p.net_amount, 'GHS')}
            </span>
            {p.fee > 0 && <span className="text-[10px] text-muted block">Fee: {formatCurrency(p.fee, 'GHS')}</span>}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onViewDetails(p)}
              className="p-1.5 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors cursor-pointer"
              aria-label="View Details"
            >
              <Eye size={15} />
            </button>
            {p.status === 'completed' && (
              <button
                onClick={() => onRefund(p)}
                className="p-1.5 hover:text-warning hover:bg-warning/10 rounded-lg transition-colors cursor-pointer"
                aria-label="Record Refund"
              >
                <RotateCcw size={15} />
              </button>
            )}
            <button
              onClick={() => onDelete(p.id, p.transaction_ref)}
              className="p-1.5 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
              aria-label="Delete Payment Record"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
