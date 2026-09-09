import { Metadata } from 'next';
import { SignupWizardClient } from './components/SignupWizardClient';

export const metadata: Metadata = {
  title: 'Sign Up | Merchander',
  description: 'Create your merchant account and tailor your social commerce workspace.',
};

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle modern SaaS background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-100 bg-brand-primary/10 blur-[120px] pointer-events-none rounded-full" />
      <SignupWizardClient />
    </main>
  );
}
