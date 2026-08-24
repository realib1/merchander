'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-100 p-8 text-center bg-surface border border-separator rounded-2xl shadow-sm m-4">
      <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
        <AlertTriangle size={32} />
      </div>
      <h2 className="text-2xl font-bold  mb-2 font-display">Something went wrong!</h2>
      <p className="mb-8 max-w-md">
        An unexpected error occurred in this section of the dashboard. Kindky <a href="mailto:[EMAIL_ADDRESS]" className='text-brand-primary hover:underline font-medium'>contact support</a> if this error persists.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
        <Button variant="primary" onClick={() => reset()}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
