'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const rawData = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
    is_active: formData.get('is_active') === 'true',
  };

  const validation = categorySchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) {
    return { error: 'Tenant not found' };
  }

  const { error } = await supabase.from('product_categories').insert({
    tenant_id: tenantUser.tenant_id,
    name: validation.data.name,
    description: validation.data.description,
    is_active: validation.data.is_active,
  });

  if (error) {
    console.error('Error creating category:', error);
    return { error: 'Failed to create category' };
  }

  revalidatePath('/dashboard/categories');
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const rawData = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
    is_active: formData.get('is_active') === 'true',
  };

  const validation = categorySchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const { error } = await supabase
    .from('product_categories')
    .update({
      name: validation.data.name,
      description: validation.data.description,
      is_active: validation.data.is_active,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating category:', error);
    return { error: 'Failed to update category' };
  }

  revalidatePath('/dashboard/categories');
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase.from('product_categories').delete().eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    // If error is about foreign key constraint, it means products are using it
    if (error.code === '23503') {
      return { error: 'Cannot delete category because it is being used by products.' };
    }
    return { error: 'Failed to delete category' };
  }

  revalidatePath('/dashboard/categories');
  return { success: true };
}
