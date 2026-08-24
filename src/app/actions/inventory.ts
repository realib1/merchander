'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { z } from 'zod';

const updateStockSchema = z.object({
  variantId: z.string().uuid('Invalid variant ID'),
  storeId: z.string().uuid('Invalid store ID').optional().or(z.literal('')),
  quantity: z.number().int().min(0, 'Quantity must be at least 0'),
});

export async function updateStock(formData: FormData) {
  const rawData = {
    variantId: formData.get('variantId'),
    storeId: formData.get('storeId') || '',
    quantity: parseInt(formData.get('quantity') as string, 10),
  };

  const validation = updateStockSchema.safeParse(rawData);
  if (!validation.success) {
    console.error('Validation error:', validation.error.errors);
    return { error: validation.error.errors[0].message };
  }
  const { variantId, quantity } = validation.data;
  let storeId = validation.data.storeId;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  if (!storeId) {
    // If no storeId provided (e.g. initial stock assignment), get the first store for the tenant
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (tenantUser) {
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('tenant_id', tenantUser.tenant_id)
        .limit(1)
        .single();

      if (store) {
        storeId = store.id;
      } else {
        return { error: 'No store available to assign stock' };
      }
    } else {
      return { error: 'Tenant not found' };
    }
  }

  // Upsert the new quantity for the specific variant and store
  const { error } = await supabase.from('inventory_levels').upsert(
    {
      variant_id: variantId,
      store_id: storeId,
      quantity: quantity,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'variant_id, store_id',
    }
  );

  if (error) {
    console.error('Error updating stock:', error);
    return { error: 'Failed to update stock' };
  }

  revalidatePath('/dashboard/inventory');
  revalidatePath('/dashboard/products');
  return { success: true };
}
