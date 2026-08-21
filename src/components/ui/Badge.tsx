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
      "bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border)]",
    dot: "bg-[var(--color-text-secondary)]",
  },
  success: {
    container:
      "bg-[var(--color-brand-secondary)]/15 text-[var(--color-brand-secondary)] border border-[var(--color-brand-secondary)]/30",
    dot: "bg-[var(--color-brand-secondary)]",
  },
  warning: {
    container:
      "bg-[var(--color-warning)]/15 text-[var(--color-warning)] border border-[var(--color-warning)]/30",
    dot: "bg-[var(--color-warning)]",
  },
  destructive: {
    container:
      "bg-[var(--color-destructive)]/15 text-[var(--color-destructive)] border border-[var(--color-destructive)]/30",
    dot: "bg-[var(--color-destructive)]",
  },
  info: {
    container:
      "bg-[var(--color-info)]/15 text-[var(--color-info)] border border-[var(--color-info)]/30",
    dot: "bg-[var(--color-info)]",
  },
};

const SIZE_STYLES: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px] gap-1 rounded-[var(--radius-sm)]",
  md: "px-2.5 py-1 text-xs gap-1.5 rounded-[var(--radius-md)]",
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
