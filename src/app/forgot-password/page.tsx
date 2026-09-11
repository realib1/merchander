import Image from 'next/image';
import Link from 'next/link';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import signinHero from '../../../public/images/auth/signin-hero.webp';

export const metadata = {
  title: 'Forgot Password | Merchander',
};

export default function ForgotPasswordPage() {
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
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-display text-foreground">
              Forgot password?
            </h1>
            <p className="mt-2 text-sm text-muted font-medium">
              No worries! Enter your email address and we&apos;ll send you instructions to reset your password.
            </p>
          </div>

          <ForgotPasswordForm />
        </div>

        {/* Bottom Switch Link */}
        <div className="w-full max-w-md mx-auto pb-4 pt-6 text-sm text-muted font-medium">
          Remember your password?{' '}
          <Link
            href="/login"
            className="font-bold text-brand-primary hover:text-brand-primary-hover hover:underline transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
