'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Building2, LogOut, Moon, Sun, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeToggle } from '../ThemeToggle';
import { createClient } from '@/lib/supabase/client';

export interface UserProfileInfo {
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: string;
}

interface UserProfileDropdownProps {
  user: UserProfileInfo;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function UserProfileDropdown({ user, isOpen, onToggle, onClose }: UserProfileDropdownProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const hasValidImage = Boolean(user.avatarUrl && failedUrl !== user.avatarUrl);

  const handleSignOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign-out error:', err);
    }
    window.location.replace('/login');
  };

  const userInitial = user.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : user.email
      ? user.email.charAt(0).toUpperCase()
      : 'U';

  return (
    <div className="relative ml-1">
      <button
        onClick={onToggle}
        aria-label="User profile menu"
        className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated border border-separator/60 transition-all cursor-pointer shadow-2xs group"
      >
        <div className="w-7 h-7 shrink-0 rounded-full bg-linear-to-tr from-brand-secondary to-brand-primary p-0.5 shadow-2xs">
          <div className="w-full h-full rounded-full bg-surface flex items-center justify-center overflow-hidden">
            {hasValidImage && user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={user.avatarUrl}
                src={user.avatarUrl}
                alt={user.fullName}
                onError={() => setFailedUrl(user.avatarUrl || null)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-foreground">{userInitial}</span>
            )}
          </div>
        </div>
        <div className="hidden sm:flex flex-col text-left min-w-0 max-w-32">
          <p className="text-xs font-semibold truncate leading-tight text-foreground group-hover:text-brand-primary transition-colors">
            {user.fullName || 'Admin User'}
          </p>
          <p className="text-[10px] text-muted truncate leading-tight">{user.email}</p>
        </div>
        <ChevronDown
          size={13}
          className="text-muted hidden sm:block shrink-0 group-hover:text-foreground transition-colors"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-68 bg-surface border border-separator rounded-2xl shadow-xl z-50 p-1 overflow-hidden"
          >
            {/* Identity Card */}
            <div className="p-3 border-b border-separator/50 bg-surface-elevated/30 rounded-xl mb-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 shrink-0 rounded-full bg-linear-to-tr from-brand-secondary to-brand-primary p-0.5 shadow-xs">
                  <div className="w-full h-full rounded-full bg-surface flex items-center justify-center overflow-hidden">
                    {hasValidImage && user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={user.avatarUrl}
                        src={user.avatarUrl}
                        alt={user.fullName}
                        onError={() => setFailedUrl(user.avatarUrl || null)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-foreground">{userInitial}</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold truncate text-foreground leading-tight">
                      {user.fullName || 'Admin User'}
                    </p>
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-semibold bg-brand-primary/10 text-brand-primary uppercase tracking-wider shrink-0">
                      {user.role || 'Admin'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted truncate mt-0.5 leading-tight">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Mobile Theme Toggle */}
            <div className="p-1 sm:hidden border-b border-separator/50">
              <div className="w-full px-3 py-2 text-xs text-foreground flex items-center justify-between transition-colors">
                <span className="flex items-center gap-2">
                  <Moon size={15} className="text-muted hidden dark:block" />
                  <Sun size={15} className="text-muted block dark:hidden" />
                  Theme
                </span>
                <ThemeToggle />
              </div>
            </div>

            {/* Menu Links */}
            <div className="p-1 space-y-0.5">
              <Link
                href="/dashboard/settings/profile"
                onClick={onClose}
                className="w-full text-left px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-elevated rounded-lg flex items-center gap-2.5 transition-colors"
              >
                <User size={15} className="text-muted" />
                Account Profile
              </Link>
              <Link
                href="/dashboard/settings/business-profile"
                onClick={onClose}
                className="w-full text-left px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-elevated rounded-lg flex items-center gap-2.5 transition-colors"
              >
                <Building2 size={15} className="text-muted" />
                Business Profile
              </Link>
            </div>

            {/* Sign Out */}
            <div className="border-t border-separator/50 p-1.5 mt-1">
              <form action="/auth/signout" method="post" onSubmit={handleSignOut}>
                <button
                  type="submit"
                  disabled={isSigningOut}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LogOut size={14} className="shrink-0" />
                  <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
