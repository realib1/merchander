'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CreditCard, BadgeCheck, Plus, Trash2, ShieldCheck, Loader2 } from 'lucide-react';
import { SubscriptionPaymentMethod } from '@/types/settings';
import { removeTenantBillingMethod } from '@/app/actions/payments-online';
import { BillingMethodModal } from './BillingMethodModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

interface BillingMethodCardProps {
  paymentMethod?: SubscriptionPaymentMethod | null;
  onUpdateMethod?: (method: SubscriptionPaymentMethod | null) => void;
}

export function BillingMethodCard({ paymentMethod: initialMethod, onUpdateMethod }: BillingMethodCardProps) {
  const [localMethod, setLocalMethod] = useState<SubscriptionPaymentMethod | null | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const method = localMethod !== undefined ? localMethod : initialMethod;

  const handleSuccess = (newMethod: SubscriptionPaymentMethod) => {
    setLocalMethod(newMethod);
    if (onUpdateMethod) {
      onUpdateMethod(newMethod);
    }
  };

  const handleRemove = () => {
    setIsConfirmOpen(true);
  };

  const confirmRemove = async () => {
    setIsRemoving(true);
    try {
      const res = await removeTenantBillingMethod();
      setIsRemoving(false);

      if (res.error) {
        toast.error(res.error);
      } else {
        setLocalMethod(null);
        if (onUpdateMethod) onUpdateMethod(null);
        toast.success('Billing method removed successfully');
        setIsConfirmOpen(false);
      }
    } catch (err) {
      console.error('Remove error:', err);
      setIsRemoving(false);
      toast.error('Failed to remove billing method');
    }
  };

  const getMethodBadge = (m: SubscriptionPaymentMethod) => {
    if (m.type === 'mtn_momo') {
      return (
        <div className="w-12 h-8 bg-yellow-400 rounded-lg flex items-center justify-center font-bold text-[11px] text-black border border-black/10 shrink-0 shadow-2xs">
          MTN
        </div>
      );
    }
    if (m.type === 'telecel_cash') {
      return (
        <div className="w-12 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow-2xs">
          Telecel
        </div>
      );
    }
    const isVisa = m.brand?.toLowerCase().includes('visa');
    const isMastercard = m.brand?.toLowerCase().includes('master');

    return (
      <div className="w-12 h-8 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow-2xs tracking-wider">
        {isVisa ? 'VISA' : isMastercard ? 'MC' : 'CARD'}
      </div>
    );
  };

  return (
    <>
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary shrink-0">
                <CreditCard className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-base font-bold font-display">Default Billing Method</CardTitle>
                <CardDescription className="text-xs text-muted">
                  Primary tokenized method used for SaaS subscription auto-renewals.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardBody className="pt-0">
          {method ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 border border-separator rounded-xl bg-surface-elevated/40 gap-3.5">
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                {getMethodBadge(method)}
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <p className="text-xs font-bold text-foreground">
                      {method.type === 'mtn_momo'
                        ? 'MTN Mobile Money Wallet'
                        : method.type === 'telecel_cash'
                          ? 'Telecel Cash Wallet'
                          : `${(method.brand || 'Credit / Debit').toUpperCase()} Card`}
                    </p>
                    {method.isVerified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        <BadgeCheck size={11} />
                        <span>Tokenized Mandate</span>
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-muted font-mono break-all sm:break-normal">
                    {method.identifier}{' '}
                    {method.expMonth && method.expYear ? `• Exp ${method.expMonth}/${method.expYear}` : ''}{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-sans font-medium block sm:inline">
                      (Auto-debit active)
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-0 border-separator/40 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  disabled={isRemoving}
                  className="cursor-pointer text-xs flex-1 sm:flex-none justify-center"
                >
                  Update
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isRemoving}
                  className="cursor-pointer text-xs text-destructive hover:bg-destructive/10 shrink-0"
                  aria-label="Remove billing method"
                >
                  {isRemoving ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 border border-dashed border-separator rounded-xl bg-surface-elevated/20 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-muted shrink-0" />
                  <p className="text-xs font-semibold text-foreground">No automatic billing method attached</p>
                </div>
                <p className="text-[11px] text-muted">
                  Connect a tokenized Card or Mobile Money wallet to enable automatic monthly plan renewals.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="cursor-pointer w-full sm:w-auto justify-center shrink-0 text-xs gap-1.5"
              >
                <Plus size={13} />
                <span>Add Billing Method</span>
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      <BillingMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        currentMethod={method}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmRemove}
        title="Remove Billing Method"
        description="Are you sure you want to remove your saved SaaS billing method?"
        confirmText="Remove Method"
        isDestructive
        isLoading={isRemoving}
      />
    </>
  );
}
