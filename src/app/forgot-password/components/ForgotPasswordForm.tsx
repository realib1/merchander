'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Mail, CircleAlert, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { requestPasswordReset } from '@/app/actions/auth';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await requestPasswordReset(undefined, formData);
        if (result?.error) {
          setErrorMessage(result.error);
          toast.error(result.error);
        } else if (result?.success) {
          setIsSubmitted(true);
          toast.success('Reset link sent!');
        }
      } catch (err) {
        console.error('Password reset request error:', err);
        const msg = 'Unable to reach the server. Please verify your connection and try again.';
        setErrorMessage(msg);
        toast.error(msg);
      }
    });
  };

  if (isSubmitted) {
    return (
      <div className="w-full space-y-6 animate-in fade-in-50 duration-200">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
              Check your inbox
            </h2>
            <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-400/90 leading-relaxed">
              If an account exists for <strong className="font-semibold text-foreground">{email}</strong>, we sent a password reset link. Please check your spam folder if it doesn&apos;t arrive in a few minutes.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.99] text-white rounded-xl text-sm font-bold shadow-sm shadow-brand-primary/25 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            Return to Log In
          </Link>
          <button
            type="button"
            onClick={() => {
              setIsSubmitted(false);
              setErrorMessage(null);
            }}
            className="w-full py-2.5 text-xs sm:text-sm font-medium text-muted hover:text-foreground transition-colors cursor-pointer text-center"
          >
            Didn&apos;t receive it? Try another email
          </button>
        </div>
      </div>
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
            Email address
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-separator bg-surface text-foreground placeholder:text-muted/60 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-medium transition-all shadow-xs"
            />
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <Mail size={18} />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || !email.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.99] disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-sm shadow-brand-primary/25 transition-all cursor-pointer mt-2"
        >
          {isPending ? 'Sending link...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Log In
        </Link>
      </div>
    </div>
  );
}
