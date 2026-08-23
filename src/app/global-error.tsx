'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background text-primary">
          <h2 className="text-3xl font-bold mb-4 font-display">Application Error</h2>
          <p className="text-secondary mb-8 max-w-md">
            A critical error occurred. Please try reloading the application.
          </p>
          <Button variant="primary" onClick={() => reset()}>
            Try Again
          </Button>
        </div>
      </body>
    </html>
  );
}
