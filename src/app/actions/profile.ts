'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { normalizeGhanaPhone } from '@/utils/phone';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
});

export async function updateProfile(formData: FormData) {
  const rawPhone = formData.get('phone')?.toString() || '';
  const normalizedPhone = rawPhone ? normalizeGhanaPhone(rawPhone) || rawPhone : '';

  const rawData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    phone: normalizedPhone || null,
    avatarUrl: formData.get('avatarUrl')?.toString() || null,
  };

  const validation = updateProfileSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }
  const { firstName, lastName, phone, avatarUrl } = validation.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Get storage client (prefer admin client to avoid client/server RLS mismatches)
  let storageClient = supabase;
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      storageClient = createAdminClient();
    }
  } catch {
    storageClient = supabase;
  }

  let cleanAvatarUrl = avatarUrl || '';
  const avatarFile = formData.get('avatarFile');

  // Handle direct File upload from server action
  if (avatarFile && typeof avatarFile === 'object' && 'arrayBuffer' in avatarFile && avatarFile.size > 0) {
    try {
      const file = avatarFile as File;
      const rawExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
      const fileName = `avatars/${user.id}_${Date.now()}.${ext}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data: uploadData, error: uploadError } = await storageClient.storage
        .from('product-images')
        .upload(fileName, buffer, {
          contentType: file.type || 'image/png',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading avatar file to storage:', uploadError);
        return { error: `Failed to upload avatar: ${uploadError.message}` };
      }

      if (uploadData) {
        const { data: publicUrlData } = storageClient.storage.from('product-images').getPublicUrl(fileName);
        cleanAvatarUrl = publicUrlData.publicUrl;
      }
    } catch (err: unknown) {
      console.error('Error processing avatar file:', err);
      const message = err instanceof Error ? err.message : 'Unknown image processing error';
      return { error: `Failed to process image: ${message}` };
    }
  } else if (cleanAvatarUrl.startsWith('data:')) {
    // Handle fallback base64 data URIs safely
    try {
      const commaIdx = cleanAvatarUrl.indexOf(',');
      if (commaIdx !== -1) {
        const metaPart = cleanAvatarUrl.substring(0, commaIdx);
        const base64Data = cleanAvatarUrl.substring(commaIdx + 1);
        const mimeMatch = metaPart.match(/data:([^;]+)/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        const rawExt = mimeType.split('/')[1] || 'png';
        const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `avatars/${user.id}_${Date.now()}.${ext}`;

        const { data: uploadData, error: uploadError } = await storageClient.storage
          .from('product-images')
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadError) {
          console.error('Error uploading avatar to storage:', uploadError);
          return { error: `Failed to upload avatar: ${uploadError.message}` };
        }

        if (uploadData) {
          const { data: publicUrlData } = storageClient.storage.from('product-images').getPublicUrl(fileName);
          cleanAvatarUrl = publicUrlData.publicUrl;
        }
      }
    } catch (err: unknown) {
      console.error('Error saving avatar buffer:', err);
      const message = err instanceof Error ? err.message : 'Unknown image processing error';
      return { error: `Failed to process image: ${message}` };
    }
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim(),
      phone: phone || '',
      avatar_url: cleanAvatarUrl,
    },
  });

  if (error) {
    console.error('Error updating profile:', error);
    return { error: 'Failed to update profile' };
  }

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/settings/profile');
  return { success: true, avatarUrl: cleanAvatarUrl };
}
