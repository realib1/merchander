'use client';

import React, { useState } from 'react';
import { Payment } from '@/types/payments';
import { Receipt, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { deletePaymentAction } from '@/app/actions/payments';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PaymentDetailsDrawer } from './PaymentDetailsDrawer';
import { RefundPaymentModal } from './RefundPaymentModal';
import { PaymentTableRow } from './PaymentTableRow';

import { PaymentMobileCard } from './PaymentMobileCard';

interface PaymentsTableProps {
  payments: Payment[];
}

type SortField = 'payment_date' | 'amount' | 'net_amount' | 'provider' | 'status';

export function PaymentsTable({ payments }: PaymentsTableProps) {
  const [sortField, setSortField] = useState<SortField>('payment_date');
  const [sortAsc, setSortAsc] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [refundPayment, setRefundPayment] = useState<Payment | null>(null);
  const [isRefundOpen, setIsRefundOpen] = useState(false);

  const [paymentToDelete, setPaymentToDelete] = useState<{ id: string; displayRef: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedPayments = [...payments].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'payment_date') {
      comparison = new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime();
    } else if (sortField === 'amount') {
      comparison = Number(a.amount) - Number(b.amount);
    } else if (sortField === 'net_amount') {
      comparison = Number(a.net_amount) - Number(b.net_amount);
    } else if (sortField === 'provider') {
      comparison = a.provider.localeCompare(b.provider);
    } else if (sortField === 'status') {
      comparison = a.status.localeCompare(b.status);
    }
    return sortAsc ? comparison : -comparison;
  });

  const handleDelete = (paymentId: string, ref: string | null) => {
    const displayRef = ref || '#' + paymentId.slice(0, 8);
    setPaymentToDelete({ id: paymentId, displayRef });
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;

    setIsDeleting(true);
    try {
      await deletePaymentAction(paymentToDelete.id);
      toast.success('Payment record deleted');
      setPaymentToDelete(null);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'Failed to delete payment');
    } finally {
      setIsDeleting(false);
    }
  };

  if (payments.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-3">
          <Receipt size={24} />
        </div>
        <h3 className="text-base font-bold text-foreground">No payments recorded yet</h3>
        <p className="text-xs text-muted max-w-sm mt-1 mb-4">
          Recorded transactions from Mobile Money, Cash on Delivery, or Card POS will appear in this ledger.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card List View (< 768px) */}
      <div className="block md:hidden divide-y divide-separator">
        {sortedPayments.map((p) => (
          <PaymentMobileCard
            key={p.id}
            payment={p}
            onViewDetails={(payment) => {
              setSelectedPayment(payment);
              setIsDetailsOpen(true);
            }}
            onRefund={(payment) => {
              setRefundPayment(payment);
              setIsRefundOpen(true);
            }}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Desktop / Tablet Table View (>= 768px) */}
      <div className="hidden md:block flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-separator bg-surface-elevated/40 text-muted font-semibold">
              <th className="py-3 px-4">Transaction Ref</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-foreground select-none"
                onClick={() => handleSort('payment_date')}
              >
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  {sortField === 'payment_date' ? (
                    sortAsc ? (
                      <ArrowUp size={12} />
                    ) : (
                      <ArrowDown size={12} />
                    )
                  ) : (
                    <ArrowUpDown size={12} className="opacity-40" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4">Customer / Sender</th>
              <th className="py-3 px-4">Method / Channel</th>
              <th
                className="py-3 px-4 text-right cursor-pointer hover:text-foreground select-none"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Gross</span>
                  {sortField === 'amount' ? (
                    sortAsc ? (
                      <ArrowUp size={12} />
                    ) : (
                      <ArrowDown size={12} />
                    )
                  ) : (
                    <ArrowUpDown size={12} className="opacity-40" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4 text-right">Fee</th>
              <th
                className="py-3 px-4 text-right cursor-pointer hover:text-foreground select-none"
                onClick={() => handleSort('net_amount')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Net Inflow</span>
                  {sortField === 'net_amount' ? (
                    sortAsc ? (
                      <ArrowUp size={12} />
                    ) : (
                      <ArrowDown size={12} />
                    )
                  ) : (
                    <ArrowUpDown size={12} className="opacity-40" />
                  )}
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-foreground select-none"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  {sortField === 'status' ? (
                    sortAsc ? (
                      <ArrowUp size={12} />
                    ) : (
                      <ArrowDown size={12} />
                    )
                  ) : (
                    <ArrowUpDown size={12} className="opacity-40" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {sortedPayments.map((p) => (
              <PaymentTableRow
                key={p.id}
                payment={p}
                onViewDetails={(payment) => {
                  setSelectedPayment(payment);
                  setIsDetailsOpen(true);
                }}
                onRefund={(payment) => {
                  setRefundPayment(payment);
                  setIsRefundOpen(true);
                }}
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Drawer */}
      <PaymentDetailsDrawer
        payment={selectedPayment}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedPayment(null);
        }}
      />

      {/* Refund Modal */}
      <RefundPaymentModal
        payment={refundPayment}
        isOpen={isRefundOpen}
        onClose={() => {
          setIsRefundOpen(false);
          setRefundPayment(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Payment Record"
        description={`Are you sure you want to delete payment record ${paymentToDelete?.displayRef || ''}? This action cannot be undone.`}
        confirmText="Delete Payment"
        isDestructive
        isLoading={isDeleting}
      />
    </>
  );
}
