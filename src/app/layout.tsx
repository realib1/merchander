import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { ThemeScript } from "@/context/ThemeScript";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Merchander | Social Commerce OS",
  description: "The Operating System for Social-First Merchants",
};

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-primary transition-colors duration-200">
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
