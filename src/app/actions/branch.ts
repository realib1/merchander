'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function setActiveBranch(storeId: string) {
  const cookieStore = await cookies();

  if (storeId && storeId !== 'all') {
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
