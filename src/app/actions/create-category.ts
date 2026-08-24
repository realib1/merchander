'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

export async function createCategoryAction(formData: FormData) {
  const name = formData.get('name');

  const validation = createCategorySchema.safeParse({ name });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { data: tenantUsers, error: tenantUserError } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (tenantUserError || !tenantUsers) {
    return { error: 'Tenant not found' };
  }

  const { data: category, error } = await supabase
    .from('product_categories')
    .insert({
      name: validation.data.name,
      tenant_id: tenantUsers.tenant_id,
    })
    .select('id, name')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: 'Category with this name already exists' };
    }
    console.error('Error creating category:', error);
    return { error: 'Failed to create category' };
  }

  revalidatePath('/dashboard/products/new');
  return { category };
}
