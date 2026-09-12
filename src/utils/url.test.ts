import { getURL } from './url';

describe('getURL', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Clear all potential URL env vars
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_BRANCH_URL;
    delete process.env.VERCEL_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('falls back to localhost:3000 if no env vars are set', () => {
    expect(getURL()).toBe('http://localhost:3000');
  });

  it('uses NEXT_PUBLIC_SITE_URL if available', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://mysite.com/';
    expect(getURL()).toBe('https://mysite.com'); // Strips trailing slash
  });

  it('uses VERCEL_PROJECT_PRODUCTION_URL and prepends https://', () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'vercel-prod.com';
    expect(getURL()).toBe('https://vercel-prod.com');
  });

  it('prefers NEXT_PUBLIC_SITE_URL over VERCEL_URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://priority.com';
    process.env.VERCEL_URL = 'vercel-fallback.com';
    expect(getURL()).toBe('https://priority.com');
  });

  it('handles existing http protocol correctly', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'http://test.local';
    expect(getURL()).toBe('http://test.local');
  });
});
