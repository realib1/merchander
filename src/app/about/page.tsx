import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BarChart3, LockKeyhole, MessageCircle, PackageCheck } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'About Us | Merchander',
  description: 'Learn why Merchander exists and how we are building better operating tools for ambitious merchants.',
};

const principles = [
  {
    icon: MessageCircle,
    title: 'Commerce as it happens',
    description:
      'We start with the conversations, mobile money, pre-orders, and relationships that already move business forward.',
  },
  {
    icon: PackageCheck,
    title: 'One connected picture',
    description: 'Sales, stock, suppliers, customers, deliveries, and costs belong in the same operating picture.',
  },
  {
    icon: LockKeyhole,
    title: 'Trust by design',
    description:
      'Your business data belongs to your workspace. Clear permissions and activity history keep it accountable.',
  },
  {
    icon: BarChart3,
    title: 'Clarity over noise',
    description:
      'Useful software should help a merchant decide what to do next, not create another system to maintain.',
  },
];

export default function AboutPage() {
  const navItems = [
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'Areas', href: '/#areas' },
    { label: 'About us', href: '/about', active: true },
  ];

  const footerLinkGroups = [
    {
      title: 'Platform',
      items: [
        { label: 'How it works', href: '/#how-it-works' },
        { label: 'Get Early Access', href: '/#waitlist' },
      ],
    },
    {
      title: 'Company',
      items: [
        { label: 'About us', href: '/about' },
        { label: 'Contact us', href: 'mailto:hello@sherohq.com' },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-primary">
      <Header navItems={navItems} showThemeToggle sticky />

      <main className="flex-1">
        <section className="border-b border-separator bg-surface px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">About Merchander</p>
              <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-primary sm:text-6xl">
                Better tools for the businesses already doing the work.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-secondary sm:text-lg">
                Merchander is the operating system for social-commerce businesses. We bring the everyday work of
                selling, stocking, collecting, and planning into one clear place.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/#waitlist"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-primary px-5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover"
                >
                  Start with Merchander
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/#how-it-works"
                  className="inline-flex h-10 items-center rounded-md border border-separator bg-surface px-5 text-sm font-semibold text-primary transition hover:bg-surface-elevated"
                >
                  See how it works
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-separator px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Why we exist</p>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Trade is personal. The operations behind it should be dependable.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-8 text-secondary">
              <p>
                Across Ghana and beyond, ambitious merchants build thriving businesses through WhatsApp, storefronts,
                mobile money, supplier relationships, and word of mouth. Their work is sophisticated, even when the
                tools around it are scattered.
              </p>
              <p>
                Merchander exists to connect those moving parts without asking merchants to abandon the way their
                customers already buy. It turns fragmented records into a living view of the business, from the first
                conversation to the final delivery.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-separator bg-surface-elevated/30 px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">What guides us</p>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Built close to the real work.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {principles.map((principle) => {
                const Icon = principle.icon;
                return (
                  <article key={principle.title} className="rounded-lg border border-separator bg-surface p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-primary/10 text-brand-primary">
                      <Icon size={20} aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 font-display text-lg font-bold text-primary">{principle.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-secondary">{principle.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 border-l-[3px] border-brand-primary pl-6 md:flex-row md:items-center md:pl-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">The next chapter</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Your business already has momentum. Let&apos;s make the picture clearer.
              </h2>
            </div>
            <Link
              href="/#waitlist"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-brand-primary px-5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover"
            >
              Get early access
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <Footer
        brandName="Merchander"
        tagline="Open Path. More Possibilities. For the ambitious merchant."
        linkGroups={footerLinkGroups}
      />
    </div>
  );
}
