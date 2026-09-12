import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function NotFound(): React.ReactNode {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Brand Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 sm:px-8 lg:px-12 flex items-center">
        <Link
          href="/"
          aria-label="Merchander home"
          className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Image src="/merchander.png" alt="Merchander" width={34} height={34} className="shrink-0" />
          <span className="font-display font-bold text-xl tracking-tight text-foreground">Merchander</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-7xl">
          <div className="grid w-full items-center gap-10 lg:grid-cols-12 lg:gap-16">
            {/* Left: Message & Recovery CTA */}
            <section className="lg:col-span-6 xl:col-span-5 max-w-xl">
              <p
                className="font-display text-6xl sm:text-7xl font-extrabold tracking-tight text-brand-primary select-none"
                aria-hidden="true"
              >
                404
              </p>

              <h1 className="mt-4 font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Looks like you&apos;re lost.
              </h1>

              <p className="mt-3 text-base sm:text-lg text-muted leading-relaxed max-w-md">
                The page you&apos;re looking for doesn&apos;t exist, has been moved, or is temporarily unavailable.
              </p>

              <div className="mt-8">
                <Link
                  href="/"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <ArrowLeft size={17} strokeWidth={2} />
                  Go back home
                </Link>
              </div>
            </section>

            {/* Right: Flat Illustration */}
            <section className="lg:col-span-6 xl:col-span-7 flex items-center justify-center lg:justify-end">
              <Image
                src="/images/404-woman.png"
                alt="A person surrounded by packages searching on a laptop"
                width={1536}
                height={1024}
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 70vw, 560px"
                className="w-full max-w-[500px] sm:max-w-[540px] lg:max-w-[580px] h-auto object-contain select-none pointer-events-none"
              />
            </section>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 sm:px-4 lg:px-12 flex items-center justify-between text-xs text-muted">
        <p>© Merchander. All rights reserved.</p>
      </footer>
    </div>
  );
}
