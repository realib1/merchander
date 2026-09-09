'use client';

import React, { useState } from 'react';
import { User, Mail, Phone, Key, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { generateInitialPassword } from '@/utils/merchant-provisioning';

interface OwnerCredentialsSectionProps {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  password: string;
  onOwnerNameChange: (val: string) => void;
  onOwnerEmailChange: (val: string) => void;
  onOwnerPhoneChange: (val: string) => void;
  onPasswordChange: (val: string) => void;
}

export function OwnerCredentialsSection({
  ownerName,
  ownerEmail,
  ownerPhone,
  password,
  onOwnerNameChange,
  onOwnerEmailChange,
  onOwnerPhoneChange,
  onPasswordChange,
}: OwnerCredentialsSectionProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleGenerate = () => {
    const generated = generateInitialPassword();
    onPasswordChange(generated);
    setShowPassword(true);
  };

  return (
    <div className="space-y-3 pt-4 border-t border-separator/60">
      <div className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
        <User size={13} />
        <span>3. Owner Identity & Initial Credentials</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="font-semibold text-secondary block text-xs">Owner Full Name</label>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="e.g. Kofi Mensah"
              value={ownerName}
              onChange={(e) => onOwnerNameChange(e.target.value)}
              className="w-full bg-surface-elevated border border-separator rounded-xl pl-8 pr-3 py-2 text-foreground focus:outline-hidden focus:border-brand text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-secondary block text-xs">
            Owner Email <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="email"
              required
              placeholder="merchant@example.com"
              value={ownerEmail}
              onChange={(e) => onOwnerEmailChange(e.target.value)}
              className="w-full bg-surface-elevated border border-separator rounded-xl pl-8 pr-3 py-2 text-foreground focus:outline-hidden focus:border-brand font-mono text-xs"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="font-semibold text-secondary block text-xs">WhatsApp Phone Number</label>
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="tel"
              placeholder="+233 24 123 4567"
              value={ownerPhone}
              onChange={(e) => onOwnerPhoneChange(e.target.value)}
              className="w-full bg-surface-elevated border border-separator rounded-xl pl-8 pr-3 py-2 text-foreground focus:outline-hidden focus:border-brand font-mono text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-secondary block text-xs">Temporary Password</label>
            <button
              type="button"
              onClick={handleGenerate}
              className="text-[10px] text-brand hover:underline flex items-center gap-1 font-mono cursor-pointer"
            >
              <RefreshCw size={10} />
              <span>Generate</span>
            </button>
          </div>
          <div className="relative">
            <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Leave blank to auto-generate"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full bg-surface-elevated border border-separator rounded-xl pl-8 pr-8 py-2 text-foreground focus:outline-hidden focus:border-brand font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
