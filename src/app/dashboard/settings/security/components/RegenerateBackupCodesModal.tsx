'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { regenerateBackupCodes } from '@/app/actions/security';
import { toast } from 'sonner';

interface RegenerateBackupCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCodes: string[]) => void;
}

export function RegenerateBackupCodesModal({ isOpen, onClose, onSuccess }: RegenerateBackupCodesModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await regenerateBackupCodes(password);
      if (res?.error) {
        toast.error(res.error);
      } else if (res?.backupCodes) {
        toast.success('Generated fresh backup codes!');
        setPassword('');
        onSuccess(res.backupCodes);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Regeneration failed';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title="Regenerate Emergency Backup Codes"
      description="Regenerating backup codes will invalidate all of your previous backup codes. Enter your password to continue."
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        <div className="space-y-1.5">
          <label htmlFor="regen-password" className="text-xs font-semibold text-foreground">
            Account Password <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="regen-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-separator bg-surface px-3.5 py-2 pr-10 text-sm placeholder:text-muted focus-visible:ring-2 focus-visible:ring-brand-primary/50 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-separator">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting} disabled={isSubmitting || !password}>
            <KeyRound size={13} className="mr-1.5" /> Generate New Codes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
