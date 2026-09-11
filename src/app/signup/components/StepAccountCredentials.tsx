'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

interface StepAccountCredentialsProps {
  fullName: string;
  setFullName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  onContinue: () => void;
}

export function StepAccountCredentials({
  fullName,
  setFullName,
  email,
  setEmail,
  phone,
  setPhone,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  onContinue,
}: StepAccountCredentialsProps) {
  return (
    <div className="space-y-4 animate-in fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
          Create your account
        </h1>
        <p className="text-xs sm:text-sm text-muted font-medium mt-1">
          Get started in minutes. No complicated steps, just your business, online.
        </p>
      </div>

      <div className="space-y-3 pt-1">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-foreground">
            Full name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            autoComplete="name"
            className="w-full px-3.5 py-2.5 rounded-xl border border-separator bg-background text-foreground placeholder:text-muted/60 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-medium transition-all shadow-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-foreground">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full px-3.5 py-2.5 rounded-xl border border-separator bg-background text-foreground placeholder:text-muted/60 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-medium transition-all shadow-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-foreground">
            Phone number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="024 123 4567"
            autoComplete="tel"
            className="w-full px-3.5 py-2.5 rounded-xl border border-separator bg-background text-foreground placeholder:text-muted/60 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-medium transition-all shadow-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-foreground">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              autoComplete="new-password"
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-separator bg-background text-foreground placeholder:text-muted/60 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-medium transition-all shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground transition-colors focus:outline-hidden cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.99] text-white rounded-xl text-sm font-bold shadow-sm shadow-brand-primary/25 transition-all cursor-pointer mt-3"
        >
          Continue to Store Setup
        </button>

        <div className="pt-2 text-sm text-muted font-medium text-center">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-bold text-brand-primary hover:text-brand-primary-hover hover:underline transition-colors ml-1"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
