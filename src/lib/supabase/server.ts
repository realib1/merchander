import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getMissingRequiredEnvVars } from '@/config/env';

export async function createClient() {
  const missing = getMissingRequiredEnvVars();
  if (missing.includes('NEXT_PUBLIC_SUPABASE_URL') || missing.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    throw new Error(
      'Missing required Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before starting the app.'
    );
  }

  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
