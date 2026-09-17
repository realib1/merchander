import { createBrowserClient } from '@supabase/ssr';
import { getMissingRequiredEnvVars } from '@/config/env';

export function createClient() {
  const missing = getMissingRequiredEnvVars();
  if (missing.includes('NEXT_PUBLIC_SUPABASE_URL') || missing.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    throw new Error(
      'Missing required Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before starting the app.'
    );
  }

  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
