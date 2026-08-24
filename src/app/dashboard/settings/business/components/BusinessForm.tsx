'use client';

import { useActionState, useEffect } from 'react';
import { CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Building2 } from 'lucide-react';
import { updateBusinessProfile } from '@/app/actions/business';
import { toast } from 'sonner';

export function BusinessForm({ initialTenantName }: { initialTenantName: string }) {
  const [state, action, isPending] = useActionState(async (prevState: unknown, formData: FormData) => {
    return await updateBusinessProfile(formData);
  }, null);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success('Business profile updated successfully');
    }
  }, [state]);

  return (
    <form action={action}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>Official business information for invoicing and compliance.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField name="tenantName" label="Legal Business Name" defaultValue={initialTenantName} />
          <FormField name="tradingName" label="Trading Name (DBA)" defaultValue="" hint="Optional" />

          <div className="space-y-1.5">
            <label htmlFor="industry" className="text-sm font-medium">
              Industry / Business Type
            </label>
            <select
              id="industry"
              name="industry"
              className="w-full rounded-md border border-separator bg-surface px-3 py-2 text-sm  focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option>Retail & E-commerce</option>
              <option>Wholesale & Distribution</option>
              <option>Fashion & Apparel</option>
              <option>Electronics</option>
            </select>
          </div>

          <FormField name="taxId" label="Registration Number / Tax ID" defaultValue="TIN-987654321" />
        </div>
      </CardBody>
      <CardFooter className="justify-end border-t border-separator/50 mt-4 pt-6">
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </form>
  );
}
