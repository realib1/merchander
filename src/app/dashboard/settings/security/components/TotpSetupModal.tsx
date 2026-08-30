'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Copy, Check, KeyRound } from 'lucide-react';
import { verifyAndEnableTotp } from '@/app/actions/security';
import { toast } from 'sonner';

import { BackupCodesModal } from './BackupCodesModal';

interface TotpSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  enrollData: {
    factorId: string;
    qrCode: string;
    secret: string;
  } | null;
}

export function TotpSetupModal({ isOpen, onClose, onSuccess, enrollData }: TotpSetupModalProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState<string[] | null>(null);

  const handleCopySecret = () => {
    if (!enrollData?.secret) return;
    navigator.clipboard.writeText(enrollData.secret);
    setCopied(true);
    toast.success('Secret key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData?.factorId) return;

    if (verificationCode.trim().length !== 6) {
      toast.error('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await verifyAndEnableTotp(enrollData.factorId, verificationCode);
      if (res?.error) {
        toast.error(res.error);
      } else if (res?.backupCodes && res.backupCodes.length > 0) {
        toast.success('Authenticator app verified!');
        setGeneratedBackupCodes(res.backupCodes);
      } else {
        toast.success('Two-factor authentication successfully enabled!');
        setVerificationCode('');
        onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      toast.error(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  if (generatedBackupCodes) {
    return (
      <BackupCodesModal
        isOpen={true}
        backupCodes={generatedBackupCodes}
        onClose={() => {
          setGeneratedBackupCodes(null);
          setVerificationCode('');
          onSuccess();
        }}
      />
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isVerifying && onClose()}
      title="Set Up Authenticator App"
      description="Scan the QR code with your authenticator app (Google Authenticator, Authy, 1Password)."
      size="md"
    >
      {enrollData && (
        <form onSubmit={handleVerifyCode} className="space-y-5 py-1">
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface-elevated border border-separator text-center space-y-3">
            <div className="p-3 bg-white rounded-xl shadow-xs border border-separator/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={enrollData.qrCode} alt="2FA QR Code" className="w-44 h-44 object-contain" />
            </div>
            <p className="text-xs text-muted">Can&apos;t scan? Use the secret key below:</p>

            {/* Secret Key with Copy */}
            <div className="flex items-center gap-2 w-full max-w-xs">
              <input
                type="text"
                readOnly
                value={enrollData.secret}
                className="flex-1 font-mono text-xs text-center bg-surface border border-separator rounded-lg px-2.5 py-1.5 text-foreground select-all outline-none"
              />
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleCopySecret}
                className="shrink-0 text-xs px-2.5 cursor-pointer"
                aria-label="Copy secret key"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </Button>
            </div>
          </div>

          {/* 6-Digit Code Input */}
          <div className="space-y-2">
            <label htmlFor="totp-code" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <KeyRound size={14} className="text-brand-primary" />
              Enter 6-Digit Verification Code
            </label>
            <input
              id="totp-code"
              type="text"
              maxLength={6}
              autoFocus
              required
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center tracking-[0.4em] font-mono text-lg font-bold rounded-xl border border-separator bg-surface px-4 py-2.5 placeholder:text-muted focus-visible:ring-2 focus-visible:ring-brand-primary/50 outline-none transition-colors"
            />
            <p className="text-[11px] text-muted text-center">
              Enter the numerical code currently showing in your authenticator app.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-separator">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isVerifying}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isVerifying}
              disabled={isVerifying || verificationCode.trim().length !== 6}
            >
              Verify & Activate
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
