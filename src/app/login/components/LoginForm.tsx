'use client';

import { useState, useTransition } from 'react';
import { login } from '@/app/actions/auth';
import { Mail, KeyRound, Eye, EyeOff, CircleAlert } from 'lucide-react';
import { toast } from 'sonner';

import { MfaChallengeForm } from './MfaChallengeForm';

interface LoginFormProps {
  initialMfaRequired?: boolean;
}

export function LoginForm({ initialMfaRequired = false }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailValue, setEmailValue] = useState('');
  const [mfaRequired, setMfaRequired] = useState(initialMfaRequired);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string) || '';
    setEmailValue(email);

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
        email={emailValue}
        onBack={() => {
          setMfaRequired(false);
          setErrorMessage(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="py-2 px-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm font-medium text-destructive flex items-start gap-3">
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-semibold  block">
            Email address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted transition-colors">
              <Mail size={18} />
            </div>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="merchant@example.com"
              required
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
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
