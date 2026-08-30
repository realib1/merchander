'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  'aria-label'?: string;
  ref?: React.Ref<HTMLInputElement>;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Switch({
  ref,
  className = '',
  checked,
  defaultChecked,
  onCheckedChange,
  onChange,
  disabled = false,
  readOnly = false,
  ...props
}: SwitchProps) {
  const isControlled = typeof checked === 'boolean';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;
    onChange?.(e);
    onCheckedChange?.(e.target.checked);
  };

  return (
    <label
      className={cn('relative inline-flex items-center', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}
    >
      <input
        {...props}
        type="checkbox"
        role="switch"
        aria-checked={isControlled ? checked : Boolean(defaultChecked)}
        className="sr-only peer"
        ref={ref}
        checked={isControlled ? checked : undefined}
        defaultChecked={isControlled ? undefined : defaultChecked}
        disabled={disabled}
        readOnly={readOnly}
        onChange={handleChange}
      />
      <div
        className={cn(
          'w-11 h-6 bg-surface-elevated border border-separator rounded-full transition-colors duration-200',
          'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-brand-primary peer-focus-visible:ring-offset-2',
          'peer-checked:bg-brand-primary peer-checked:border-brand-primary',
          "after:content-[''] after:absolute after:top-0.75 after:left-0.75 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all",
          'peer-checked:after:translate-x-full peer-checked:after:border-white',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      />
    </label>
  );
}
