'use client';

import { useState } from 'react';
import { CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MonitorSmartphone, LogOut } from 'lucide-react';
import { signOutOtherSessions } from '@/app/actions/security';
import { toast } from 'sonner';

interface ActiveSessionsCardProps {
  userEmail: string;
}

export function ActiveSessionsCard({ userEmail }: ActiveSessionsCardProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevokeOtherSessions = async () => {
    setIsRevoking(true);
    try {
      const res = await signOutOtherSessions();
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Successfully signed out of all other devices.');
        setIsConfirmOpen(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to revoke sessions';
      toast.error(msg);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <MonitorSmartphone className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Session Management</CardTitle>
              <CardDescription>Manage active logins and remote device access.</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        <div className="p-4 rounded-xl bg-surface-elevated/70 border border-separator/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Current Session</p>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Current Device</span>
          </div>
          <p className="text-xs text-muted">
            Authenticated as <span className="font-mono text-foreground font-medium">{userEmail}</span>
          </p>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          If you have signed in from another computer, tablet, or mobile device and wish to revoke access, you can sign
          out of all other sessions remotely.
        </p>
      </CardBody>

      <CardFooter className="justify-end">
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-separator hover:border-destructive/30 cursor-pointer"
        >
          <LogOut size={13} className="mr-1.5" /> Sign Out All Other Devices
        </Button>
      </CardFooter>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleRevokeOtherSessions}
        title="Sign Out Other Devices?"
        description="This will invalidate active sessions on all other browsers and devices. Your current session will remain active."
        confirmText="Sign Out Other Devices"
        cancelText="Cancel"
        isDestructive
        isLoading={isRevoking}
      />
    </>
  );
}
