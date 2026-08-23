/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";

export interface FooterLinkItem {
  /** Text label */
  label: string;
  /** URL destination */
  href: string;
  /** External link indicator */
  external?: boolean;
}

export interface FooterLinkGroup {
  /** Group heading */
  title: string;
  /** Links belonging to this group */
  items: FooterLinkItem[];
}

export interface FooterSocialLink {
  /** Label for accessibility */
  label: string;
  /** URL */
  href: string;
  /** Icon component */
  icon: React.ComponentType<{ className?: string }>;
}

export interface FooterProps {
  /** Brand name (defaults to "SHERO Core") */
  brandName?: string;
  /** Brand tagline */
  tagline?: string;
  /** Grouped footer navigation links */
  linkGroups?: FooterLinkGroup[];
  /** Social links */
  socialLinks?: FooterSocialLink[];
  /** Custom copyright text */
  copyright?: string;
  /** Extra content at bottom (status indicators, version, etc.) */
  extraBottom?: React.ReactNode;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Responsive application footer with brand info, grouped links, social shortcuts, and copyright notice.
 */
export const Footer: React.FC<FooterProps> = ({
  brandName = "SHERO Core",
  tagline = "Universal Project Scaffolding System by SHERO Technology Studio",
  linkGroups = [],
  socialLinks = [],
  copyright,
  extraBottom,
  className,
}) => {
  const currentYear = new Date().getFullYear();
  const defaultCopyright = `© ${currentYear} ${brandName}. All rights reserved.`;

  return (
    <footer
      className={cn(
        "w-full border-t border-separator bg-surface text-text-secondary transition-colors duration-[var(--duration-fast,150ms)]",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Brand Info */}
          <div className="flex flex-col gap-3 md:col-span-4 lg:col-span-5">
            <div className="flex items-center gap-2 mb-2">
              <img 
                src="/merchander.png" 
                alt={brandName} 
                className="h-8 w-auto dark:invert-0" 
              />
                <span className="text-xl font-bold tracking-tight text-text-primary font-display">
                  Merchander
                </span>
            </div>
            {tagline && (
              <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
                {tagline}
              </p>
            )}

            {socialLinks.length > 0 && (
              <div className="mt-3 flex items-center gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm,4px)] text-text-muted transition-colors hover:bg-surface-elevated hover:text-brand-primary"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Link Groups */}
          {linkGroups.length > 0 && (
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-8 lg:col-span-7">
              {linkGroups.map((group) => (
                <div key={group.title} className="flex flex-col gap-3">
                  <h3 className="text-xs font-semibold tracking-wider text-text-primary uppercase">
                    {group.title}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {group.items.map((item) => (
                      <li key={item.label}>
                        {item.external ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-text-secondary transition-colors hover:text-brand-primary"
                          >
                            {item.label}
                          </a>
                        ) : (
                          <Link
                            href={item.href}
                            className="text-sm text-text-secondary transition-colors hover:text-brand-primary"
                          >
                            {item.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-separator/60 pt-8 text-xs text-text-muted sm:flex-row">
          <p>{copyright || defaultCopyright}</p>
          <div className="flex items-center gap-4">
            {extraBottom}
            <span className="font-medium tracking-wide">
              Product of <a href="https://sherohq.com" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline transition-colors">SHERO</a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

