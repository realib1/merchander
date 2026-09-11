'use client';

import { useState, useTransition } from 'react';
import { Eye, EyeOff, CircleAlert, Check, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { updateUserPassword } from '@/app/actions/auth';

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isMinLength = password.length >= 8;
  const isMatching = password.length > 0 && password === confirmPassword;
  const canSubmit = isMinLength && isMatching && !isPending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isMinLength) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!isMatching) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await updateUserPassword(undefined, formData);
        if (result?.error) {
          setErrorMessage(result.error);
          toast.error(result.error);
        }
      } catch (err) {
        // Bubble redirect exceptions for Next.js navigation
        if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
          throw err;
        }
        console.error('Password update error:', err);
        const msg = 'Unable to update password. Please verify your connection and try again.';
        setErrorMessage(msg);
        toast.error(msg);
      }
    });
  };

  return (
    <div className="w-full space-y-6">
      {errorMessage && (
        <div className="py-2.5 px-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-sm font-medium text-destructive flex items-start gap-3 animate-in fade-in-50 duration-200">
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground block">
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Create a new password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-11 py-3 rounded-xl border border-separator bg-surface text-foreground placeholder:text-muted/60 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-medium transition-all shadow-xs"
            />
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <Lock size={18} />
            </div>
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

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground block">
            Confirm new password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Re-enter your new password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-11 py-3 rounded-xl border border-separator bg-surface text-foreground placeholder:text-muted/60 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-medium transition-all shadow-xs"
            />
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <Lock size={18} />
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-foreground transition-colors focus:outline-hidden cursor-pointer"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="p-3 bg-surface border border-separator rounded-xl space-y-2 text-xs">
          <div className={`flex items-center gap-2 font-medium transition-colors ${isMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'}`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isMinLength ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-muted/20 text-muted'}`}>
              <Check size={12} />
            </div>
            At least 8 characters
          </div>
          <div className={`flex items-center gap-2 font-medium transition-colors ${isMatching ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'}`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isMatching ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-muted/20 text-muted'}`}>
              <Check size={12} />
            </div>
            Passwords match
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.99] disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-sm shadow-brand-primary/25 transition-all cursor-pointer mt-2"
        >
          {isPending ? 'Updating password...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
