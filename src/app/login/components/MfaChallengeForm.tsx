'use client';

import { useState, useTransition } from 'react';
import { verifyLoginMfa, verifyLoginBackupCode } from '@/app/actions/auth';
import { ShieldCheck, KeyRound, ArrowLeft, CircleAlert } from 'lucide-react';
import { toast } from 'sonner';

interface MfaChallengeFormProps {
  email: string;
  onBack: () => void;
}

export function MfaChallengeForm({ email, onBack }: MfaChallengeFormProps) {
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleVerifyTotp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (totpCode.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await verifyLoginMfa(totpCode.trim());
        if (result?.error) {
          setErrorMessage(result.error);
          toast.error(result.error);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
          throw err;
        }
        console.error('MFA challenge error:', err);
        setErrorMessage('Verification failed. Please try again.');
      }
    });
  };

  const handleVerifyBackup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!backupCode.trim()) {
      setErrorMessage('Please enter an emergency recovery code.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await verifyLoginBackupCode(backupCode.trim());
        if (result?.error) {
          setErrorMessage(result.error);
          toast.error(result.error);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
          throw err;
        }
        console.error('Backup code challenge error:', err);
        setErrorMessage('Backup code verification failed.');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <div className="inline-flex p-3 rounded-2xl bg-brand-primary/10 text-brand-primary mb-2">
          <ShieldCheck size={28} />
        </div>
        <h3 className="text-lg font-bold text-foreground">Two-Factor Authentication</h3>
        <p className="text-xs text-muted max-w-xs mx-auto">
          {useBackupCode
            ? 'Enter one of your emergency recovery codes.'
            : `Enter the 6-digit code from your authenticator app.`}
        </p>
        {email && <p className="text-[11px] font-mono text-muted/80">{email}</p>}
      </div>

      {errorMessage && (
        <div className="py-2 px-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm font-medium text-destructive flex items-start gap-3">
          <CircleAlert size={16} className="mt-0.5 shrink-0" />
          <div className="text-xs">{errorMessage}</div>
        </div>
      )}

      {!useBackupCode ? (
        <form onSubmit={handleVerifyTotp} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="mfa-totp"
              className="text-xs font-semibold text-foreground flex items-center justify-center gap-1.5"
            >
              <KeyRound size={13} className="text-brand-primary" />
              6-Digit Authenticator Code
            </label>
            <input
              id="mfa-totp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              required
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center tracking-[0.4em] font-mono text-xl font-bold rounded-xl border border-separator bg-surface px-4 py-2.5 placeholder:text-muted focus:ring-2 focus:ring-brand-primary outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || totpCode.trim().length !== 6}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-primary hover:bg-brand-primary-600 disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-sm shadow-brand-primary/30 transition-all active:scale-[0.98] cursor-pointer"
          >
            {isPending ? 'Verifying...' : 'Verify & Continue'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(true);
                setErrorMessage(null);
              }}
              className="text-xs text-brand-primary hover:underline cursor-pointer"
            >
              Lost device? Use Emergency Backup Code
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyBackup} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="mfa-backup" className="text-xs font-semibold text-foreground block text-center">
              Emergency Backup Recovery Code
            </label>
            <input
              id="mfa-backup"
              type="text"
              autoFocus
              required
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
              placeholder="XXXXX-XXXXX"
              className="w-full text-center font-mono text-base font-semibold rounded-xl border border-separator bg-surface px-4 py-2.5 placeholder:text-muted focus:ring-2 focus:ring-brand-primary outline-none tracking-wider"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || !backupCode.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-primary hover:bg-brand-primary-600 disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-sm shadow-brand-primary/30 transition-all active:scale-[0.98] cursor-pointer"
          >
            {isPending ? 'Verifying code...' : 'Verify Recovery Code'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(false);
                setErrorMessage(null);
              }}
              className="text-xs text-brand-primary hover:underline cursor-pointer"
            >
              Use 6-digit Authenticator code instead
            </button>
          </div>
        </form>
      )}

      <div className="pt-2 border-t border-separator text-center">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft size={13} /> Back to email sign in
        </button>
      </div>
    </div>
  );
}
