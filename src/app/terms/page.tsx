import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Merchander',
  description: 'The terms that govern use of the Merchander platform.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <Link href="/signup" className="text-sm font-semibold text-brand-primary hover:underline">
          Back to sign up
        </Link>
        <article className="mt-10 space-y-8">
          <header className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary">Merchander</p>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Terms of Service</h1>
            <p className="text-sm text-muted">Last updated September 16, 2026</p>
          </header>

          <section className="space-y-3 text-sm leading-7 text-muted">
            <h2 className="font-display text-xl font-bold text-foreground">Using Merchander</h2>
            <p>
              Merchander provides tools for merchants to manage social commerce, storefronts, inventory, orders,
              customers, and related business operations. You are responsible for the accuracy of information entered
              into your workspace and for activity carried out through your account.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-7 text-muted">
            <h2 className="font-display text-xl font-bold text-foreground">Your account</h2>
            <p>
              Keep your login details secure and notify us promptly if you believe your account has been accessed
              without permission. You must have authority to represent the business associated with your workspace.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-7 text-muted">
            <h2 className="font-display text-xl font-bold text-foreground">Acceptable use</h2>
            <p>
              Do not misuse the platform, interfere with its operation, attempt unauthorized access, or use it to
              violate applicable law or the rights of others. We may suspend access when necessary to protect users, the
              platform, or third parties.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-7 text-muted">
            <h2 className="font-display text-xl font-bold text-foreground">Contact</h2>
            <p>
              Questions about these terms can be sent to{' '}
              <a href="mailto:support@merchander.com" className="font-semibold text-brand-primary hover:underline">
                support@merchander.com
              </a>
              .
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
