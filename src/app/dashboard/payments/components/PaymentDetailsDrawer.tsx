'use client';

import React from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Payment } from '@/types/payments';
import { PAYMENT_PROVIDERS, PAYMENT_STATUS_CONFIG } from '../constants';
import { formatCurrency, formatDate } from '@/utils/format';
import { Copy, Receipt, User, ShoppingBag, CreditCard, Phone, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentDetailsDrawerProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentDetailsDrawer({ payment, isOpen, onClose }: PaymentDetailsDrawerProps) {
  if (!payment) return null;

  const providerConfig = PAYMENT_PROVIDERS[payment.provider] || {
    label: payment.provider,
    badgeClass: 'bg-surface-elevated text-foreground',
  };

  const statusConfig = PAYMENT_STATUS_CONFIG[payment.status] || {
    label: payment.status,
    badgeClass: 'bg-surface-elevated text-foreground',
    dotClass: 'bg-muted',
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handlePrint = () => {
    window.print();
  };

  const customerName =
    payment.customer?.name || payment.order?.customer?.name || payment.sender_name || 'Walk-in / Direct';
  const customerPhone = payment.customer?.phone || payment.order?.customer?.phone || payment.sender_phone || 'N/A';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction Details"
      icon={<Receipt className="text-brand-primary" size={20} />}
      description={`Reference: ${payment.transaction_ref || '#' + payment.id.slice(0, 8)}`}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" leftIcon={<Printer size={15} />} onClick={handlePrint}>
            Print Receipt
          </Button>
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Amount Banner */}
        <div className="p-4 rounded-2xl bg-surface-elevated/60 border border-separator flex items-center justify-between">
          <div>
            <div className="text-xs text-muted font-medium">Gross Amount</div>
            <div className="text-2xl font-bold text-foreground mt-0.5">{formatCurrency(payment.amount, 'GHS')}</div>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="p-4 rounded-2xl border border-separator bg-surface space-y-2.5">
          <div className="text-xs font-semibold text-foreground uppercase tracking-wider">Settlement Breakdown</div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Gross Inflow</span>
            <span className="font-medium text-foreground">{formatCurrency(payment.amount, 'GHS')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Gateway / Telco Fee</span>
            <span className="font-medium text-destructive">- {formatCurrency(payment.fee, 'GHS')}</span>
          </div>
          <div className="h-px bg-separator my-1" />
          <div className="flex justify-between text-sm font-bold">
            <span className="text-foreground">Net Inflow to Merchant</span>
            <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(payment.net_amount, 'GHS')}</span>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Payment Method */}
          <div className="p-3.5 rounded-xl border border-separator bg-surface space-y-1">
            <div className="text-xs text-muted flex items-center gap-1">
              <CreditCard size={13} />
              Payment Method
            </div>
            <div className="font-semibold text-sm text-foreground">{providerConfig.label}</div>
          </div>

          {/* Transaction Ref */}
          <div className="p-3.5 rounded-xl border border-separator bg-surface space-y-1">
            <div className="text-xs text-muted flex items-center justify-between">
              <span>Transaction Ref</span>
              {payment.transaction_ref && (
                <button
                  onClick={() => copyToClipboard(payment.transaction_ref!, 'Ref')}
                  className="text-brand-primary hover:underline flex items-center gap-0.5 text-[11px]"
                >
                  <Copy size={10} /> Copy
                </button>
              )}
            </div>
            <div className="font-mono text-sm font-semibold text-foreground truncate">
              {payment.transaction_ref || 'N/A'}
            </div>
          </div>

          {/* Customer */}
          <div className="p-3.5 rounded-xl border border-separator bg-surface space-y-1">
            <div className="text-xs text-muted flex items-center gap-1">
              <User size={13} />
              Customer
            </div>
            <div className="font-semibold text-sm text-foreground truncate">{customerName}</div>
            <div className="text-xs text-muted flex items-center gap-1">
              <Phone size={11} /> {customerPhone}
            </div>
          </div>

          {/* Linked Order */}
          <div className="p-3.5 rounded-xl border border-separator bg-surface space-y-1">
            <div className="text-xs text-muted flex items-center gap-1">
              <ShoppingBag size={13} />
              Linked Order
            </div>
            {payment.order ? (
              <div>
                <span className="font-mono font-semibold text-sm text-brand-primary">
                  #ORD-{payment.order.id.slice(0, 8)}
                </span>
                <span className="text-xs text-muted ml-2">({payment.order.status})</span>
              </div>
            ) : (
              <div className="text-xs text-muted">Direct / Non-Order Payment</div>
            )}
          </div>
        </div>

        {/* Date & Sender Details */}
        <div className="p-4 rounded-xl border border-separator bg-surface space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted">Payment Date:</span>
            <span className="font-medium text-foreground">{formatDate(payment.payment_date)}</span>
          </div>
          {payment.sender_name && (
            <div className="flex justify-between">
              <span className="text-muted">Sender Registered Name:</span>
              <span className="font-medium text-foreground">{payment.sender_name}</span>
            </div>
          )}
          {payment.sender_phone && (
            <div className="flex justify-between">
              <span className="text-muted">Sender Registered Phone:</span>
              <span className="font-medium text-foreground">{payment.sender_phone}</span>
            </div>
          )}
          {payment.notes && (
            <div className="pt-2 border-t border-separator">
              <span className="text-muted block mb-1">Notes / Memo:</span>
              <p className="text-foreground bg-surface-elevated/50 p-2 rounded-lg font-mono text-[11px]">
                {payment.notes}
              </p>
            </div>
          )}
          {payment.refund_reason && (
            <div className="pt-2 border-t border-destructive/20 text-destructive bg-destructive/5 p-2 rounded-lg">
              <span className="font-semibold block mb-0.5">Refund Reason:</span>
              <p>{payment.refund_reason}</p>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
