import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';

describe('GET /api/health', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.keys(process.env).forEach((key) => delete process.env[key]);
    Object.assign(process.env, originalEnv);
  });

  it('returns status 200 with health metadata when the multi-channel dependencies are configured', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'example-anon-key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'example-service-role');
    vi.stubEnv('PAYSTACK_SECRET_KEY', 'example-paystack-key');
    vi.stubEnv('WHATSAPP_APP_SECRET', 'example-whatsapp-secret');
    vi.stubEnv('WHATSAPP_VERIFY_TOKEN', 'example-whatsapp-verify');
    vi.stubEnv('WHATSAPP_ACCESS_TOKEN', 'example-whatsapp-token');
    vi.stubEnv('TELEGRAM_SECRET_TOKEN', 'example-telegram-secret');
    vi.stubEnv('PYTHON_BRAIN_URL', 'https://example-brain.local');
    vi.stubEnv('INTELLIGENCE_SERVICE_API_KEY', 'example-intelligence-key');

    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('env');
    expect(body).toHaveProperty('uptime');
    expect(body.dependencies).toHaveProperty('telegram', true);

    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThanOrEqual(0);

    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);

    const cacheControl = response.headers.get('Cache-Control');
    expect(cacheControl).toContain('no-store');
    expect(cacheControl).toContain('no-cache');
  });
});
