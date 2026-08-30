'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Copy, Check, Download, ShieldAlert, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

interface BackupCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  backupCodes: string[];
}

export function BackupCodesModal({ isOpen, onClose, backupCodes }: BackupCodesModalProps) {
  const [copied, setCopied] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const handleCopyAll = () => {
    const text = `MERCHANDER 2FA EMERGENCY BACKUP RECOVERY CODES\nGenerated: ${new Date().toISOString()}\n\nEach code can only be used once:\n\n${backupCodes
      .map((c, i) => `${i + 1}. ${c}`)
      .join('\n')}\n\nKeep these codes in a safe place.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Backup codes copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const text = `MERCHANDER 2FA EMERGENCY BACKUP RECOVERY CODES\nGenerated: ${new Date().toISOString()}\n\nEach code can only be used once:\n\n${backupCodes
      .map((c, i) => `${i + 1}. ${c}`)
      .join('\n')}\n\nKeep these codes in a safe place.`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `merchander-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!hasSaved) {
          toast.warning('Please confirm you have saved your backup codes before closing.');
          return;
        }
        onClose();
      }}
      title="Save Emergency Backup Codes"
      description="If you lose access to your authenticator app, these one-time recovery codes are the only way to regain access to your account."
      size="md"
    >
      <div className="space-y-4 py-1">
        {/* Warning Banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Treat these recovery codes like your passwords. Each code is <strong>single-use</strong> and will not be
            shown again after you close this modal.
          </p>
        </div>

        {/* Backup Codes Grid */}
        <div className="p-4 rounded-xl bg-surface-elevated border border-separator">
          <div className="grid grid-cols-2 gap-2.5">
            {backupCodes.map((code, idx) => (
              <div
                key={code}
                className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-separator/60 font-mono text-xs font-semibold text-foreground tracking-wider select-all justify-center"
              >
                <span className="text-muted text-[10px] select-none font-sans font-normal">{idx + 1}.</span>
                <span>{code}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-separator/60">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleCopyAll}
              className="text-xs flex-1 cursor-pointer"
            >
              {copied ? <Check size={13} className="text-emerald-500 mr-1.5" /> : <Copy size={13} className="mr-1.5" />}
              {copied ? 'Copied' : 'Copy All'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleDownload}
              className="text-xs flex-1 cursor-pointer"
            >
              <Download size={13} className="mr-1.5" /> Download .txt
            </Button>
          </div>
        </div>

        {/* Checkbox Acknowledgment */}
        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-elevated/50 border border-separator/50 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasSaved}
            onChange={(e) => setHasSaved(e.target.checked)}
            className="rounded border-separator text-brand-primary focus:ring-brand-primary/50 mt-0.5 cursor-pointer"
          />
          <span className="text-xs font-medium text-foreground">
            I have copied or downloaded my emergency recovery codes in a secure place.
          </span>
        </label>

        {/* Modal Action */}
        <div className="flex items-center justify-end pt-3 border-t border-separator">
          <Button
            variant="primary"
            type="button"
            onClick={onClose}
            disabled={!hasSaved}
            className="w-full sm:w-auto cursor-pointer"
          >
            <KeyRound size={13} className="mr-1.5" /> Finish & Enable 2FA
          </Button>
        </div>
      </div>
    </Modal>
  );
}
