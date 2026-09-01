'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { PaymentSettings } from '@/types/settings';
import { updatePaymentSettings } from '@/app/actions/settings-commerce';
import { PaymentMethodsCard } from './PaymentMethodsCard';
import { PaymentProvidersCard } from './PaymentProvidersCard';
import { CurrencyCard } from './CurrencyCard';
import { PaymentRecordingCard } from './PaymentRecordingCard';
import { SupplierPaymentsCard } from './SupplierPaymentsCard';
import { Check, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentsSettingsFormProps {
  initialSettings: PaymentSettings;
}

export function PaymentsSettingsForm({ initialSettings }: PaymentsSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState<PaymentSettings>(initialSettings);
  const [isSaved, setIsSaved] = useState(false);

  const updateField = <K extends keyof PaymentSettings>(field: K, val: PaymentSettings[K]) => {
    setSettings((prev) => ({ ...prev, [field]: val }));
    setIsSaved(false);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    startTransition(async () => {
      try {
        const res = await updatePaymentSettings(settings);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success('Payment settings saved successfully');
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 3000);
        }
      } catch (err) {
        console.error('Save error:', err);
        toast.error('Failed to save payment settings');
      }
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 sm:space-y-8">
      {/* 1. Accepted Payment Methods & Recipient Details */}
      <PaymentMethodsCard
        settings={settings}
        onChangeMethod={(key, val) => updateField('methods', { ...settings.methods, [key]: val })}
        onChangeP2PAccounts={(accs) => updateField('p2pAccounts', accs)}
        onChangeCodMax={(val) => updateField('codMaxOrderAmount', val)}
        onChangeInstructions={(val) => updateField('paymentInstructions', val)}
        disabled={isPending}
      />

      {/* 2. Payment Providers (Integrations) */}
      <PaymentProvidersCard
        settings={settings}
        onUpdateProvider={(provider, state) =>
          updateField('providers', {
            ...settings.providers,
            [provider]: state,
          })
        }
        disabled={isPending}
      />

      {/* 3. Operating Currency */}
      <CurrencyCard
        currency={settings.currency || 'GHS'}
        onChangeCurrency={(curr) => updateField('currency', curr)}
        disabled={isPending}
      />

      {/* 4. Payment Recording Policies */}
      <PaymentRecordingCard
        recording={settings.recording}
        onChangeRecording={(key, val) => updateField('recording', { ...settings.recording, [key]: val })}
        disabled={isPending}
      />

      {/* 5. Supplier Payment Preferences */}
      <SupplierPaymentsCard
        supplierPayments={settings.supplierPayments}
        onChangeSupplierPayments={(updater) =>
          updateField('supplierPayments', { ...settings.supplierPayments, ...updater })
        }
        disabled={isPending}
      />

      {/* Bottom Sticky Save Bar */}
      <div className="sticky bottom-2 sm:bottom-4 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-surface/95 backdrop-blur-md border border-separator shadow-lg">
        <div className="flex items-center gap-2">
          {isSaved ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
              <Check size={15} />
              <span>All changes saved</span>
            </span>
          ) : (
            <span className="text-[11px] sm:text-xs text-muted">
              Remember to save your changes before leaving this page.
            </span>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={isPending}
          className="w-full sm:w-auto min-w-35 shadow-xs cursor-pointer justify-center"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={15} className="animate-spin" />
              <span>Saving...</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Save size={15} />
              <span>Save Changes</span>
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
