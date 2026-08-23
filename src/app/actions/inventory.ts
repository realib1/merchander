'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { z } from 'zod';

const updateStockSchema = z.object({
  variantId: z.string().uuid("Invalid variant ID"),
  storeId: z.string().uuid("Invalid store ID"),
  quantity: z.number().int().min(0, "Quantity must be at least 0"),
});

export async function updateStock(formData: FormData) {
  const rawData = {
    variantId: formData.get('variantId'),
    storeId: formData.get('storeId'),
    quantity: parseInt(formData.get('quantity') as string, 10),
  };

  const validation = updateStockSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }
  const { variantId, storeId, quantity } = validation.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  // Upsert the new quantity for the specific variant and store
  const { error } = await supabase
    .from('inventory_levels')
    .upsert({
      variant_id: variantId,
      store_id: storeId,
      quantity: quantity,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'variant_id, store_id'
    });

  if (error) {
    console.error('Error updating stock:', error);
    return { error: 'Failed to update stock' };
  }

  revalidatePath('/dashboard/inventory');
  revalidatePath('/dashboard/products');
  return { success: true };
}
