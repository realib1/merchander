import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Merchander',
  description: 'How Merchander collects, uses, and protects information.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <Link href="/signup" className="text-sm font-semibold text-brand-primary hover:underline">
          Back to sign up
        </Link>
        <article className="mt-10 space-y-8">
          <header className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary">Merchander</p>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Privacy Policy</h1>
            <p className="text-sm text-muted">Last updated September 16, 2026</p>
          </header>

          <section className="space-y-3 text-sm leading-7 text-muted">
            <h2 className="font-display text-xl font-bold text-foreground">Information we handle</h2>
            <p>
              We handle account details, business profile information, storefront content, order and customer data, and
              technical information needed to provide and secure Merchander. We only request information needed for the
              features you use and the services we operate.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-7 text-muted">
            <h2 className="font-display text-xl font-bold text-foreground">How we use information</h2>
            <p>
              Information is used to authenticate users, operate merchant workspaces, process requested workflows,
              provide support, improve reliability, and detect abuse or security issues. We do not sell merchant or
              customer information.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-7 text-muted">
            <h2 className="font-display text-xl font-bold text-foreground">Security and retention</h2>
            <p>
              We use access controls and technical safeguards designed to protect workspace data. Information is
              retained for as long as needed to provide the service, meet legal obligations, resolve disputes, and
              enforce our agreements.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-7 text-muted">
            <h2 className="font-display text-xl font-bold text-foreground">Your questions</h2>
            <p>
              For privacy requests or questions, contact{' '}
              <a href="mailto:privacy@merchander.com" className="font-semibold text-brand-primary hover:underline">
                privacy@merchander.com
              </a>
              .
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
