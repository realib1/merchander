'use client';

import { useState, useActionState, useEffect } from 'react';
import { login } from '@/app/actions/auth';
import { Mail, KeyRound, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(login, undefined);

  // Show toast notification whenever the server action returns an error state
  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  return (
    <div className="space-y-6">
      {/* Social Logins */}
      <div className="space-y-3">
        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 sm:bg-surface border border-separator rounded-xl shadow-sm text-sm font-semibold  hover:bg-surface-elevated transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-separator" />
        </div>
        <div className="relative flex justify-center text-sm font-medium leading-6">
          <span className="bg-surface px-6 text-muted">or sign in with email</span>
        </div>
      </div>

      {state?.error && (
        <div className="py-2 px-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm font-medium text-destructive flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>{state.error}</div>
        </div>
      )}

      <form action={formAction} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-semibold  block">
            Email address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted group-focus-within:text-brand-primary transition-colors">
              <Mail size={18} />
            </div>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="merchant@example.com"
              required
              defaultValue={(state?.email as string) || ''}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-separator bg-surface focus:ring-2 focus:ring-brand-primary transition-all outline-none text-sm font-medium  shadow-sm placeholder:text-muted"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-sm font-semibold  block">
              Password
            </label>
            <a
              href="#"
              className="text-xs font-semibold text-brand-primary hover:text-brand-primary-600 transition-colors"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted transition-colors">
              <KeyRound size={18} />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-separator bg-surface focus:ring-2 focus:ring-brand-primary transition-all outline-none text-sm font-medium  shadow-sm placeholder:text-muted"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-primary transition-colors focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-primary hover:bg-brand-primary-600 disabled:opacity-70 text-white rounded-xl text-sm font-bold shadow-sm shadow-brand-primary/30 transition-all active:scale-[0.98] mt-2 cursor-pointer"
        >
          {isPending ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
