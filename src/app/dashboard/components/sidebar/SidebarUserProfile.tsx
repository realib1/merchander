'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogOut, Loader2 } from 'lucide-react';

interface SidebarUserProfileProps {
  isDesktopCollapsed: boolean;
  userEmail: string;
  userName: string;
  userRole: string;
  avatarUrl?: string | null;
  isLoggingOut: boolean;
  onLogout: () => void;
  onNavigate: () => void;
}

export function SidebarUserProfile({
  isDesktopCollapsed,
  userEmail,
  userName,
  userRole,
  avatarUrl,
  isLoggingOut,
  onLogout,
  onNavigate,
}: SidebarUserProfileProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const hasValidImage = Boolean(avatarUrl && failedUrl !== avatarUrl);

  const userInitial = userName ? userName.charAt(0).toUpperCase() : userEmail ? userEmail.charAt(0).toUpperCase() : 'U';

  return (
    <div className="p-3 border-t border-separator/60">
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-surface-elevated/40 border border-separator/40 hover:border-separator transition-all">
        <Link
          href="/dashboard/settings/profile"
          onClick={onNavigate}
          className="flex items-center gap-2.5 min-w-0 flex-1 group cursor-pointer"
        >
          <div className="w-8 h-8 shrink-0 rounded-full bg-linear-to-tr from-brand-secondary to-brand-primary p-0.5 shadow-2xs">
            <div className="w-full h-full rounded-full bg-surface flex items-center justify-center overflow-hidden">
              {hasValidImage && avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={avatarUrl}
                  src={avatarUrl}
                  alt={userName}
                  onError={() => setFailedUrl(avatarUrl)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-foreground">{userInitial}</span>
              )}
            </div>
          </div>

          {!isDesktopCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold truncate text-foreground group-hover:text-brand-primary transition-colors leading-tight">
                  {userName}
                </p>
                <span className="px-1.5 py-0.2 rounded text-[8px] font-semibold bg-brand-primary/10 text-brand-primary uppercase tracking-wider shrink-0">
                  {userRole}
                </span>
              </div>
              <p className="text-[10px] text-muted truncate leading-tight mt-0.5">{userEmail}</p>
            </div>
          )}
        </Link>

        {!isDesktopCollapsed && (
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Sign out"
            aria-label="Sign out"
          >
            {isLoggingOut ? <Loader2 size={15} className="animate-spin text-red-500" /> : <LogOut size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}
