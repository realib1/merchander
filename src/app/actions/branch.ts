'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, getTenantInfo } from '@/lib/supabase/queries';

interface SetActiveBranchResult {
  success: boolean;
  error?: string;
}

export async function setActiveBranch(storeId: string): Promise<SetActiveBranchResult> {
  const cookieStore = await cookies();

  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return { success: false, error: 'Not signed in' };
  }

  if (storeId && storeId !== 'all') {
    // Persist only an id that is a real store in the caller's tenant. The value
    // is otherwise untrusted input that ends up in query builders downstream.
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!store) {
      return { success: false, error: 'Unknown branch' };
    }

    cookieStore.set('merchander_active_store', storeId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  } else {
    cookieStore.set('merchander_active_store', 'all', {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  // Force dashboard revalidation so all server components fetch data for the new branch
  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard', 'page');
  revalidatePath('/dashboard/orders', 'page');
  revalidatePath('/dashboard/inventory', 'page');
  revalidatePath('/dashboard/products', 'page');

  return { success: true };
}

export async function getActiveBranchId(): Promise<string | null> {
  const cookieStore = await cookies();
  const val = cookieStore.get('merchander_active_store')?.value;
  return val || null;
}
