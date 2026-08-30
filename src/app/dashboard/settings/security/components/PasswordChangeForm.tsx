'use client';

import { useState, useActionState, useEffect, useRef } from 'react';
import { CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KeyRound, Eye, EyeOff, Check, X, ShieldAlert } from 'lucide-react';
import { changePassword } from '@/app/actions/security';
import { toast } from 'sonner';

export function PasswordChangeForm() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [state, action, isPending] = useActionState(async (prevState: unknown, formData: FormData) => {
    const result = await changePassword(formData);
    if (result?.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      formRef.current?.reset();
    }
    return result;
  }, null);

  const lastToastedState = useRef<typeof state>(null);

  useEffect(() => {
    if (state === lastToastedState.current) return;
    lastToastedState.current = state;

    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success('Password updated successfully');
    }
  }, [state]);

  // Password Strength Calculations
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);

  const strengthScore = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (newPassword.length === 0) return { label: 'Empty', color: 'bg-separator', text: 'text-muted' };
    if (strengthScore <= 2) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-500' };
    if (strengthScore <= 4) return { label: 'Medium', color: 'bg-amber-500', text: 'text-amber-500' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
  };

  const strength = getStrengthLabel();
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <form ref={formRef} action={action}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password with a strong, unique key.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        {/* Current Password */}
        <div className="space-y-1.5">
          <label htmlFor="currentPassword" className="text-xs font-semibold text-foreground">
            Current Password <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="currentPassword"
              name="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-separator bg-surface px-3.5 py-2 pr-10 text-sm placeholder:text-muted focus-visible:ring-2 focus-visible:ring-brand-primary/50 outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer p-1"
              aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* New Password & Confirm Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* New Password */}
          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="text-xs font-semibold text-foreground">
              New Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-separator bg-surface px-3.5 py-2 pr-10 text-sm placeholder:text-muted focus-visible:ring-2 focus-visible:ring-brand-primary/50 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer p-1"
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="pt-2 space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">Password Strength</span>
                  <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-full rounded-full transition-all duration-300 ${
                        level <= strengthScore ? strength.color : 'bg-separator/40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
              Confirm New Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-separator bg-surface px-3.5 py-2 pr-10 text-sm placeholder:text-muted focus-visible:ring-2 focus-visible:ring-brand-primary/50 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer p-1"
                aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Match Status */}
            {confirmPassword && (
              <div className="pt-1 flex items-center gap-1.5 text-[11px] animate-fadeIn">
                {passwordsMatch ? (
                  <>
                    <Check size={13} className="text-emerald-500" />
                    <span className="text-emerald-500 font-medium">Passwords match</span>
                  </>
                ) : (
                  <>
                    <X size={13} className="text-red-500" />
                    <span className="text-red-500 font-medium">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Requirements Checklist */}
        <div className="p-3 rounded-xl bg-surface-elevated border border-separator/60 space-y-2">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-brand-primary" />
            Password Requirements:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted">
            <div className="flex items-center gap-1.5">
              <span className={hasMinLength ? 'text-emerald-500 font-bold' : 'text-muted'}>
                {hasMinLength ? '✓' : '•'}
              </span>
              <span>At least 8 characters long</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={hasUppercase ? 'text-emerald-500 font-bold' : 'text-muted'}>
                {hasUppercase ? '✓' : '•'}
              </span>
              <span>Uppercase letter (A-Z)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={hasLowercase ? 'text-emerald-500 font-bold' : 'text-muted'}>
                {hasLowercase ? '✓' : '•'}
              </span>
              <span>Lowercase letter (a-z)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={hasNumber && hasSpecial ? 'text-emerald-500 font-bold' : 'text-muted'}>
                {hasNumber && hasSpecial ? '✓' : '•'}
              </span>
              <span>Number & special symbol</span>
            </div>
          </div>
        </div>
      </CardBody>
      <CardFooter className="justify-end">
        <Button variant="primary" type="submit" disabled={isPending || strengthScore < 3 || !passwordsMatch}>
          {isPending ? 'Updating...' : 'Update Password'}
        </Button>
      </CardFooter>
    </form>
  );
}
