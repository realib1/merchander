'use client';

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function NotFound(): React.ReactNode {
    return (
        <main className="min-h-screen">
            <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-12 sm:px-8 lg:px-12">
                <div className="grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-8">

                    {/* Left — Message */}
                    <section className="max-w-xl">
                        {/* Logo */}
                        <Link href="/" aria-label="Merchander home" className="inline-block">
                            <Image
                                src="/merchander.png"
                                alt="Merchander"
                                width={42}
                                height={42}
                                className="drop-shadow-xs shrink-0"
                            />
                        </Link>

                        {/* 404 */}
                        <p
                            className="mt-6 text-[clamp(6rem,14vw,10rem)] font-black leading-[0.9] -tracking-[0.05em] text-brand-primary"
                            aria-hidden="true"
                        >
                            404
                        </p>

                        <div className="mt-6 md:hidden">
                            <Image
                                src="/images/404-woman.png"
                                alt="A shopper looking for her way"
                                width={620}
                                height={620}
                                className="drop-shadow-xs w-full"
                            />
                        </div>

                        {/* Heading */}
                        <h1 className="mt-6 max-w-lg text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
                            Looks like you&apos;re lost.
                        </h1>

                        {/* Description */}
                        <p className="mt-2 max-w-md text-base leading-7 text-muted sm:text-lg">
                            The page you&apos;re shopping for might have been sold out or has moved.
                        </p>

                        {/* CTA */}
                        <Link
                            href="/"
                            className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#FC5302] focus:ring-offset-2"
                        >
                            <ArrowLeft size={17} strokeWidth={2} />
                            Go back home
                        </Link>
                    </section>

                    {/* Right — Illustration */}
                    <section className="hidden md:flex items-center justify-center">
                        <div className="relative w-full max-w-[620px]">
                            <Image
                                src="/images/404-woman.png"
                                alt="A shopper looking for her way"
                                width={620}
                                height={620}
                                className="drop-shadow-xs w-full"
                            />
                        </div>
                    </section>

                </div>
            </div>
        </main>
    );
}