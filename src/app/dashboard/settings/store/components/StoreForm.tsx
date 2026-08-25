'use client';

import { useActionState, useEffect, useRef } from 'react';
import { CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Store } from 'lucide-react';
import { updateStoreSettings } from '@/app/actions/settings';
import { toast } from 'sonner';

export function StoreForm({ initialEmail, initialCurrency }: { initialEmail: string | null; initialCurrency: string }) {
  const [state, action, isPending] = useActionState(async (prevState: unknown, formData: FormData) => {
    return await updateStoreSettings(formData);
  }, null);

  const lastToastedState = useRef<typeof state>(null);

  useEffect(() => {
    if (state === lastToastedState.current) return;
    lastToastedState.current = state;

    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success('Store settings updated successfully');
    }
  }, [state]);

  return (
    <form action={action}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
            <Store className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle>Storefront Identity</CardTitle>
            <CardDescription>Basic details about your public store.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-elevated border border-separator flex items-center justify-center">
            <Store className="h-6 w-6 text-muted" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary">Store Logo</p>
            <p className="text-xs text-secondary">Recommended size: 512x512px. Max 2MB.</p>
            <div className="flex items-center gap-3 mt-2">
              <Button variant="outline" size="sm" type="button" disabled>
                Upload Logo
                <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-surface-elevated text-muted">Soon</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <FormField
            label="Store Contact Email"
            name="storeEmail"
            type="email"
            defaultValue={initialEmail || ''}
            hint="This is the email address customers will contact you at."
          />
        </div>

        <div className="w-full h-px bg-separator/50 my-6" />

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-primary mb-1">Localization & Formatting</p>
            <p className="text-xs text-secondary mb-4">Default settings for products and checkout.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="storeCurrency" className="text-xs font-semibold text-primary">
                Default Currency
              </label>
              <select
                id="storeCurrency"
                name="storeCurrency"
                defaultValue={initialCurrency || 'GHS'}
                className="w-full rounded-md border border-separator bg-surface px-3.5 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="GHS">GHS (Ghana Cedi)</option>
                <option value="NGN">NGN (Nigerian Naira)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="KES">KES (Kenyan Shilling)</option>
              </select>
            </div>
          </div>
        </div>
      </CardBody>
      <CardFooter className="justify-end">
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Store Settings'}
        </Button>
      </CardFooter>
    </form>
  );
}
