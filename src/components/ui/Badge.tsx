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
    container: 'bg-surface-elevated text-primary',
    dot: 'bg-text-secondary',
  },
  success: {
    container: 'bg-success/15 text-success',
    dot: 'bg-success',
  },
  warning: {
    container: 'bg-warning/15 text-warning',
    dot: 'bg-warning',
  },
  destructive: {
    container: 'bg-destructive/15 text-destructive',
    dot: 'bg-destructive',
  },
  info: {
    container: 'bg-info/15 text-info',
    dot: 'bg-info',
  },
};

const SIZE_STYLES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-caption gap-1 rounded-full',
  md: 'px-2.5 py-1 text-xs gap-1.5 rounded-full',
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
