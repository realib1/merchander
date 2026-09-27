'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Link2, Settings2 } from 'lucide-react';
import { PaymentSettings, PaymentProviderState } from '@/types/settings';
import { ProviderConnectModal } from './ProviderConnectModal';
import { toast } from 'sonner';

interface PaymentProvidersCardProps {
  settings: PaymentSettings;
  onUpdateProvider: (provider: 'paystack' | 'hubtel', state: PaymentProviderState) => void;
  disabled?: boolean;
}

export function PaymentProvidersCard({ settings, onUpdateProvider, disabled = false }: PaymentProvidersCardProps) {
  const { providers } = settings;
  const [activeModal, setActiveModal] = useState<'paystack' | 'hubtel' | null>(null);

  const handleDisconnect = (provider: 'paystack' | 'hubtel') => {
    onUpdateProvider(provider, { connected: false, publicKey: '', secretKey: '' });
    toast.success(`${provider === 'paystack' ? 'Paystack' : 'Hubtel'} disconnected`);
  };

  return (
    <>
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <Link2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Payment Gateways</CardTitle>
              <CardDescription className="text-xs text-muted">
                Connect external gateways for automated checkout, USSD prompts, and webhook reconciliation.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-3.5">
          {/* 1. Hubtel Gateway */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-separator bg-surface">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-foreground">Hubtel</h4>
                <Badge
                  variant={providers.hubtel?.connected ? 'success' : 'default'}
                  size="sm"
                  dot={providers.hubtel?.connected}
                >
                  {providers.hubtel?.connected ? 'Connected' : 'Not configured'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted">
                Direct Mobile Money USSD push prompts (MTN, Telecel, AT) and automated webhook receipt verification.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {providers.hubtel?.connected ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveModal('hubtel')}
                    disabled={disabled}
                    className="text-xs gap-1"
                  >
                    <Settings2 size={13} />
                    <span>Configure</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect('hubtel')}
                    disabled={disabled}
                    className="text-xs text-destructive hover:bg-destructive/10"
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModal('hubtel')}
                  disabled={disabled}
                  className="text-xs"
                >
                  Connect Hubtel
                </Button>
              )}
            </div>
          </div>

          {/* 2. Paystack Gateway */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-separator bg-surface">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-foreground">Paystack</h4>
                <Badge
                  variant={providers.paystack?.connected ? 'success' : 'default'}
                  size="sm"
                  dot={providers.paystack?.connected}
                >
                  {providers.paystack?.connected
                    ? providers.paystack.isLive
                      ? 'Live'
                      : 'Connected'
                    : 'Not configured'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted">
                Accept Debit/Credit Cards, Apple Pay, and international multi-currency checkouts.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {providers.paystack?.connected ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveModal('paystack')}
                    disabled={disabled}
                    className="text-xs gap-1"
                  >
                    <Settings2 size={13} />
                    <span>Configure</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect('paystack')}
                    disabled={disabled}
                    className="text-xs text-destructive hover:bg-destructive/10"
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModal('paystack')}
                  disabled={disabled}
                  className="text-xs"
                >
                  Connect Paystack
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Provider Connection Modals */}
      {activeModal && (
        <ProviderConnectModal
          providerKey={activeModal}
          currentState={providers[activeModal] || { connected: false }}
          isOpen={Boolean(activeModal)}
          onClose={() => setActiveModal(null)}
          onSave={(state) => {
            onUpdateProvider(activeModal, state);
            setActiveModal(null);
          }}
          disabled={disabled}
        />
      )}
    </>
  );
}
