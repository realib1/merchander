import Image from 'next/image';
import Link from 'next/link';
import { Hammer, ShieldCheck, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Under Maintenance | Merchander',
  description: 'Merchander is currently undergoing scheduled maintenance. Please check back shortly.',
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between items-center px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Brand Logo */}
      <header className="w-full max-w-xl flex items-center justify-center gap-3">
        <Image
          src="/merchander.png"
          alt="Merchander"
          width={36}
          height={36}
          className="drop-shadow-xs shrink-0"
        />
        <span className="font-display font-bold text-2xl tracking-tight text-foreground">
          Merchander
        </span>
      </header>

      {/* Center Maintenance Card */}
      <main className="w-full max-w-lg bg-surface border border-separator rounded-2xl p-8 sm:p-10 shadow-lg shadow-black/5 text-center my-auto">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Hammer className="w-8 h-8 animate-pulse" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground tracking-tight">
          System Maintenance
        </h1>

        <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed">
          We are currently performing scheduled maintenance and routine system upgrades to improve platform performance and reliability.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-surface-hover/60 border border-separator text-left text-xs sm:text-sm text-muted space-y-2">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <span>All merchant store data and existing customer orders are completely secure.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-4 h-4 text-center font-bold text-brand-primary shrink-0">•</span>
            <span>Customer storefront access and merchant dashboards will automatically resume once complete.</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-separator flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <span>Need immediate assistance?</span>
          <a
            href="mailto:support@merchander.com"
            className="font-medium text-brand-primary hover:underline hover:text-brand-primary-hover transition-colors"
          >
            support@merchander.com
          </a>
        </div>
      </main>

      {/* Footer / Platform Staff Bypass */}
      <footer className="w-full max-w-xl text-center text-xs text-muted/80 py-4 flex items-center justify-center gap-2">
        <span>Platform staff administrator?</span>
        <Link
          href="/login"
          className="font-medium text-foreground hover:text-brand-primary inline-flex items-center gap-1 transition-colors"
        >
          Sign in to Platform <ArrowRight className="w-3 h-3" />
        </Link>
      </footer>
    </div>
  );
}
