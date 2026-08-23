'use client';

import * as React from 'react';

type SwitchProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" ref={ref} {...props} />
        <div className={`w-11 h-6 [&]:bg-surface-elevated [&]:border [&]:border-separator peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/50 rounded-full peer peer-checked:after:translate-x-full  after:content-[''] after:absolute after:top-0.75 after:left-0.75 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-500 peer-checked:border-emerald-500 hover:bg-slate-600 peer-checked:hover:bg-emerald-400 ${className}`}></div>
      </label>
    );
  }
);

Switch.displayName = 'Switch';
