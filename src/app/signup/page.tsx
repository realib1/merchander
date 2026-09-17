import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PauseCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { SignupWizardClient } from './components/SignupWizardClient';
import { createAdminClient } from '@/lib/supabase/admin';
import signupHero from '../../../public/images/auth/signup-hero.webp';

export const metadata: Metadata = {
  title: 'Sign Up | Merchander',
  description: 'Create your merchant account and tailor your social commerce workspace.',
};

export default async function SignupPage() {
  let signupsDisabled = false;
  try {
    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase
      .from('platform_settings')
      .select('disable_new_signups')
      .eq('id', 1)
      .maybeSingle();

    signupsDisabled = data?.disable_new_signups === true;
  } catch (err) {
    console.error('Failed to check platform signup settings:', err);
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col lg:flex-row relative overflow-x-hidden">
      {/* Mobile background brand curve accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="lg:hidden absolute -bottom-20 -right-20 opacity-20">
          <Image src="/merchander.png" alt="" width={220} height={220} aria-hidden="true" />
        </div>
      </div>

      {/* Left Split: Hero Photography (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface border-r border-separator overflow-hidden select-none">
        <Image
          src={signupHero}
          alt="Build your online store. Reach more customers. Grow your business."
          fill
          priority
          placeholder="blur"
          sizes="50vw"
          className="object-cover object-center"
        />
      </div>

      {/* Right Split: Clean Auth & Onboarding Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-8 lg:py-5 lg:px-10 xl:px-14 relative z-10 grow lg:grow-0">
        {/* Top Logo Lockup */}
        <div className="w-full max-w-xl mx-auto flex items-center gap-3 pt-1 sm:pt-2">
          <Image src="/merchander.png" alt="Merchander" width={34} height={34} className="drop-shadow-xs shrink-0" />
          <span className="font-display font-bold text-xl tracking-tight text-foreground">Merchander</span>
        </div>

        <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center py-4 sm:py-6">
          {signupsDisabled ? (
            <div className="bg-surface border border-separator rounded-2xl p-6 sm:p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <PauseCircle className="w-7 h-7" />
              </div>

              <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
                Registrations Temporarily Paused
              </h1>

              <p className="mt-3 text-sm text-muted leading-relaxed">
                New merchant workspace registrations are currently paused while our team completes scheduled platform
                onboarding and maintenance.
              </p>

              <div className="mt-6 p-4 rounded-xl bg-surface-hover/60 border border-separator text-left text-xs text-muted space-y-2">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Existing merchant operations, active storefronts, and order workflows remain unaffected.</span>
                </div>
              </div>

              <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold transition-colors shadow-xs"
                >
                  Sign In to Existing Account <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="mailto:support@merchander.com"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-separator hover:bg-surface-hover text-foreground text-sm font-medium transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>
          ) : (
            <SignupWizardClient />
          )}
          {!signupsDisabled && (
            <div className="mt-4 text-sm text-muted font-medium">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-bold text-brand-primary hover:text-brand-primary-hover hover:underline transition-colors"
              >
                Log in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
