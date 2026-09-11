import { Metadata } from 'next';
import Image from 'next/image';
import { SignupWizardClient } from './components/SignupWizardClient';

export const metadata: Metadata = {
  title: 'Sign Up | Merchander',
  description: 'Create your merchant account and tailor your social commerce workspace.',
};

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col lg:flex-row relative overflow-hidden">
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
          src="/images/auth/signup-hero.png"
          alt="Build your online store. Reach more customers. Grow your business."
          fill
          priority
          sizes="50vw"
          className="object-cover object-center"
        />
      </div>

      {/* Right Split: Clean Auth & Onboarding Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-8 lg:py-5 lg:px-10 xl:px-14 relative z-10 min-h-screen lg:h-screen lg:overflow-y-auto">
        {/* Top Logo Lockup */}
        <div className="w-full max-w-xl mx-auto flex items-center gap-3 pt-1 sm:pt-2">
          <Image
            src="/merchander.png"
            alt="Merchander"
            width={34}
            height={34}
            className="drop-shadow-xs shrink-0"
          />
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            Merchander
          </span>
        </div>

        {/* Center Wizard Component */}
        <div className="w-full mx-auto my-auto py-2 sm:py-3">
          <SignupWizardClient />
        </div>

        {/* Subtle bottom balance */}
        <div className="hidden lg:block w-full max-w-xl mx-auto pb-1" />
      </div>
    </main>
  );
}
