"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { cn } from "@/utils/cn";
import type { SelectOption } from "@/types/common";

export interface SelectProps {
  /** Array of selectable options */
  options: SelectOption[];
  /** Currently selected value */
  value?: string;
  /** Callback when selected value changes */
  onChange?: (value: string) => void;
  /** Label for the input */
  label?: string;
  /** Placeholder when no option is selected */
  placeholder?: string;
  /** Optional error message */
  error?: string;
  /** Disable the select component */
  disabled?: boolean;
  /** Allow filtering options by searching */
  searchable?: boolean;
  /** Allow clearing selected value */
  clearable?: boolean;
  /** Custom class for the wrapper */
  className?: string;
}

/**
 * Custom accessible dropdown selector with search and clear support.
 */
export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = "Select an option",
  error,
  disabled = false,
  searchable = false,
  clearable = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string): void => {
    onChange?.(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onChange?.("");
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter" || e.key === " ") {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative flex w-full flex-col gap-1.5 text-left", className)}
    >
      {label && (
        <label
          id={`${id}-label`}
          className="text-xs font-semibold text-[var(--color-text-primary)] select-none"
        >
          {label}
        </label>
      )}

      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        aria-haspopup="listbox"
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex min-h-[44px] w-full items-center justify-between rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3.5 py-2 text-sm",
          "cursor-pointer transition-colors duration-150 outline-none select-none",
          "focus-visible:ring-3 focus-visible:ring-offset-1",
          error
            ? "border-[var(--color-destructive)] focus-visible:ring-[var(--color-destructive)]/30"
            : "border-[var(--color-border)] focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-[var(--color-brand-primary)]/30",
          disabled && "cursor-not-allowed bg-[var(--color-surface-elevated)] opacity-50"
        )}
      >
        <span className={cn(!selectedOption && "text-[var(--color-text-muted)]")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="ml-2 flex items-center gap-1.5">
          {clearable && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear selection"
              className="rounded-full p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          <svg
            className={cn(
              "h-4 w-4 text-[var(--color-text-muted)] transition-transform duration-200",
              isOpen && "rotate-180"
            )}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {isOpen && !disabled && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1 shadow-lg"
        >
          {searchable && (
            <div className="border-b border-[var(--color-border)] p-1.5">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand-primary)]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-center text-xs text-[var(--color-text-muted)]">
              No options found
            </div>
          ) : (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                aria-disabled={opt.disabled}
                onClick={() => !opt.disabled && handleSelect(opt.value)}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-sm select-none",
                  opt.value === value
                    ? "bg-[var(--color-brand-primary)] font-medium text-white"
                    : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]",
                  opt.disabled && "cursor-not-allowed opacity-40"
                )}
              >
                <span>{opt.label}</span>
                {opt.value === value && (
                  <svg
                    className="h-4 w-4 text-current"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-[var(--color-destructive)]">
          {error}
        </p>
      )}
    </div>
  );
};
