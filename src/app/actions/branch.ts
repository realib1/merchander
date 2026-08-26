'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function setActiveBranch(storeId: string) {
  const cookieStore = await cookies();
  
  if (storeId) {
    cookieStore.set('merchander_active_store', storeId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  } else {
    cookieStore.delete('merchander_active_store');
  }

  // Force dashboard revalidation so all server components fetch data for the new branch
  revalidatePath('/dashboard', 'layout');
  
  return { success: true };
}
