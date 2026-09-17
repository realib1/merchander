import { CircleAlert, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { LoginForm } from './components/LoginForm';
import Link from 'next/link';
import signinHero from '../../../public/images/auth/signin-hero.webp';

export const metadata = {
  title: 'Login | Merchander',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mfa?: string; reset?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row relative overflow-x-hidden">
      <div className="lg:hidden absolute -bottom-20 -right-20 pointer-events-none z-0 opacity-20">
        <Image src="/merchander.png" alt="" width={220} height={220} aria-hidden="true" />
      </div>

      {/* Left Split: Hero Photography (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface border-r border-separator overflow-hidden select-none">
        <Image
          src={signinHero}
          alt="Your store. Your customers. One Platform."
          fill
          priority
          placeholder="blur"
          sizes="50vw"
          className="object-cover object-center"
        />
      </div>

      {/* Right Split: Clean Auth Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-20 relative z-10">
        {/* Top Logo Lockup */}
        <div className="w-full max-w-md mx-auto flex items-center gap-3 pt-2 sm:pt-4">
          <Image src="/merchander.png" alt="Merchander" width={38} height={38} className="drop-shadow-xs shrink-0" />
          <span className="font-display font-bold text-2xl tracking-tight text-foreground">Merchander</span>
        </div>

        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center py-4">
          <div className="mb-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-display text-foreground">Welcome back</h1>
            <p className="mt-2 text-sm text-muted font-medium">
              Log in to your account to continue managing your store.
            </p>
          </div>

          {resolvedSearchParams?.error && (
            <div className="mb-3 py-2.5 px-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-sm font-medium text-destructive flex items-start gap-3 animate-in fade-in-50 duration-200">
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

          {resolvedSearchParams?.reset === 'success' && (
            <div className="mb-3 py-2.5 px-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm font-medium text-emerald-800 dark:text-emerald-300 flex items-start gap-3 animate-in fade-in-50 duration-200">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>Your password has been reset successfully. Please sign in with your new password.</div>
            </div>
          )}

          <LoginForm initialMfaRequired={resolvedSearchParams?.mfa === 'required'} />
          <div className="mt-4 text-sm text-muted font-medium">
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
    </div>
  );
}
