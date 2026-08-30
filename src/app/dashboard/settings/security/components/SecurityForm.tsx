'use client';

import { useState } from 'react';
import { CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ShieldCheck, QrCode, Lock, KeyRound } from 'lucide-react';
import { enrollTotp, disableTotp } from '@/app/actions/security';
import { TotpSetupModal } from './TotpSetupModal';
import { toast } from 'sonner';

import { RegenerateBackupCodesModal } from './RegenerateBackupCodesModal';
import { BackupCodesModal } from './BackupCodesModal';

interface SecurityFormProps {
  initialTwoFactor: boolean;
}

export function SecurityForm({ initialTwoFactor }: SecurityFormProps) {
  const [is2FaEnabled, setIs2FaEnabled] = useState(initialTwoFactor);

  // Setup Modal State
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollData, setEnrollData] = useState<{
    factorId: string;
    qrCode: string;
    secret: string;
  } | null>(null);

  // Regenerate Backup Codes Modal State
  const [isRegenModalOpen, setIsRegenModalOpen] = useState(false);
  const [freshBackupCodes, setFreshBackupCodes] = useState<string[] | null>(null);

  // Disable Modal State
  const [isDisableConfirmOpen, setIsDisableConfirmOpen] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  // Start MFA Enrollment Flow
  const handleStartSetup = async () => {
    setIsEnrolling(true);
    try {
      const res = await enrollTotp();
      if (res?.error || !res.factorId || !res.qrCode || !res.secret) {
        toast.error(res?.error || 'Failed to start 2FA setup.');
        return;
      }
      setEnrollData({
        factorId: res.factorId,
        qrCode: res.qrCode,
        secret: res.secret,
      });
      setIsSetupModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected setup error';
      toast.error(msg);
    } finally {
      setIsEnrolling(false);
    }
  };

  // Disable 2FA Flow
  const handleDisable2Fa = async () => {
    setIsDisabling(true);
    try {
      const res = await disableTotp();
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Two-factor authentication disabled.');
        setIs2FaEnabled(false);
        setIsDisableConfirmOpen(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to disable 2FA';
      toast.error(msg);
    } finally {
      setIsDisabling(false);
    }
  };

  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                is2FaEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand-primary/10 text-brand-primary'
              }`}
            >
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
              <CardDescription>Secure your store and staff permissions with time-based OTP codes.</CardDescription>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
              is2FaEnabled
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-surface-elevated text-muted border border-separator'
            }`}
          >
            {is2FaEnabled ? 'Active • Protected' : 'Disabled'}
          </span>
        </div>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Authenticator App Status Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-elevated/70 border border-separator/80">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <QrCode className="h-4 w-4 text-brand-primary" aria-hidden="true" />
              Authenticator App (TOTP)
            </p>
            <p className="text-xs text-muted max-w-md">
              Use Google Authenticator, 1Password, or Authy to generate secure verification codes upon sign-in.
            </p>
          </div>
          <div className="shrink-0">
            {is2FaEnabled ? (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsDisableConfirmOpen(true)}
                className="text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 border-separator hover:border-red-500/30 cursor-pointer"
              >
                Disable 2FA
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={handleStartSetup}
                isLoading={isEnrolling}
                className="text-xs cursor-pointer"
              >
                <Lock size={13} className="mr-1.5" /> Enable 2FA
              </Button>
            )}
          </div>
        </div>

        {/* Backup Recovery Codes Section (Visible when 2FA is active) */}
        {is2FaEnabled && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-elevated/70 border border-separator/80">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-brand-primary" aria-hidden="true" />
                Emergency Backup Recovery Codes
              </p>
              <p className="text-xs text-muted max-w-md">
                One-time recovery codes to sign in if you lose your authenticator device.
              </p>
            </div>
            <div className="shrink-0">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsRegenModalOpen(true)}
                className="text-xs cursor-pointer"
              >
                Regenerate Codes
              </Button>
            </div>
          </div>
        )}
      </CardBody>

      {/* TOTP Setup Modal */}
      <TotpSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onSuccess={() => {
          setIs2FaEnabled(true);
          setIsSetupModalOpen(false);
          setEnrollData(null);
        }}
        enrollData={enrollData}
      />

      {/* Regenerate Backup Codes Modal */}
      <RegenerateBackupCodesModal
        isOpen={isRegenModalOpen}
        onClose={() => setIsRegenModalOpen(false)}
        onSuccess={(codes) => {
          setIsRegenModalOpen(false);
          setFreshBackupCodes(codes);
        }}
      />

      {/* Display Fresh Backup Codes */}
      {freshBackupCodes && (
        <BackupCodesModal isOpen={true} backupCodes={freshBackupCodes} onClose={() => setFreshBackupCodes(null)} />
      )}

      {/* Disable 2FA Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDisableConfirmOpen}
        onClose={() => setIsDisableConfirmOpen(false)}
        onConfirm={handleDisable2Fa}
        title="Disable Two-Factor Authentication?"
        description="Disabling 2FA will lower your account security. Your account will only be protected by your password."
        confirmText="Disable 2FA"
        cancelText="Keep 2FA Enabled"
        isDestructive
        isLoading={isDisabling}
      />
    </>
  );
}
