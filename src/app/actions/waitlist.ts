'use server';

import { createClient } from '@/lib/supabase/server';

export async function joinWaitlist(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email || !email.includes('@')) {
    return { error: 'Please provide a valid email address.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.from('waitlist').insert({ email });

  if (error) {
    // Unique violation error code in Postgres is 23505
    if (error.code === '23505') {
      return { error: 'This email is already on the waitlist!' };
    }
    console.error('Waitlist insertion error:', error);
    return { error: 'Something went wrong. Please try again.' };
  }

  return { success: true };
}
