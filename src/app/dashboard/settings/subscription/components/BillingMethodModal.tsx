'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import {
  CreditCard,
  BadgeCheck,
  Loader2,
  Lock,
  Smartphone,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { SubscriptionPaymentMethod } from '@/types/settings';
import {
  initiateBillingMethodSetup,
  verifyBillingMethodStatus,
  updateTenantBillingMethod,
} from '@/app/actions/payments-online';
import { toast } from 'sonner';

interface BillingMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (method: SubscriptionPaymentMethod) => void;
  currentMethod?: SubscriptionPaymentMethod | null;
}

export function BillingMethodModal({ isOpen, onClose, onSuccess, currentMethod }: BillingMethodModalProps) {
  const [methodType, setMethodType] = useState<'card' | 'mtn_momo' | 'telecel_cash'>(currentMethod?.type || 'card');
  const [phone, setPhone] = useState(currentMethod?.type !== 'card' ? currentMethod?.identifier || '' : '');
  const [holderName, setHolderName] = useState(currentMethod?.holderName || '');

  const [isSavingDirect, setIsSavingDirect] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);
  const [activeReference, setActiveReference] = useState<string | null>(null);
  const [waitingForPin, setWaitingForPin] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!waitingForPin) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setWaitingForPin(false);
          toast.error('MoMo prompt timed out. Please try sending the prompt again or save your wallet directly.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [waitingForPin]);

  if (!isOpen) return null;

  const handleDirectMoMoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 9) {
      toast.error('Please enter a valid Ghanaian mobile money phone number');
      return;
    }

    setIsSavingDirect(true);
    toast.loading('Saving Mobile Money billing method...');

    try {
      const res = await updateTenantBillingMethod({
        type: methodType,
        identifier: cleanPhone,
        holderName: holderName.trim() || undefined,
      });

      toast.dismiss();
      setIsSavingDirect(false);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      const newMethod: SubscriptionPaymentMethod = {
        type: methodType,
        identifier: cleanPhone,
        holderName: holderName.trim() || undefined,
        isVerified: true,
        provider: 'hubtel',
        verifiedAt: new Date().toISOString(),
      };

      toast.success(`${methodType === 'mtn_momo' ? 'MTN MoMo' : 'Telecel Cash'} wallet saved!`);
      onSuccess(newMethod);
      onClose();
    } catch (err) {
      console.error('MoMo direct save error:', err);
      toast.dismiss();
      setIsSavingDirect(false);
      toast.error('Failed to save Mobile Money wallet');
    }
  };

  const handleCardGatewayAuthorize = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsInitiating(true);
    toast.loading('Initializing secure Paystack authorization portal...');

    try {
      const res = await initiateBillingMethodSetup({
        methodType: 'card',
        holderName: holderName.trim() || undefined,
        provider: 'paystack',
      });

      toast.dismiss();
      setIsInitiating(false);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      if (res.authorizationUrl) {
        toast.success('Redirecting to Paystack secure card gateway...');
        window.location.href = res.authorizationUrl;
      }
    } catch (err) {
      console.error('Card auth error:', err);
      toast.dismiss();
      setIsInitiating(false);
      toast.error('Failed to initialize card authorization');
    }
  };

  const handleMoMoPrompt = async () => {
    if (!phone.trim()) {
      toast.error('Please enter your Mobile Money phone number');
      return;
    }

    setIsInitiating(true);
    toast.loading('Sending USSD authorization prompt to your phone...');

    try {
      const res = await initiateBillingMethodSetup({
        methodType,
        phone: phone.trim(),
        holderName: holderName.trim() || undefined,
        provider: 'hubtel',
      });

      toast.dismiss();
      setIsInitiating(false);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      if (res.reference) {
        setActiveReference(res.reference);
        setWaitingForPin(true);
        setCountdown(60);
        toast.info('USSD Prompt sent! Please enter your MoMo PIN on your phone.');
      }
    } catch (err) {
      console.error('MoMo prompt error:', err);
      toast.dismiss();
      setIsInitiating(false);
      toast.error('Failed to send MoMo authorization prompt');
    }
  };

  const handleCheckPromptStatus = async () => {
    if (!activeReference) return;
    setIsVerifying(true);

    try {
      const res = await verifyBillingMethodStatus(activeReference, 'hubtel');
      setIsVerifying(false);

      if (res.success && res.method) {
        toast.success('Mobile Money billing mandate verified successfully!');
        onSuccess(res.method);
        onClose();
      } else {
        toast.error('Payment authorization not completed yet. Check your phone PIN prompt.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setIsVerifying(false);
      toast.error('Verification check failed. Please retry.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary shrink-0">
            <CreditCard className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-foreground font-display truncate">
            Connect SaaS Billing Method
          </span>
        </div>
      }
      description="PCI-DSS Tokenized Auto-Debit for monthly plan renewals"
    >
      <div className="space-y-4">
        {/* Method Type Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Billing Provider Channel</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setMethodType('card');
                setWaitingForPin(false);
              }}
              className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                methodType === 'card'
                  ? 'border-brand-primary bg-brand-primary/10 text-foreground font-bold shadow-xs'
                  : 'border-separator bg-surface hover:bg-surface-elevated text-muted'
              }`}
            >
              <div className="flex items-center gap-1 text-xs font-bold">
                <CreditCard size={13} className="text-purple-500 shrink-0" />
                <span>Card</span>
              </div>
              <span className="text-[10px] text-muted">Visa / Mastercard</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMethodType('mtn_momo');
                setWaitingForPin(false);
              }}
              className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                methodType === 'mtn_momo'
                  ? 'border-brand-primary bg-brand-primary/10 text-foreground font-bold shadow-xs'
                  : 'border-separator bg-surface hover:bg-surface-elevated text-muted'
              }`}
            >
              <div className="flex items-center gap-1 text-xs font-bold">
                <Smartphone size={13} className="text-yellow-500 shrink-0" />
                <span className="truncate">MTN MoMo</span>
              </div>
              <span className="text-[10px] text-muted">Auto-Debit</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMethodType('telecel_cash');
                setWaitingForPin(false);
              }}
              className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                methodType === 'telecel_cash'
                  ? 'border-brand-primary bg-brand-primary/10 text-foreground font-bold shadow-xs'
                  : 'border-separator bg-surface hover:bg-surface-elevated text-muted'
              }`}
            >
              <div className="flex items-center gap-1 text-xs font-bold">
                <Smartphone size={13} className="text-red-500 shrink-0" />
                <span className="truncate">Telecel</span>
              </div>
              <span className="text-[10px] text-muted">Auto-Debit</span>
            </button>
          </div>
        </div>

        {/* CARD FLOW (PCI-DSS Paystack Authorization Portal) */}
        {methodType === 'card' && (
          <form onSubmit={handleCardGatewayAuthorize} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-surface-elevated border border-separator space-y-2 text-xs">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>PCI-DSS Level 1 Encrypted Tokenization</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Credit and debit cards (Visa, Mastercard, Verve) are authenticated directly through Paystack&apos;s
                PCI-certified gateway. A reversible GH₵ 1.00 authorization charge verifies your card and establishes an
                encrypted recurring billing token.
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Merchander never handles, collects, or stores raw card numbers or security CVVs.
              </p>
            </div>

            <FormField
              name="holderName"
              label="Cardholder / Business Name (Optional)"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="e.g. Kofi Mensah / Unique Fashion Ltd"
              disabled={isInitiating}
              hint="Name associated with your payment card account."
            />

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-separator">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isInitiating}
                className="w-full sm:w-auto justify-center"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isInitiating}
                className="w-full sm:w-auto justify-center gap-1.5 cursor-pointer"
              >
                {isInitiating ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Connecting Paystack...</span>
                  </>
                ) : (
                  <>
                    <Lock size={13} />
                    <span>Authorize Card with Paystack</span>
                    <ExternalLink size={12} className="opacity-70" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* MOMO FLOW */}
        {methodType !== 'card' && !waitingForPin && (
          <form onSubmit={handleDirectMoMoSave} className="space-y-4">
            <div className="p-3 rounded-xl bg-surface-elevated border border-separator flex items-start gap-2.5 text-xs text-muted">
              <BadgeCheck className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Direct Ghanaian Mobile Money Mandate</p>
                <p className="leading-relaxed text-[11px]">
                  Link your MTN Mobile Money or Telecel Cash wallet. You can push a USSD approval prompt to your phone
                  or save your authorized wallet number directly.
                </p>
              </div>
            </div>

            <FormField
              name="phone"
              label={`${methodType === 'mtn_momo' ? 'MTN' : 'Telecel'} Mobile Number`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 024 412 3456"
              required
              disabled={isSavingDirect || isInitiating}
              hint="10-digit Ghanaian phone number (+233 / 024 / 055 / 020)."
            />

            <FormField
              name="holderName"
              label="Account Holder / Merchant Name (Optional)"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="e.g. Kofi Mensah"
              disabled={isSavingDirect || isInitiating}
            />

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-separator">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSavingDirect || isInitiating}
                className="w-full sm:w-auto justify-center"
              >
                Cancel
              </Button>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMoMoPrompt}
                  disabled={isInitiating || isSavingDirect || !phone.trim()}
                  className="w-full sm:w-auto justify-center gap-1.5 cursor-pointer text-xs"
                >
                  {isInitiating ? <Loader2 size={13} className="animate-spin" /> : <Smartphone size={13} />}
                  <span>Push USSD Prompt</span>
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSavingDirect || isInitiating || !phone.trim()}
                  className="w-full sm:w-auto justify-center gap-1.5 cursor-pointer text-xs"
                >
                  {isSavingDirect ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving Wallet...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Save Wallet Directly</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* MOMO WAITING FOR PIN SCREEN */}
        {methodType !== 'card' && waitingForPin && (
          <div className="space-y-4 py-2 animate-fadeIn">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto animate-pulse">
                <Smartphone size={20} />
              </div>
              <h4 className="text-xs font-bold text-foreground">USSD Prompt Dispatched!</h4>
              <p className="text-[11px] text-muted leading-relaxed">
                Please check your phone (<span className="font-mono font-semibold text-foreground">{phone}</span>) and
                enter your Mobile Money PIN to authorize the mandate.
              </p>
              <div className="pt-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface border border-separator text-muted">
                  Expires in {countdown}s
                </span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-separator">
              <button
                type="button"
                onClick={() => setWaitingForPin(false)}
                className="text-xs text-muted hover:text-foreground cursor-pointer text-center py-1.5 sm:py-0"
              >
                Change Number
              </button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCheckPromptStatus}
                disabled={isVerifying}
                className="w-full sm:w-auto justify-center gap-1.5 cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Verifying Mandate...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={13} />
                    <span>I Have Entered PIN</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
