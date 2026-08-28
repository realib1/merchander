'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { reconcileMoMoPaymentAction } from '@/app/actions/payments';
import { extractMomoReference, extractMomoAmount } from '@/utils/momo';
import { toast } from 'sonner';
import { Smartphone, CheckCircle, ArrowRight } from 'lucide-react';
import { PaymentProvider } from '@/types/payments';

interface OrderOption {
  id: string;
  total_amount: number;
  customer_name: string;
  customer_phone: string;
}

interface ReconcileMoMoModalProps {
  orders: OrderOption[];
}

export function ReconcileMoMoModal({ orders }: ReconcileMoMoModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [smsText, setSmsText] = useState('');
  const [orderId, setOrderId] = useState('');
  const [provider, setProvider] = useState<PaymentProvider>('mtn_momo');

  // Derived state during render (no setState in useEffect)
  const extractedRef = smsText.trim().length > 10 ? extractMomoReference(smsText) : null;
  const extractedAmt = smsText.trim().length > 10 ? extractMomoAmount(smsText) : null;

  const handleSmsChange = (newText: string) => {
    setSmsText(newText);
    if (newText.trim().length > 10) {
      const lower = newText.toLowerCase();
      if (lower.includes('telecel') || lower.includes('vodafone')) {
        setProvider('telecel_cash');
      } else if (lower.includes('airteltigo') || lower.includes('at money')) {
        setProvider('at_money');
      } else {
        setProvider('mtn_momo');
      }

      const amt = extractMomoAmount(newText);
      if (amt) {
        const matchingOrder = orders.find((o) => Math.abs(o.total_amount - amt) < 0.01);
        if (matchingOrder) {
          setOrderId(matchingOrder.id);
        }
      }
    }
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!extractedRef) {
      toast.error('Could not extract a valid transaction ID from the SMS text. Please check the text.');
      return;
    }

    const finalAmount = extractedAmt || 0;
    if (finalAmount <= 0) {
      toast.error('Could not detect a valid payment amount from the SMS text.');
      return;
    }

    setIsSubmitting(true);
    try {
      await reconcileMoMoPaymentAction({
        order_id: orderId,
        sms_text: smsText,
        amount_paid: finalAmount,
        provider,
      });

      toast.success(`Payment verified! Ref: ${extractedRef}`);
      setIsOpen(false);
      setSmsText('');
      setOrderId('');
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'Failed to reconcile payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        leftIcon={<Smartphone size={16} />}
        variant="outline"
        className="h-10 px-4 text-sm font-semibold rounded-xl border-separator hover:border-amber-500/50 hover:bg-amber-500/5 hover:text-amber-600 dark:hover:text-amber-400"
      >
        Reconcile MoMo SMS
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Reconcile Mobile Money SMS"
        description="Paste an SMS confirmation from MTN MoMo, Telecel Cash, or AT Money to automatically extract details and match with orders."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="reconcile-momo-form"
              disabled={isSubmitting || !extractedRef || !extractedAmt}
            >
              {isSubmitting ? 'Verifying...' : 'Verify & Mark Paid'}
            </Button>
          </>
        }
      >
        <form id="reconcile-momo-form" onSubmit={handleSubmit} className="space-y-4">
          {/* SMS Paste Area */}
          <FormField
            label="Paste Telecom SMS Text *"
            isTextarea
            rows={4}
            required
            placeholder="Payment received for GHS 150.00 from 0244123456 - Kwesi Mensah. Current Balance: GHS 1,450.00. Ref: 24891028471..."
            value={smsText}
            onChange={(e) => handleSmsChange(e.target.value)}
            hint="Supports MTN MoMo, Telecel Cash, and AT Money receipt formats"
          />

          {/* Extracted Details Pill */}
          {smsText.trim().length > 10 && (
            <div className="p-3.5 rounded-xl border border-separator bg-surface-elevated/70 space-y-2">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                Parsed Information
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted">Extracted Ref:</span>{' '}
                  <span className="font-mono font-bold text-brand-primary">{extractedRef || 'Searching...'}</span>
                </div>
                <div>
                  <span className="text-muted">Detected Amount:</span>{' '}
                  <span className="font-bold text-foreground">
                    {extractedAmt ? `GHS ${extractedAmt.toFixed(2)}` : 'Searching...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Match Order */}
          <div className="space-y-1.5">
            <label htmlFor="reconcile_order_id" className="text-xs font-semibold text-foreground">
              Select Matching Order *
            </label>
            <select
              id="reconcile_order_id"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-separator bg-surface text-foreground focus:ring-2 focus:ring-brand-primary/50 outline-none"
            >
              <option value="">-- Choose Order to Mark Paid --</option>
              {orders.map((ord) => (
                <option key={ord.id} value={ord.id}>
                  Order #{ord.id.slice(0, 8)} • {ord.customer_name} • GHS {ord.total_amount.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-muted flex items-center gap-1">
            <ArrowRight size={12} />
            Reconciling prevents double-processing by saving the unique transaction reference.
          </div>
        </form>
      </Modal>
    </>
  );
}
