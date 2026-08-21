import React from "react";
import { cn } from "@/utils/cn";

export type CardVariant = "default" | "elevated" | "interactive";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual depth and interaction variant */
  variant?: CardVariant;
}

const VARIANT_STYLES: Record<CardVariant, string> = {
  default: "bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs",
  elevated: "bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-md",
  interactive:
    "bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer",
};

/**
 * Universal content card container.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = "default", className, ...props }, ref): React.JSX.Element => {
    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden rounded-[var(--radius-lg)] text-[var(--color-text-primary)]",
          VARIANT_STYLES[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col gap-1 border-b border-[var(--color-border)]/50 p-5", className)}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => (
  <h3 className={cn("text-lg leading-tight font-semibold tracking-tight", className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => (
  <p className={cn("text-xs text-[var(--color-text-secondary)]", className)} {...props}>
    {children}
  </p>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn("p-5", className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex items-center gap-3 border-t border-[var(--color-border)]/50 p-5",
      className
    )}
    {...props}
  >
    {children}
  </div>
);
