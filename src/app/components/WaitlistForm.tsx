'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

export function WaitlistForm() {
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = React.useState('');

  const handleJoinWaitlist = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setStatus('loading');
    setMessage('');

    try {
      const { joinWaitlist } = await import('@/app/actions/waitlist');
      const result = await joinWaitlist(formData);

      if (result.error) {
        setStatus('error');
        setMessage(result.error);
      } else {
        setStatus('success');
        setMessage('Thanks for joining the waitlist! We will be in touch soon.');
        (e.target as HTMLFormElement).reset();
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="w-full">
      <form className="flex w-full max-w-md flex-col gap-2 sm:flex-row" onSubmit={handleJoinWaitlist}>
        <input
          type="email"
          name="email"
          placeholder="Enter your email address"
          required
          disabled={status === 'loading'}
          className="flex h-10 w-full rounded-md border border-separator bg-surface px-3.5 py-2 text-sm shadow-2xs transition-colors placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="h-10 w-full sm:w-auto shrink-0 font-medium px-4 text-sm whitespace-nowrap shadow-2xs"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
        </Button>
      </form>
      {message && (
        <div
          className={`mt-2 text-xs font-medium ${
            status === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
