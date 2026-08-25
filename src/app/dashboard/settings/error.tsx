'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export default function SettingsErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Settings page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-87.5 p-8 text-center bg-surface border border-separator rounded-2xl shadow-xs max-w-3xl">
      <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold mb-2 font-display text-primary">Unable to load settings</h2>
      <p className="mb-6 max-w-md text-sm text-secondary">
        We encountered a problem loading this settings panel. Please verify your connection or try again.
      </p>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
        <Button variant="primary" size="sm" onClick={() => reset()}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
