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
    } catch (err) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="w-full">
      <form className="mt-10 flex w-full max-w-lg flex-col gap-3 mx-auto sm:w-auto sm:flex-row" onSubmit={handleJoinWaitlist}>
        <input
          type="email"
          name="email"
          placeholder="Enter your email address..."
          required
          disabled={status === 'loading'}
          className="flex h-11 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-surface px-4 py-2 text-base sm:text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50"
        />
        <Button type="submit" variant="primary" size="md" className="h-11 w-full sm:w-auto shadow-[0_0_40px_rgba(245,158,11,0.2)] whitespace-nowrap" disabled={status === 'loading'}>
          {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
        </Button>
      </form>
      {message && (
        <div className={`mt-3 text-sm font-medium ${status === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
