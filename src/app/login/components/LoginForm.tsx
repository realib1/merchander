'use client';

import { useState, useTransition } from 'react';
import { login } from '@/app/actions/auth';
import { Eye, EyeOff, CircleAlert } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { MfaChallengeForm } from './MfaChallengeForm';

interface LoginFormProps {
  initialMfaRequired?: boolean;
}

export function LoginForm({ initialMfaRequired = false }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [mfaRequired, setMfaRequired] = useState(initialMfaRequired);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const emailOrPhone = (formData.get('email') as string) || '';
    setIdentifier(emailOrPhone);

    startTransition(async () => {
      try {
        const result = await login(undefined, formData);
        if (result?.error) {
          setErrorMessage(result.error);
          toast.error(result.error);
        } else if (result?.mfaRequired) {
          setMfaRequired(true);
        }
      } catch (err) {
        // Allow Next.js internal redirect exceptions to bubble so router handles them
        if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
          throw err;
        }
        console.error('Login submission error:', err);
        const msg = 'Unable to reach the server. Please verify your connection and try again.';
        setErrorMessage(msg);
        toast.error(msg);
      }
    });
  };

  if (mfaRequired) {
    return (
      <MfaChallengeForm
        email={identifier}
        onBack={() => {
          setMfaRequired(false);
          setErrorMessage(null);
        }}
      />
    );
  }

  return (
    <div className="w-full space-y-6">
      {errorMessage && (
        <div className="py-2.5 px-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-sm font-medium text-destructive flex items-start gap-3 animate-in fade-in-50 duration-200">
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground block">
            Email or phone number
          </label>
          <input
            id="email"
            type="text"
            name="email"
            placeholder="you@example.com or 024 123 4567"
            required
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-separator bg-surface text-foreground placeholder:text-muted/60 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-medium transition-all shadow-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground block">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="w-full pl-4 pr-11 py-3 rounded-xl border border-separator bg-surface text-foreground placeholder:text-muted/60 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-medium transition-all shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-foreground transition-colors focus:outline-hidden cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="remember"
              className="w-4 h-4 rounded-sm border-separator text-brand-primary focus:ring-brand-primary/30 accent-brand-primary cursor-pointer"
            />
            <span className="text-sm text-muted hover:text-foreground transition-colors">Remember me</span>
          </label>
          <Link
            href="#"
            className="text-sm font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.99] disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-sm shadow-brand-primary/25 transition-all cursor-pointer mt-3"
        >
          {isPending ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
