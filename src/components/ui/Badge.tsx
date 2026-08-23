import React from "react";
import { cn } from "@/utils/cn";

export type BadgeVariant = "default" | "success" | "warning" | "destructive" | "info";
export type BadgeSize = "sm" | "md";

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
    container:
      "bg-surface-elevated text-text-primary border border-separator",
    dot: "bg-text-secondary",
  },
  success: {
    container:
      "bg-brand-secondary/15 text-brand-secondary border border-brand-secondary/30",
    dot: "bg-brand-secondary",
  },
  warning: {
    container:
      "bg-warning/15 text-warning border border-warning/30",
    dot: "bg-warning",
  },
  destructive: {
    container:
      "bg-destructive/15 text-destructive border border-destructive/30",
    dot: "bg-destructive",
  },
  info: {
    container:
      "bg-info/15 text-info border border-info/30",
    dot: "bg-info",
  },
};

const SIZE_STYLES: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-caption gap-1 rounded-sm",
  md: "px-2.5 py-1 text-xs gap-1.5 rounded-md",
};

/**
 * Status and category indicator badge with optional status dot.
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className,
  ...props
}) => {
  const styles = VARIANT_STYLES[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center leading-none font-medium select-none",
        styles.container,
        SIZE_STYLES[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)}
          data-testid="badge-dot"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
