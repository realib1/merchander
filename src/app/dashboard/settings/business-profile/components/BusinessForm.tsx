'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { ColorPickerField } from '@/components/ui/ColorPickerField';
import { Button } from '@/components/ui/Button';
import { Building2, Palette, MapPin } from 'lucide-react';
import { updateBusinessProfile } from '@/app/actions/settings';
import { toast } from 'sonner';

interface BusinessFormProps {
  initialTenantName: string;
  initialTradingName: string | null;
  initialIndustry: string | null;
  initialTaxId: string | null;
  initialStoreEmail: string | null;
  initialStoreCurrency: string;
  initialBrandColor: string | null;
  initialBrandSecondaryColor: string | null;
  initialStreet: string | null;
  initialCity: string | null;
  initialState: string | null;
  initialZip: string | null;
  initialCountry: string | null;
}

export function BusinessForm({
  initialTenantName,
  initialTradingName,
  initialIndustry,
  initialTaxId,
  initialStoreEmail,
  initialStoreCurrency,
  initialBrandColor,
  initialBrandSecondaryColor,
  initialStreet,
  initialCity,
  initialState,
  initialZip,
  initialCountry,
}: BusinessFormProps) {
  const [state, action, isPending] = useActionState(async (prevState: unknown, formData: FormData) => {
    return await updateBusinessProfile(formData);
  }, null);

  const lastToastedState = useRef<typeof state>(null);
  const [brandColor, setBrandColor] = useState(initialBrandColor || '#091540');
  const [brandSecondaryColor, setBrandSecondaryColor] = useState(initialBrandSecondaryColor || '#ff6a00');

  useEffect(() => {
    if (state === lastToastedState.current) return;
    lastToastedState.current = state;

    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success('Business profile updated successfully');
    }
  }, [state]);

  return (
    <form action={action} className="space-y-8">
      {/* Company Details & Brand Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>
                Official business information for invoicing, store contact, and compliance.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField name="tenantName" label="Legal Business Name" defaultValue={initialTenantName} required />
            <FormField
              name="tradingName"
              label="Trading Name (DBA)"
              defaultValue={initialTradingName || ''}
              hint="Public trading name used across storefront and receipts"
            />

            <div className="space-y-1.5">
              <label htmlFor="industry" className="text-xs font-semibold text-primary">
                Industry / Business Type
              </label>
              <select
                id="industry"
                name="industry"
                defaultValue={initialIndustry || 'Retail & E-commerce'}
                className="w-full rounded-md border border-separator bg-surface px-3.5 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="Retail & E-commerce">Retail & E-commerce</option>
                <option value="Wholesale & Distribution">Wholesale & Distribution</option>
                <option value="Fashion & Apparel">Fashion & Apparel</option>
                <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                <option value="Health & Beauty">Health & Beauty</option>
                <option value="Food & Groceries">Food & Groceries</option>
                <option value="Home & Living">Home & Living</option>
              </select>
            </div>

            <FormField
              name="taxId"
              label="Registration Number / Tax ID"
              defaultValue={initialTaxId || ''}
              hint="Optional tax/TIN identifier"
            />

            <FormField
              name="storeEmail"
              type="email"
              label="Store Contact Email"
              defaultValue={initialStoreEmail || ''}
              hint="Public customer support email"
            />

            <div className="space-y-1.5">
              <label htmlFor="storeCurrency" className="text-xs font-semibold text-primary">
                Default Operating Currency
              </label>
              <select
                id="storeCurrency"
                name="storeCurrency"
                defaultValue={initialStoreCurrency || 'GHS'}
                className="w-full rounded-md border border-separator bg-surface px-3.5 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="GHS">GHS (₵) - Ghanaian Cedi</option>
                <option value="NGN">NGN (₦) - Nigerian Naira</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="KES">KES (KSh) - Kenyan Shilling</option>
              </select>
            </div>
          </div>

          <div className="w-full h-px bg-separator/50 my-6" />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-brand-primary" aria-hidden="true" />
              <p className="text-sm font-semibold text-primary">Brand Identity</p>
            </div>
            <p className="text-xs text-secondary">
              Customize your storefront and invoice appearance to match your brand.
            </p>
            <div className="space-y-6">
              <ColorPickerField
                name="brandColor"
                label="Primary Brand Color (Hex)"
                value={brandColor}
                onChange={setBrandColor}
                hint="e.g. #091540"
              />

              <ColorPickerField
                name="brandSecondaryColor"
                label="Secondary Brand Color (Hex)"
                value={brandSecondaryColor}
                onChange={setBrandSecondaryColor}
                hint="e.g. #ff6a00"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Business Address Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Business Address</CardTitle>
              <CardDescription>Your primary operating location.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <FormField name="businessStreet" label="Street Address" defaultValue={initialStreet || ''} />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <FormField name="businessCity" label="City" defaultValue={initialCity || ''} />
            <FormField name="businessState" label="State / Region" defaultValue={initialState || ''} />
            <FormField name="businessZip" label="ZIP / Postal Code" defaultValue={initialZip || ''} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="businessCountry" className="text-xs font-semibold text-primary">
              Country
            </label>
            <select
              id="businessCountry"
              name="businessCountry"
              defaultValue={initialCountry || 'Ghana'}
              className="w-full rounded-md border border-separator bg-surface px-3.5 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="Ghana">Ghana</option>
              <option value="Nigeria">Nigeria</option>
              <option value="Kenya">Kenya</option>
              <option value="South Africa">South Africa</option>
            </select>
          </div>
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="primary" type="submit" disabled={isPending}>
            {isPending ? 'Saving All Changes...' : 'Save All Changes'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
