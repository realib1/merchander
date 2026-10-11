import React from 'react';
import { cn } from '@/utils/cn';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual style variant */
  variant?: BadgeVariant;
  /** Size dimension of the badge */
  size?: BadgeSize;
  /** Displays a small status dot indicator */
  dot?: boolean;
}

const VARIANT_STYLES: Record<BadgeVariant, { container: string; dot: string }> = {
  default: {
    container: 'bg-[oklch(0.96_0.01_260)] text-[oklch(0.45_0.02_260)] dark:bg-white/10 dark:text-muted-foreground',
    dot: 'bg-[oklch(0.7_0.01_260)] dark:bg-muted-foreground',
  },
  success: {
    container: 'bg-[oklch(0.95_0.04_150)] text-[oklch(0.38_0.1_150)] dark:bg-emerald-500/15 dark:text-emerald-300',
    dot: 'bg-[oklch(0.65_0.15_150)] dark:bg-emerald-400',
  },
  warning: {
    container: 'bg-[oklch(0.96_0.05_85)] text-[oklch(0.42_0.1_70)] dark:bg-amber-500/15 dark:text-amber-300',
    dot: 'bg-[oklch(0.75_0.15_85)] dark:bg-amber-400',
  },
  destructive: {
    container: 'bg-[oklch(0.95_0.04_25)] text-[oklch(0.45_0.18_25)] dark:bg-red-500/15 dark:text-red-300',
    dot: 'bg-[oklch(0.55_0.22_25)] dark:bg-red-400',
  },
  info: {
    container: 'bg-[oklch(0.95_0.03_250)] text-[oklch(0.42_0.14_255)] dark:bg-blue-500/15 dark:text-blue-300',
    dot: 'bg-[oklch(0.6_0.15_250)] dark:bg-blue-400',
  },
};

const SIZE_STYLES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs font-semibold gap-1 rounded-full',
  md: 'px-2.5 py-1 text-xs font-semibold gap-1.5 rounded-full',
};

/**
 * Status and category indicator badge with optional status dot.
 */
export function Badge({ children, variant = 'default', size = 'md', dot = false, className, ...props }: BadgeProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center leading-none font-medium select-none',
        styles.container,
        SIZE_STYLES[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', styles.dot)}
          data-testid="badge-dot"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
