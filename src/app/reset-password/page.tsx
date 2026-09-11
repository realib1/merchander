import Image from 'next/image';
import Link from 'next/link';
import { KeyRound, ArrowLeft, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ResetPasswordForm } from './components/ResetPasswordForm';
import signinHero from '../../../public/images/auth/signin-hero.webp';

export const metadata = {
  title: 'Reset Password | Merchander',
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-20 relative z-10 min-h-screen">
        {/* Top Logo Lockup */}
        <div className="w-full max-w-md mx-auto flex items-center gap-3 pt-2 sm:pt-4">
          <Link href="/login" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
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
          </Link>
        </div>

        {/* Center Card */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          {user ? (
            <div>
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-display text-foreground">
                  Set new password
                </h1>
                <p className="mt-2 text-sm text-muted font-medium">
                  Your identity has been verified. Create a new, secure password for your account.
                </p>
              </div>

              <ResetPasswordForm />
            </div>
          ) : (
            <div className="space-y-6 text-center animate-in fade-in-50 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto shadow-xs">
                <KeyRound size={32} />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-display text-foreground">
                  Reset link expired
                </h1>
                <p className="text-sm text-muted font-medium max-w-sm mx-auto leading-relaxed">
                  This password reset link is invalid or has already expired. Reset links can only be used once.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Link
                  href="/forgot-password"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.99] text-white rounded-xl text-sm font-bold shadow-sm shadow-brand-primary/25 transition-all cursor-pointer"
                >
                  <RotateCcw size={16} />
                  Request a new link
                </Link>
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to Sign in
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Switch Link */}
        <div className="w-full max-w-md mx-auto pb-4 pt-6 text-sm text-muted font-medium">
          Need assistance? Contact{' '}
          <a
            href="mailto:support@merchander.com"
            className="font-bold text-brand-primary hover:text-brand-primary-hover hover:underline transition-colors"
          >
            support@merchander.com
          </a>
        </div>
      </div>
    </div>
  );
}
