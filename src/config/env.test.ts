import { describe, expect, it, afterEach, vi } from 'vitest';
import { assertProductionReady, getMissingRequiredEnvVars } from './env';

describe('env configuration hardening', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.keys(process.env).forEach((key) => delete process.env[key]);
    Object.assign(process.env, originalEnv);
  });

  it('identifies required environment variables missing in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    vi.stubEnv('PAYSTACK_SECRET_KEY', '');
    vi.stubEnv('WHATSAPP_APP_SECRET', '');
    vi.stubEnv('WHATSAPP_VERIFY_TOKEN', '');
    vi.stubEnv('WHATSAPP_ACCESS_TOKEN', '');
    vi.stubEnv('TELEGRAM_SECRET_TOKEN', '');
    vi.stubEnv('PYTHON_BRAIN_URL', '');
    vi.stubEnv('INTELLIGENCE_SERVICE_API_KEY', '');

    expect(getMissingRequiredEnvVars()).toEqual(
      expect.arrayContaining([
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
      ])
    );
  });

  it('throws when production config is incomplete', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    vi.stubEnv('PAYSTACK_SECRET_KEY', '');
    vi.stubEnv('WHATSAPP_APP_SECRET', '');
    vi.stubEnv('WHATSAPP_VERIFY_TOKEN', '');
    vi.stubEnv('WHATSAPP_ACCESS_TOKEN', '');
    vi.stubEnv('TELEGRAM_SECRET_TOKEN', '');
    vi.stubEnv('PYTHON_BRAIN_URL', '');
    vi.stubEnv('INTELLIGENCE_SERVICE_API_KEY', '');

    expect(() => assertProductionReady()).toThrow('Missing required production environment variables');
  });

  it('does not require production variables in local development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');

    expect(() => assertProductionReady()).not.toThrow();
  });
});
