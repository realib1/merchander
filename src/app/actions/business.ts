'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { z } from 'zod';

const updateBusinessSchema = z.object({
  tenantName: z.string().min(2, 'Business name must be at least 2 characters').max(100),
});

export async function updateBusinessProfile(formData: FormData) {
  const rawData = {
    tenantName: formData.get('tenantName'),
  };

  const validation = updateBusinessSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }
  const { tenantName } = validation.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Get the user's tenant ID
  const { data: tenantUsers, error: tenantUserError } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (tenantUserError || !tenantUsers) {
    console.error('Error fetching tenant:', tenantUserError);
    return { error: 'Tenant not found' };
  }

  const tenantId = tenantUsers.tenant_id;

  // Update Tenant Name
  if (tenantName) {
    const { error: updateError } = await supabase.from('tenants').update({ name: tenantName }).eq('id', tenantId);

    if (updateError) {
      console.error('Error updating tenant:', updateError);
      return { error: 'Failed to update business profile' };
    }
  }

  revalidatePath('/dashboard/settings/business');
  return { success: true };
}
