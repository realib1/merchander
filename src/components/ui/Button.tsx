"use client";

import React from "react";
import { cn } from "@/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

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
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-primary text-white hover:opacity-90 active:scale-[0.98] shadow-sm",
  secondary:
    "bg-brand-secondary text-white hover:opacity-90 active:scale-[0.98] shadow-sm",
  outline:
    "border border-separator bg-transparent text-primary hover:bg-surface-elevated active:scale-[0.98]",
  ghost:
    "bg-transparent text-primary hover:bg-surface-elevated active:scale-[0.98]",
  destructive:
    "bg-destructive text-white hover:opacity-90 active:scale-[0.98] shadow-sm",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 min-h-[36px]",
  md: "h-10 px-4 text-sm gap-2 min-h-[44px]",
  lg: "h-12 px-6 text-base gap-2.5 min-h-[48px]",
};

/**
 * Primary action trigger with loading states, icon slots, and accessibility focus rings.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      type = "button",
      ...props
    },
    ref
  ): React.JSX.Element => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 select-none",
          "cursor-pointer rounded-md disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:ring-3 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:outline-none",
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
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
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
);

Button.displayName = "Button";
