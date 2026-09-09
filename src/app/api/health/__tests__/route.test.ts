import { describe, it, expect } from 'vitest';
import { GET } from '../route';

describe('GET /api/health', () => {
  it('returns status 200 with health metadata', async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('env');
    expect(body).toHaveProperty('uptime');

    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThanOrEqual(0);

    // Validate timestamp is a valid ISO string
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);

    // Verify cache control header prevents stale caching
    const cacheControl = response.headers.get('Cache-Control');
    expect(cacheControl).toContain('no-store');
    expect(cacheControl).toContain('no-cache');
  });
});
