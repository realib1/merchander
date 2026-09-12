
import { NextRequest } from 'next/server';
import { POST, GET } from './route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

describe('src/app/auth/signout/route.ts', () => {
  let mockSignOut: ReturnType<typeof vi.fn>;
  let mockGetUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSignOut = vi.fn().mockResolvedValue({ error: null });
    mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    });

    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: mockGetUser,
        signOut: mockSignOut,
      },
    });
  });

  it('POST: signs out authenticated user, deletes cookies, and redirects to /login', async () => {
    const req = new NextRequest('http://localhost:3000/auth/signout', {
      method: 'POST',
      headers: {
        cookie: 'sb-access-token=xyz123; sb-refresh-token=abc456; other_cookie=val',
      },
    });

    const res = await POST(req);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login');

    // Verify Set-Cookie headers clear the supabase cookies
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('sb-access-token=;');
    expect(setCookie).toContain('sb-refresh-token=;');
    expect(setCookie).toContain('Max-Age=0');
  });

  it('POST: still redirects to /login when user is unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest('http://localhost:3000/auth/signout', {
      method: 'POST',
    });

    const res = await POST(req);

    expect(mockSignOut).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it('GET: signs out authenticated user, deletes cookies, and redirects to /login', async () => {
    const req = new NextRequest('http://localhost:3000/auth/signout', {
      method: 'GET',
      headers: {
        cookie: 'sb-123-auth-token=token_val;',
      },
    });

    const res = await GET(req);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login');

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('sb-123-auth-token=;');
    expect(setCookie).toContain('Max-Age=0');
  });

  it('gracefully redirects to /login even if supabase signOut throws', async () => {
    mockSignOut.mockRejectedValue(new Error('Network failure'));

    const req = new NextRequest('http://localhost:3000/auth/signout', {
      method: 'POST',
      headers: {
        cookie: 'sb-auth-token=token;',
      },
    });

    const res = await POST(req);

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login');
  });
});
