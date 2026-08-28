/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type ThemeMode } from '@/context/ThemeContext';
import { cn } from '@/utils/cn';

export interface ThemeToggleProps {
  /** Visual variant: simple toggle button, compact icon button, or 3-way dropdown/segmented control */
  variant?: 'toggle' | 'segmented' | 'dropdown';
  /** Whether to show a text label alongside the icon */
  showLabel?: boolean;
  /** Additional CSS class names */
  className?: string;
}

const THEME_OPTIONS: Array<{
  value: ThemeMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

/**
 * Accessible theme switcher component supporting light, dark, and system preference modes.
 */
export function ThemeToggle({ variant = 'toggle', showLabel = false, className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (variant === 'segmented') {
    return (
      <div
        role="group"
        aria-label="Select theme"
        className={cn(
          'inline-flex items-center rounded-md border border-separator bg-surface p-1 shadow-xs',
          className
        )}
      >
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
          const isActive = theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              aria-pressed={isActive}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-brand-primary',
                isActive
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-secondary hover:bg-surface-elevated hover:text-brand-primary'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {showLabel && <span>{label}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label="Theme selector"
          className="inline-flex items-center gap-2 rounded-md border border-separator bg-surface px-3 py-1.5 text-sm font-medium text-primary shadow-xs transition-colors hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-brand-primary"
        >
          {!mounted ? (
            <div className="h-4 w-4" />
          ) : theme === 'system' ? (
            <Monitor className="h-4 w-4 text-secondary" />
          ) : resolvedTheme === 'dark' ? (
            <Moon className="h-4 w-4 text-secondary" />
          ) : (
            <Sun className="h-4 w-4 text-brand-primary" />
          )}
          {showLabel && (
            <span className="capitalize">{!mounted ? '' : theme === 'system' ? `Auto (${resolvedTheme})` : theme}</span>
          )}
        </button>

        {isOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            className="absolute right-0 z-50 mt-1.5 w-36 origin-top-right rounded-md border border-separator bg-surface-elevated p-1 shadow-lg ring-1 ring-black/5 transition-all"
          >
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
              const isSelected = mounted && theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setTheme(value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs font-medium transition-colors',
                    isSelected
                      ? 'bg-brand-primary text-white'
                      : 'text-primary hover:bg-surface hover:text-brand-primary'
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Default: Simple binary toggle button
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={!mounted ? 'Toggle theme' : resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-separator bg-surface text-primary shadow-xs transition-all duration-150 hover:bg-surface-elevated hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary',
        className
      )}
    >
      {!mounted ? (
        <div className="h-4 w-4" />
      ) : resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4 transition-transform duration-150 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-150 hover:-rotate-12" />
      )}
    </button>
  );
}
