'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { recordPayment } from '@/app/actions/payments';
import { toast } from 'sonner';
import { PaymentProvider } from '@/types/payments';
import { PAYMENT_PROVIDERS } from '../constants';
import { Plus } from 'lucide-react';

interface OrderOption {
  id: string;
  total_amount: number;
  customer_name: string;
  customer_phone: string;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
}

interface RecordPaymentModalProps {
  orders: OrderOption[];
  customers: CustomerOption[];
}

export function RecordPaymentModal({ orders, customers }: RecordPaymentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [orderId, setOrderId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [provider, setProvider] = useState<PaymentProvider>('mtn_momo');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderName, setSenderName] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // When order is selected, auto-fill amount and customer
  const handleOrderChange = (selectedId: string) => {
    setOrderId(selectedId);
    if (selectedId) {
      const found = orders.find((o) => o.id === selectedId);
      if (found) {
        setAmount(found.total_amount.toString());
        setSenderName(found.customer_name);
        setSenderPhone(found.customer_phone);
      }
    }
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordPayment({
        order_id: orderId || null,
        customer_id: customerId || null,
        provider,
        amount: parsedAmount,
        fee: fee ? parseFloat(fee) : 0,
        transaction_ref: transactionRef || null,
        sender_phone: senderPhone || null,
        sender_name: senderName || null,
        notes: notes || null,
        payment_date: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
        status: 'completed',
      });

      toast.success('Payment recorded successfully!');
      setIsOpen(false);
      // Reset
      setOrderId('');
      setCustomerId('');
      setAmount('');
      setFee('');
      setTransactionRef('');
      setSenderPhone('');
      setSenderName('');
      setNotes('');
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        leftIcon={<Plus size={16} />}
        className="h-10 px-4 text-sm font-semibold rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90"
      >
        Record Payment
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Record Customer Payment"
        description="Enter a received payment via Mobile Money, Cash, Card POS, or Bank Transfer."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="record-payment-form" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </>
        }
      >
        <form id="record-payment-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Linked Order */}
          <div className="space-y-1.5">
            <label htmlFor="order_id" className="text-xs font-semibold text-foreground">
              Link to Unpaid Order (Optional)
            </label>
            <select
              id="order_id"
              value={orderId}
              onChange={(e) => handleOrderChange(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-separator bg-surface text-foreground focus:ring-2 focus:ring-brand-primary/50 outline-none"
            >
              <option value="">-- Standalone Customer Payment / Credit Settlement --</option>
              {orders.map((ord) => (
                <option key={ord.id} value={ord.id}>
                  Order #{ord.id.slice(0, 8)} • {ord.customer_name} (GHS {ord.total_amount.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Customer Selection (when no order selected) */}
          {!orderId && (
            <div className="space-y-1.5">
              <label htmlFor="customer_id" className="text-xs font-semibold text-foreground">
                Customer Account (Optional)
              </label>
              <select
                id="customer_id"
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  const cust = customers.find((c) => c.id === e.target.value);
                  if (cust) {
                    setSenderName(cust.name);
                    setSenderPhone(cust.phone);
                  }
                }}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-separator bg-surface text-foreground focus:ring-2 focus:ring-brand-primary/50 outline-none"
              >
                <option value="">-- Walk-in / Direct Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Method / Provider */}
          <div className="space-y-1.5">
            <label htmlFor="provider" className="text-xs font-semibold text-foreground">
              Payment Method / Provider *
            </label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as PaymentProvider)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-separator bg-surface text-foreground focus:ring-2 focus:ring-brand-primary/50 outline-none"
            >
              {Object.values(PAYMENT_PROVIDERS).map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Amount Received (GHS) *"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <FormField
              label="Gateway / Telco Fee (GHS)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              hint="Fee deducted by MoMo / POS / Bank"
            />
          </div>

          {/* Transaction Ref & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Transaction Ref / ID"
              placeholder="e.g. 24891028471"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
            />

            <FormField
              label="Payment Date *"
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          {/* Sender Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Sender Phone Number"
              placeholder="024XXXXXXX or +233..."
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
            />

            <FormField
              label="Sender Name"
              placeholder="e.g. Kwesi Mensah"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
          </div>

          {/* Notes */}
          <FormField
            label="Internal Notes (Optional)"
            isTextarea
            rows={2}
            placeholder="Payment confirmation notes or courier reference..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </form>
      </Modal>
    </>
  );
}
