'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'success' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size dimension of the button */
  size?: ButtonSize;
  /** Displays loading spinner and disables interactions */
  isLoading?: boolean;
  /** Optional icon to render before children */
  leftIcon?: React.ReactNode;
  /** Optional icon to render after children */
  rightIcon?: React.ReactNode;
  /** React 19 native ref */
  ref?: React.Ref<HTMLButtonElement>;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-primary text-white hover:bg-brand-primary-hover active:scale-[0.98] shadow-xs font-semibold',
  secondary:
    'bg-surface text-foreground border border-separator hover:bg-surface-elevated hover:border-separator/80 dark:bg-surface-elevated dark:text-foreground dark:border-separator dark:hover:bg-surface shadow-2xs font-semibold active:scale-[0.98]',
  outline:
    'border border-separator bg-transparent text-foreground hover:bg-surface-elevated dark:border-separator dark:text-foreground dark:hover:bg-surface-elevated font-semibold active:scale-[0.98]',
  ghost:
    'bg-transparent text-secondary hover:text-foreground hover:bg-surface-elevated dark:text-secondary dark:hover:text-foreground dark:hover:bg-surface-elevated font-semibold active:scale-[0.98]',
  destructive:
    'bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive dark:text-white shadow-xs font-semibold active:scale-[0.98]',
  success:
    'bg-success text-white hover:bg-success/90 dark:bg-success dark:text-white shadow-xs font-semibold active:scale-[0.98]',
  subtle:
    'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 dark:bg-brand-primary/15 dark:text-brand-primary-400 dark:hover:bg-brand-primary/25 font-semibold active:scale-[0.98]',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 min-h-8',
  md: 'h-9 px-4 text-sm gap-2 min-h-9',
  lg: 'h-10 px-5 text-sm gap-2.5 min-h-10',
};

/**
 * Primary action trigger with loading states, icon slots, and accessibility focus rings.
 * Modernized for React 19 standard ref prop and design tokens.
 */
export function Button({
  ref,
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  type = 'button',
  ...props
}: ButtonProps): React.JSX.Element {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={cn(
        'inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer',
        'rounded-lg disabled:cursor-not-allowed disabled:opacity-40',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        variant === 'destructive' ? 'focus-visible:ring-destructive' : 'focus-visible:ring-brand-primary',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            data-testid="loading-spinner"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
