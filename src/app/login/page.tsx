import { CircleAlert } from 'lucide-react';
import Image from 'next/image';
import { LoginForm } from './components/LoginForm';
import Link from 'next/link';

export const metadata = {
  title: 'Login | Merchander',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mfa?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row relative overflow-hidden">
      {/* Mobile background brand curve accent */}
      <div className="lg:hidden absolute -bottom-10 -right-10 pointer-events-none z-0">
        <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M180 30C100 30 30 100 30 180"
            stroke="var(--color-brand-primary)"
            strokeWidth="2"
            strokeOpacity="0.45"
          />
        </svg>
      </div>

      {/* Left Split: Hero Photography (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface border-r border-separator overflow-hidden select-none">
        <Image
          src="/images/auth/signin-hero.png"
          alt="Your store. Your customers. One Platform."
          fill
          priority
          sizes="50vw"
          className="object-cover object-center"
        />
      </div>

      {/* Right Split: Clean Auth Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-20 relative z-10 min-h-screen">
        {/* Top Logo Lockup */}
        <div className="w-full max-w-md mx-auto flex items-center gap-3 pt-2 sm:pt-4">
          <Image
            src="/merchander.png"
            alt="Merchander"
            width={38}
            height={38}
            className="drop-shadow-xs shrink-0"
          />
          <span className="font-display font-bold text-2xl tracking-tight text-foreground">
            Merchander
          </span>
        </div>

        {/* Center Card */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-display text-foreground">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-muted font-medium">
              Log in to your account to continue managing your store.
            </p>
          </div>

          {resolvedSearchParams?.error && (
            <div className="mb-6 py-2.5 px-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-sm font-medium text-destructive flex items-start gap-3 animate-in fade-in-50 duration-200">
              <CircleAlert size={18} className="mt-0.5 shrink-0" />
              <div>
                {resolvedSearchParams.error === 'auth-failed'
                  ? 'Authentication failed. Please check your credentials and try again.'
                  : resolvedSearchParams.error === 'no-tenant'
                  ? 'No merchant store is linked to this account. Please sign in with your merchant credentials or contact support.'
                  : 'Invalid email or password.'}
              </div>
            </div>
          )}

          <LoginForm initialMfaRequired={resolvedSearchParams?.mfa === 'required'} />
        </div>

        {/* Bottom Switch Link */}
        <div className="w-full max-w-md mx-auto pb-4 pt-6 text-sm text-muted font-medium">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-bold text-brand-primary hover:text-brand-primary-hover hover:underline transition-colors"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
