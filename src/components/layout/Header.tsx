/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { MobileDrawer } from "./MobileDrawer";
import { cn } from "@/utils/cn";

export interface NavItem {
  /** Label for the navigation link */
  label: string;
  /** Destination URL or anchor */
  href: string;
  /** Whether link is currently active */
  active?: boolean;
  /** Optional icon component */
  icon?: React.ComponentType<{ className?: string }>;
}

export interface HeaderProps {
  /** Brand or Logo element */
  logo?: React.ReactNode;
  /** Navigation link items */
  navItems?: NavItem[];
  /** Right-hand side action elements (buttons, user menu, etc.) */
  actions?: React.ReactNode;
  /** Whether to render the ThemeToggle in the header */
  showThemeToggle?: boolean;
  /** Make header stick to the top of the viewport */
  sticky?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Responsive application header with desktop navigation, mobile drawer, and action slots.
 */
export const Header: React.FC<HeaderProps> = ({
  logo,
  navItems = [],
  actions,
  showThemeToggle = true,
  sticky = true,
  className,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          "z-40 w-full border-b border-separator bg-surface/80 backdrop-blur-md transition-colors duration-[var(--duration-fast,150ms)]",
          sticky && "sticky top-0",
          className
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo / Brand */}
          <div className="flex items-center gap-6">
            {logo ? (
              <div className="flex items-center">{logo}</div>
            ) : (
              <Link
                href="/"
                className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-brand-primary"
              >
                <img 
                  src="/merchander.png" 
                  alt="Merchander Logo" 
                  className="h-8 w-auto dark:invert-0" 
                />
                <span className="hidden text-xl font-bold tracking-tight text-text-primary font-display sm:inline-block">
                  Merchander
                </span>
              </Link>
            )}
          </div>

          {/* Right actions + Theme toggle + Hamburger */}
          <div className="flex items-center gap-3">
            {/* Desktop Navigation Links */}
            {navItems.length > 0 && (
              <nav className="hidden items-center gap-1 md:flex mr-2" aria-label="Main Navigation">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={item.active ? "page" : undefined}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-[var(--radius-md,6px)] px-3 py-1.5 text-sm font-medium transition-colors duration-[var(--duration-fast,150ms)]",
                        item.active
                          ? "bg-brand-primary/10 font-semibold text-brand-primary"
                          : "text-text-secondary hover:bg-surface-elevated hover:text-brand-primary"
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}

            {actions && <div className="hidden items-center gap-2 sm:flex">{actions}</div>}
            
            {showThemeToggle && <ThemeToggle variant="toggle" className="cursor-pointer" />}

            {/* Mobile Hamburger Button */}
            {navItems.length > 0 && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md,6px)] border border-separator bg-surface text-text-secondary hover:bg-surface-elevated hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary md:hidden cursor-pointer"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title={
          logo || (
            <div className="flex items-center gap-2">
              <img 
                src="/merchander.png" 
                alt="Merchander Logo" 
                className="h-6 w-auto dark:invert-0" 
              />
              <span className="text-lg font-bold tracking-tight text-text-primary font-display">
                Merchander
              </span>
            </div>
          )
        }
        footer={actions ? <div className="flex flex-col gap-2">{actions}</div> : undefined}
      >
        <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-md,6px)] px-3 py-2.5 text-sm font-medium transition-colors",
                  item.active
                    ? "bg-brand-primary font-semibold text-white shadow-xs"
                    : "text-text-secondary hover:bg-surface-elevated hover:text-brand-primary"
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </MobileDrawer>
    </>
  );
};

