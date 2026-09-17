import { z } from 'zod';

const REQUIRED_PRODUCTION_ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'PAYSTACK_SECRET_KEY',
  'WHATSAPP_APP_SECRET',
  'WHATSAPP_VERIFY_TOKEN',
  'WHATSAPP_ACCESS_TOKEN',
  'TELEGRAM_SECRET_TOKEN',
  'PYTHON_BRAIN_URL',
  'INTELLIGENCE_SERVICE_API_KEY',
] as const;

const REQUIRED_PRODUCTION_ENV = z.object({
  NODE_ENV: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  PAYSTACK_SECRET_KEY: z.string().min(1).optional(),
  WHATSAPP_APP_SECRET: z.string().min(1).optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().min(1).optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
  TELEGRAM_SECRET_TOKEN: z.string().min(1).optional(),
  PYTHON_BRAIN_URL: z.string().url().optional(),
  INTELLIGENCE_SERVICE_API_KEY: z.string().min(1).optional(),
});

export function getMissingRequiredEnvVars(): string[] {
  if (process.env.NODE_ENV !== 'production') {
    return [];
  }

  return REQUIRED_PRODUCTION_ENV_KEYS.filter((key) => !process.env[key] || !String(process.env[key]).trim());
}

export function assertProductionReady(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const missing = getMissingRequiredEnvVars();
  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(', ')}. Set them before starting the app.`
    );
  }

  const parsed = REQUIRED_PRODUCTION_ENV.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid production environment configuration: ${parsed.error.message}`);
  }
}
