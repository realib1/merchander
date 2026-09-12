
import { requestPasswordReset, updateUserPassword } from './auth';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(
    new Map([
      ['host', 'app.merchander.store'],
      ['x-forwarded-proto', 'https'],
    ])
  ),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    const err = new Error(`NEXT_REDIRECT: ${url}`);
    // @ts-expect-error - next redirect simulation
    err.digest = `NEXT_REDIRECT;${url}`;
    throw err;
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

describe('Password Recovery Actions', () => {
  let mockSupabase: {
    auth: {
      resetPasswordForEmail: ReturnType<typeof vi.fn>;
      getUser: ReturnType<typeof vi.fn>;
      updateUser: ReturnType<typeof vi.fn>;
      signOut: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      auth: {
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123', email: 'test@example.com' } }, error: null }),
        updateUser: vi.fn().mockResolvedValue({ error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });

  describe('requestPasswordReset', () => {
    it('validates email format and rejects invalid inputs', async () => {
      const formData = new FormData();
      formData.set('email', 'not-an-email');

      const res = await requestPasswordReset(undefined, formData);
      expect(res).toEqual({ error: 'Please enter a valid email address.' });
      expect(mockSupabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
    });

    it('successfully calls resetPasswordForEmail with correct callback URL', async () => {
      const formData = new FormData();
      formData.set('email', 'merchant@example.com');

      const res = await requestPasswordReset(undefined, formData);
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'merchant@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/callback?next=/reset-password'),
        })
      );
      expect(res.success).toBe(true);
      expect(res.message).toBe('If an account exists with this email, a password reset link has been sent.');
    });

    it('returns rate limit error when supabase reports 429', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: { status: 429, message: 'Too many requests' },
      });

      const formData = new FormData();
      formData.set('email', 'merchant@example.com');

      const res = await requestPasswordReset(undefined, formData);
      expect(res).toEqual({
        error: 'Too many requests. Please wait a few minutes before trying again.',
      });
    });

    it('preserves generic success message on standard errors for anti-enumeration', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: { status: 400, message: 'User not found' },
      });

      const formData = new FormData();
      formData.set('email', 'unknown@example.com');

      const res = await requestPasswordReset(undefined, formData);
      expect(res.success).toBe(true);
    });
  });

  describe('updateUserPassword', () => {
    it('rejects passwords shorter than 8 characters', async () => {
      const formData = new FormData();
      formData.set('password', 'short');
      formData.set('confirmPassword', 'short');

      const res = await updateUserPassword(undefined, formData);
      expect(res).toEqual({ error: 'Password must be at least 8 characters long.' });
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('rejects when confirmPassword does not match password', async () => {
      const formData = new FormData();
      formData.set('password', 'ValidPass123!');
      formData.set('confirmPassword', 'DifferentPass456!');

      const res = await updateUserPassword(undefined, formData);
      expect(res).toEqual({ error: 'Passwords do not match.' });
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('rejects when there is no active session or user is null', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth session missing' },
      });

      const formData = new FormData();
      formData.set('password', 'ValidPass123!');
      formData.set('confirmPassword', 'ValidPass123!');

      const res = await updateUserPassword(undefined, formData);
      expect(res).toEqual({
        error: 'Your password reset session has expired or is invalid. Please request a new link.',
      });
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('updates password, signs out recovery session, and redirects to login with reset=success', async () => {
      const formData = new FormData();
      formData.set('password', 'NewValidPass123!');
      formData.set('confirmPassword', 'NewValidPass123!');

      await expect(updateUserPassword(undefined, formData)).rejects.toThrow('NEXT_REDIRECT: /login?reset=success');

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ password: 'NewValidPass123!' });
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith('/login?reset=success');
    });
  });
});
