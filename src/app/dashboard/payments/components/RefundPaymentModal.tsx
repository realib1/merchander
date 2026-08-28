'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { refundPaymentAction } from '@/app/actions/payments';
import { toast } from 'sonner';
import { Payment } from '@/types/payments';
import { formatCurrency } from '@/utils/format';

interface RefundPaymentModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RefundPaymentModal({ payment, isOpen, onClose }: RefundPaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState('');

  if (!payment) return null;

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please provide a reason for the refund');
      return;
    }

    setIsSubmitting(true);
    try {
      await refundPaymentAction({
        payment_id: payment.id,
        refund_reason: reason.trim(),
      });

      toast.success('Payment recorded as refunded');
      onClose();
      setReason('');
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'Failed to refund payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment Refund"
      description={`Record a refund of ${formatCurrency(payment.amount, 'GHS')} for transaction ref ${payment.transaction_ref || '#' + payment.id.slice(0, 8)}.`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="destructive" type="submit" form="refund-payment-form" disabled={isSubmitting}>
            {isSubmitting ? 'Recording Refund...' : 'Confirm Refund'}
          </Button>
        </>
      }
    >
      <form id="refund-payment-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive">
          This will update the transaction status to <strong>Refunded</strong> and reflect in cashflow records.
        </div>

        <FormField
          label="Reason for Refund *"
          isTextarea
          rows={3}
          required
          placeholder="e.g. Customer returned goods due to sizing; cancelled order before dispatch..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </form>
    </Modal>
  );
}
