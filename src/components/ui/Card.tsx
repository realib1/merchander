import React from 'react';
import { cn } from '@/utils/cn';

export type CardVariant = 'default' | 'elevated' | 'interactive';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual depth and interaction variant */
  variant?: CardVariant;
  /** React 19 native ref */
  ref?: React.Ref<HTMLDivElement>;
}

const VARIANT_STYLES: Record<CardVariant, string> = {
  default: 'bg-surface border border-separator shadow-xs',
  elevated: 'bg-surface-elevated border border-separator shadow-md',
  interactive:
    'bg-surface border border-separator shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
};

/**
 * Universal content card container.
 * Modernized for React 19 standard ref prop and design tokens.
 */
export function Card({ ref, children, variant = 'default', className, ...props }: CardProps): React.JSX.Element {
  return (
    <div
      ref={ref}
      className={cn('overflow-hidden rounded-2xl text-primary', VARIANT_STYLES[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-1 border-b border-separator/50 p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg leading-tight font-semibold tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-secondary', className)} {...props}>
      {children}
    </p>
  );
}

export function CardBody({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center gap-3 border-t border-separator/50 p-5', className)} {...props}>
      {children}
    </div>
  );
}
