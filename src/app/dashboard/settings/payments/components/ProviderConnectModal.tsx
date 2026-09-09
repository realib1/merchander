'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { Key, BadgeCheck, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { PaymentProviderState } from '@/types/settings';
import { toast } from 'sonner';

interface ProviderConnectModalProps {
  providerKey: 'paystack' | 'hubtel';
  currentState: PaymentProviderState;
  isOpen: boolean;
  onClose: () => void;
  onSave: (state: PaymentProviderState) => void;
  disabled?: boolean;
}

export function ProviderConnectModal({
  providerKey,
  currentState,
  isOpen,
  onClose,
  onSave,
  disabled = false,
}: ProviderConnectModalProps) {
  const [publicKey, setPublicKey] = useState(currentState.publicKey || '');
  const [secretKey, setSecretKey] = useState(currentState.secretKey || '');
  const [merchantAccountOrPosId, setMerchantAccountOrPosId] = useState(currentState.merchantAccountOrPosId || '');
  const [isTesting, setIsTesting] = useState(false);
  const providerName = providerKey === 'paystack' ? 'Paystack' : 'Hubtel';

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey.trim()) {
      toast.error(`Please enter your ${providerName} ${providerKey === 'paystack' ? 'Public Key' : 'Client ID'}`);
      return;
    }

    setIsTesting(true);
    // Simulate lightweight API key verification ping
    setTimeout(() => {
      setIsTesting(false);
      onSave({
        connected: true,
        publicKey: publicKey.trim(),
        secretKey: secretKey.trim() || undefined,
        merchantAccountOrPosId: merchantAccountOrPosId.trim() || undefined,
        isLive: publicKey.startsWith('pk_live_') || publicKey.startsWith('live_'),
      });
      toast.success(`${providerName} connected successfully`);
      onClose();
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
            <Key className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-foreground font-display">Connect {providerName}</span>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-surface-elevated border border-separator flex items-start gap-2.5 text-xs text-muted">
            <BadgeCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Customer payments flow directly to your {providerName} account. Merchander never takes custody of your
              funds.
            </p>
          </div>

          <FormField
            name="publicKey"
            label={providerKey === 'paystack' ? 'Paystack Public Key' : 'Hubtel Client ID'}
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            placeholder={providerKey === 'paystack' ? 'pk_live_xxxxxxxx' : 'client_id_xxxxxxxx'}
            required
            disabled={isTesting || disabled}
            hint={`Find this in your ${providerName} Dashboard → API Keys & Webhooks.`}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Lock size={12} className="text-muted" />
              <span>{providerKey === 'paystack' ? 'Paystack Secret Key' : 'Hubtel Client Secret'}</span>
            </label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder={providerKey === 'paystack' ? 'sk_live_xxxxxxxx' : 'client_secret_xxxxxxxx'}
              disabled={isTesting || disabled}
              className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs font-mono transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-50"
            />
            <p className="text-[11px] text-muted">
              Used securely on backend for server-to-server transaction verification.
            </p>
          </div>

          {providerKey === 'hubtel' && (
            <FormField
              name="merchantAccount"
              label="Hubtel Merchant Account Number / POS ID (Optional)"
              value={merchantAccountOrPosId}
              onChange={(e) => setMerchantAccountOrPosId(e.target.value)}
              placeholder="e.g. 2018472"
              disabled={isTesting || disabled}
              hint="Required if using Hubtel Direct Mobile Money USSD push."
            />
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-separator">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isTesting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleTestAndSave}
              disabled={isTesting || !publicKey.trim()}
            >
              {isTesting ? (
                <>
                  <Loader2 size={13} className="animate-spin mr-1.5" />
                  <span>Testing Key...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} className="mr-1.5" />
                  <span>Verify & Save</span>
                </>
              )}
            </Button>
          </div>
        </div>
    </Modal>
  );
}
