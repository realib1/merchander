'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface CheckboxProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  className,
  id,
  ...props
}: CheckboxProps) {
  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={cn(
        'inline-flex items-start gap-2.5 select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <button
        type="button"
        role="checkbox"
        id={id}
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-offset-1 cursor-pointer',
          checked
            ? 'border-brand-primary bg-brand-primary text-white shadow-xs'
            : 'border-separator bg-surface hover:border-text-secondary/50'
        )}
        {...props}
      >
        {checked && <Check className="h-3.2 w-3.2 stroke-3 animate-scaleIn text-white" aria-hidden="true" />}
      </button>

      {(label || description) && (
        <div className="space-y-0.5 leading-none cursor-pointer" onClick={handleClick}>
          {label && <p className="text-xs font-semibold text-foreground">{label}</p>}
          {description && <p className="text-[11px] text-muted">{description}</p>}
        </div>
      )}
    </div>
  );
}
