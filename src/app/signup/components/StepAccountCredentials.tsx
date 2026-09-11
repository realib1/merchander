'use client';

import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { getPasswordMatchStatus } from '@/utils/signup-validation';
import { SignupCredentialInput } from './SignupCredentialInput';

interface StepAccountCredentialsProps {
  fullName: string;
  setFullName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  termsAccepted: boolean;
  setTermsAccepted: (val: boolean) => void;
  onContinue: () => void;
}

export function StepAccountCredentials({
  fullName, setFullName, email, setEmail, phone, setPhone,
  password, setPassword, confirmPassword, setConfirmPassword,
  termsAccepted, setTermsAccepted, onContinue,
}: StepAccountCredentialsProps) {
  const match = getPasswordMatchStatus(password, confirmPassword);

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
        <SignupCredentialInput
          label="Full name"
          value={fullName}
          onChange={setFullName}
          placeholder="Your full name"
          autoComplete="name"
        />

        <SignupCredentialInput
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <SignupCredentialInput
          label="Phone number"
          type="tel"
          value={phone}
          onChange={setPhone}
          placeholder="024 123 4567"
          autoComplete="tel"
        />

        <SignupCredentialInput
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Create a password (min. 8 characters)"
          autoComplete="new-password"
        />

        <div>
          <SignupCredentialInput
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
          {match.showFeedback && (
            <p className={`text-xs font-medium flex items-center gap-1 mt-1.5 ${match.isMatching ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
              {match.isMatching && <Check size={12} />}
              {match.message}
            </p>
          )}
        </div>

        <div className="flex items-start gap-2 pt-1.5">
          <input
            id="terms-agreement"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded-sm border-separator text-brand-primary focus:ring-brand-primary/30 accent-brand-primary cursor-pointer"
          />
          <label htmlFor="terms-agreement" className="text-xs text-muted leading-relaxed cursor-pointer select-none">
            I agree to the{' '}
            <Link href="/terms" target="_blank" className="font-semibold text-brand-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" target="_blank" className="font-semibold text-brand-primary hover:underline">
              Privacy Policy
            </Link>.
          </label>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.99] text-white rounded-xl text-sm font-bold shadow-sm shadow-brand-primary/25 transition-all cursor-pointer mt-2"
        >
          Continue to Store Setup
        </button>

        <div className="pt-2 text-sm text-muted font-medium text-center">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-brand-primary hover:text-brand-primary-hover hover:underline transition-colors ml-1">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
