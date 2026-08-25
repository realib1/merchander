'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  'aria-label'?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = '', checked, defaultChecked, ...props }, ref) => {
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          role="switch"
          aria-checked={checked !== undefined ? checked : defaultChecked}
          className="sr-only peer"
          ref={ref}
          checked={checked}
          defaultChecked={defaultChecked}
          {...props}
        />
        <div
          className={cn(
            'w-11 h-6 bg-surface-elevated border border-separator rounded-full transition-colors duration-200',
            'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-brand-primary peer-focus-visible:ring-offset-2',
            'peer-checked:bg-emerald-600 peer-checked:border-emerald-600',
            "after:content-[''] after:absolute after:top-0.75 after:left-0.75 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all",
            'peer-checked:after:translate-x-full peer-checked:after:border-white',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
        />
      </label>
    );
  }
);

Switch.displayName = 'Switch';
