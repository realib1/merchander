'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(8, 'Phone number is invalid'),
});

export async function updateProfile(formData: FormData) {
  const rawData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    phone: formData.get('phone'),
  };

  const validation = updateProfileSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }
  const { firstName, lastName, phone } = validation.data;
  // Note: we don't update email here as it requires a secure flow, just metadata for now.

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim(),
      phone: phone,
    },
  });

  if (error) {
    console.error('Error updating profile:', error);
    return { error: 'Failed to update profile' };
  }

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/settings/profile');
  return { success: true };
}
