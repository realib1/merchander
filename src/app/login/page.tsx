import { CircleAlert } from 'lucide-react';
import Image from 'next/image';
import { LoginForm } from './components/LoginForm';
import Link from 'next/link';

export const metadata = {
  title: 'Login | Merchander',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle modern SaaS background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-100 bg-brand-primary/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <Image src="/merchander.png" alt="Merchander" width={56} height={56} className="drop-shadow-sm" />
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight font-display">Welcome back</h2>
        <p className="mt-2 text-center text-sm  font-medium">Sign in to your merchant dashboard</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-surface py-8 px-4 shadow-xl shadow-brand-primary/5 sm:rounded-2xl sm:px-10 border border-separator">
          {resolvedSearchParams?.error && (
            <div className="mb-6 py-2 px-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm font-medium text-destructive flex items-start gap-3">
              <CircleAlert size={14} className="mt-0.5 shrink-0" />
              <div>
                {resolvedSearchParams.error === 'auth-failed'
                  ? 'Authentication failed. Please check your credentials and try again.'
                  : 'Invalid email or password.'}
              </div>
            </div>
          )}

          <LoginForm />
        </div>

        <p className="text-center text-sm  mt-8 font-medium">
          New to Merchander?{' '}
          <Link href="#" className="font-semibold text-brand-primary hover:text-brand-primary-600 transition-colors">
            Contact Us
          </Link>
        </p>
      </div>
    </div>
  );
}
