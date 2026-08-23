"use client";

import React, { useId } from "react";
import { cn } from "@/utils/cn";

export interface FormFieldProps extends React.InputHTMLAttributes<
  HTMLInputElement | HTMLTextAreaElement
> {
  /** Field label text */
  label?: string;
  /** Helper/hint text rendered below input */
  hint?: string;
  /** Validation error message */
  error?: string;
  /** Render as a multiline textarea instead of standard input */
  isTextarea?: boolean;
  /** Number of rows when isTextarea is true */
  rows?: number;
  /** Optional icon to render inside left of input */
  leftIcon?: React.ReactNode;
  /** Optional icon to render inside right of input */
  rightIcon?: React.ReactNode;
}

/**
 * Universal FormField wrapper providing labels, validation error display, hints, and icons.
 */
export const FormField = React.forwardRef<HTMLInputElement & HTMLTextAreaElement, FormFieldProps>(
  (
    {
      id: customId,
      label,
      hint,
      error,
      required,
      disabled,
      isTextarea = false,
      rows = 3,
      leftIcon,
      rightIcon,
      className,
      ...props
    },
    ref
  ): React.JSX.Element => {
    const generatedId = useId();
    const id = customId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    const baseInputStyles = cn(
      "w-full rounded-md border bg-surface px-3.5 py-2 text-sm",
      "text-primary placeholder:text-muted",
      "transition-colors duration-150 outline-none",
      "focus-visible:ring-2",
      leftIcon && "pl-10",
      rightIcon && "pr-10",
      error
        ? "border-destructive focus-visible:ring-destructive"
        : "border-separator focus-visible:ring-brand-primary",
      disabled && "opacity-50 cursor-not-allowed bg-surface-elevated",
      className
    );

    return (
      <div className="flex w-full flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={id}
            className="flex items-center gap-1 text-xs font-semibold text-primary select-none"
          >
            {label}
            {required && (
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex w-full items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-muted">
              {leftIcon}
            </div>
          )}

          {isTextarea ? (
            <textarea
              ref={ref as unknown as React.ForwardedRef<HTMLTextAreaElement>}
              id={id}
              rows={rows}
              disabled={disabled}
              required={required}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : hint ? hintId : undefined}
              className={baseInputStyles}
              {...props}
            />
          ) : (
            <input
              ref={ref as unknown as React.ForwardedRef<HTMLInputElement>}
              id={id}
              disabled={disabled}
              required={required}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : hint ? hintId : undefined}
              className={baseInputStyles}
              {...props}
            />
          )}

          {rightIcon && (
            <div className="pointer-events-none absolute right-3 flex items-center text-muted">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className="animate-fadeIn text-xs font-medium text-destructive"
          >
            {error}
          </p>
        )}

        {!error && hint && (
          <p id={hintId} className="text-xs text-secondary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
