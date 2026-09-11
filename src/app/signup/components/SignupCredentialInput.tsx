'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface SignupCredentialInputProps {
  label: string;
  type?: 'text' | 'email' | 'tel' | 'password';
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  autoComplete?: string;
}

export function SignupCredentialInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
}: SignupCredentialInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-foreground">{label}</label>
      <div className="relative">
        <input
          type={effectiveType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full py-2.5 rounded-xl border border-separator bg-background text-foreground placeholder:text-muted/60 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-medium transition-all shadow-xs ${
            isPassword ? 'pl-3.5 pr-10' : 'px-3.5'
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label={showPassword ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
